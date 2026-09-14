import { PublicKey } from "@solana/web3.js";
import { TREASURY_USDT_ATA, USDT_MINT } from "./config.mjs";
import { settleVerifiedPayment } from "./payment-settlement.mjs";
import {
  ensureReconciliationIndexes,
  flagCandidateReconciliationIssue,
  getOrderIdByReference,
  listCandidateSignatures,
  listReferenceAddresses,
  listTerminalReconciliationSignatures,
  recordReconciliationPayment,
  recordReconciliationRun,
  removeCandidateSignature
} from "./store.mjs";

const RPC_CONFIG = { commitment: "finalized", maxSupportedTransactionVersion: 0 };
const MAX_CANDIDATES = 30;
const MAX_TREASURY_SIGNATURES = 40;
const RPC_BATCH_SIZE = 20;

const defaultDependencies = {
  ensureReconciliationIndexes,
  flagCandidateReconciliationIssue,
  getOrderIdByReference,
  listCandidateSignatures,
  listReferenceAddresses,
  listTerminalReconciliationSignatures,
  recordReconciliationPayment,
  recordReconciliationRun,
  removeCandidateSignature,
  settleVerifiedPayment
};

function keyText(value) {
  if (typeof value === "string") return value;
  if (value?.toBase58) return value.toBase58();
  if (value?.pubkey?.toBase58) return value.pubkey.toBase58();
  return String(value?.pubkey || value || "");
}

export function transactionAccountKeys(parsed) {
  return (parsed?.transaction?.message?.accountKeys || []).map(keyText);
}

export function treasuryUsdtCredit(parsed) {
  if (!parsed?.meta || parsed.meta.err) return 0n;
  const treasuryIndex = transactionAccountKeys(parsed).indexOf(TREASURY_USDT_ATA);
  if (treasuryIndex < 0) return 0n;
  const balance = entries => entries?.find(item => item.accountIndex === treasuryIndex && item.mint === USDT_MINT)?.uiTokenAmount?.amount || "0";
  const before = BigInt(balance(parsed.meta.preTokenBalances));
  const after = BigInt(balance(parsed.meta.postTokenBalances));
  return after > before ? after - before : 0n;
}

async function fetchBatch(connection, signatures, batchMethod, singleMethod) {
  const values = new Map();
  for (let offset = 0; offset < signatures.length; offset += RPC_BATCH_SIZE) {
    const batch = signatures.slice(offset, offset + RPC_BATCH_SIZE);
    try {
      const results = await connection[batchMethod](batch, RPC_CONFIG);
      batch.forEach((signature, index) => values.set(signature, results[index] || null));
    } catch {
      const results = await Promise.allSettled(batch.map(signature => connection[singleMethod](signature, RPC_CONFIG)));
      results.forEach((result, index) => values.set(batch[index], result.status === "fulfilled" ? result.value : null));
    }
  }
  return values;
}

function safeErrorCode(error) {
  return String(error?.code || "RECONCILIATION_ERROR").replace(/[^A-Z0-9_-]/gi, "_").slice(0, 80);
}

export async function runPaymentReconciliation({ connection, dependencies = {} }) {
  const deps = { ...defaultDependencies, ...dependencies };
  const startedAt = new Date().toISOString();
  const summary = {
    startedAt,
    completedAt: null,
    status: "running",
    indexed: 0,
    candidates: 0,
    treasuryTransactions: 0,
    incomingCredits: 0,
    matched: 0,
    alreadyPaid: 0,
    pendingFinalization: 0,
    unmatched: 0,
    mismatched: 0,
    errors: []
  };

  const backfill = await deps.ensureReconciliationIndexes();
  summary.indexed = backfill.indexed || 0;
  const [candidates, referenceAddresses, terminalSignatures, treasuryEntries] = await Promise.all([
    deps.listCandidateSignatures(MAX_CANDIDATES),
    deps.listReferenceAddresses(),
    deps.listTerminalReconciliationSignatures(),
    connection.getSignaturesForAddress(new PublicKey(TREASURY_USDT_ATA), { limit: MAX_TREASURY_SIGNATURES }, "finalized")
  ]);
  summary.candidates = candidates.length;
  const candidateBySignature = new Map(candidates.map(record => [record.signature, record]));
  const treasurySignatures = treasuryEntries
    .filter(entry => !entry.err && !terminalSignatures.has(entry.signature))
    .map(entry => entry.signature);
  summary.treasuryTransactions = treasurySignatures.length;
  const signatures = [...new Set([...candidateBySignature.keys(), ...treasurySignatures])];
  const parsedBySignature = await fetchBatch(connection, signatures, "getParsedTransactions", "getParsedTransaction");

  const targets = new Map();
  for (const [signature, candidate] of candidateBySignature) {
    targets.set(signature, { signature, orderId: candidate.orderId, source: "candidate", reference: null, credit: 0n });
  }

  for (const signature of treasurySignatures) {
    const parsed = parsedBySignature.get(signature);
    if (!parsed) continue;
    const credit = treasuryUsdtCredit(parsed);
    if (credit <= 0n) continue;
    summary.incomingCredits += 1;
    const reference = transactionAccountKeys(parsed).find(key => referenceAddresses.has(key)) || null;
    if (!reference) {
      summary.unmatched += 1;
      await deps.recordReconciliationPayment(signature, {
        status: "unmatched_incoming",
        amountBaseUnits: credit.toString(),
        blockTime: parsed.blockTime || null
      });
      continue;
    }
    const orderId = await deps.getOrderIdByReference(reference);
    if (!orderId) {
      summary.unmatched += 1;
      await deps.recordReconciliationPayment(signature, {
        status: "unmatched_reference",
        reference,
        amountBaseUnits: credit.toString(),
        blockTime: parsed.blockTime || null
      });
      continue;
    }
    const existing = targets.get(signature);
    targets.set(signature, {
      signature,
      orderId: existing?.orderId || orderId,
      source: existing ? "candidate_and_treasury" : "treasury_scan",
      reference,
      credit
    });
  }

  const finalizedTargets = [...targets.values()].filter(target => parsedBySignature.get(target.signature));
  const rawBySignature = await fetchBatch(
    connection,
    finalizedTargets.map(target => target.signature),
    "getTransactions",
    "getTransaction"
  );

  for (const target of targets.values()) {
    const parsed = parsedBySignature.get(target.signature);
    const raw = rawBySignature.get(target.signature);
    if (!parsed || !raw) {
      summary.pendingFinalization += 1;
      continue;
    }
    try {
      const settled = await deps.settleVerifiedPayment({
        orderId: target.orderId,
        signature: target.signature,
        parsed,
        raw,
        source: "scheduled_reconciliation"
      });
      if (settled.alreadyPaid) summary.alreadyPaid += 1;
      else summary.matched += 1;
      await deps.recordReconciliationPayment(target.signature, {
        status: settled.alreadyPaid ? "already_paid" : "matched_paid",
        orderId: target.orderId,
        reference: target.reference || settled.order.reference,
        amountBaseUnits: target.credit > 0n ? target.credit.toString() : settled.order.amountBaseUnits,
        blockTime: parsed.blockTime || null
      });
    } catch (error) {
      const code = safeErrorCode(error);
      summary.mismatched += 1;
      summary.errors.push({ signature: target.signature, orderId: target.orderId, code });
      await deps.recordReconciliationPayment(target.signature, {
        status: parsed.meta?.err ? "candidate_transaction_failed" : "payment_mismatch",
        orderId: target.orderId,
        reference: target.reference,
        amountBaseUnits: target.credit > 0n ? target.credit.toString() : null,
        blockTime: parsed.blockTime || null,
        errorCode: code
      });
      if (candidateBySignature.has(target.signature) && Number(error?.status || 500) < 500) {
        await deps.flagCandidateReconciliationIssue(target.orderId, target.signature, error, Boolean(parsed.meta?.err));
        await deps.removeCandidateSignature(target.signature, target.orderId);
      }
    }
  }

  summary.status = summary.errors.length ? "completed_with_issues" : "completed";
  summary.completedAt = new Date().toISOString();
  summary.errors = summary.errors.slice(0, 20);
  await deps.recordReconciliationRun(summary);
  return summary;
}
