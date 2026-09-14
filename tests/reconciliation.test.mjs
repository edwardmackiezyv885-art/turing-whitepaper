import test from "node:test";
import assert from "node:assert/strict";
import { TREASURY_USDT_ATA, USDT_MINT } from "../netlify/functions/_shared/config.mjs";
import { runPaymentReconciliation, treasuryUsdtCredit } from "../netlify/functions/_shared/reconciliation.mjs";
import { validScheduledEvent } from "../netlify/functions/node-orders-reconcile.mjs";

const buyer = "9xQeWvG816bUx9EPfEZ5mYLTnT3Rr7pGdDMv9uYsA2eN";
const reference = "7YWHMfk9JZe0LMQnVUTTd4cVkGjG4LMuJd7vjb4hJ8YP";

function incomingFixture(amount = "1000000000", includeReference = true) {
  const accountKeys = [
    { pubkey: buyer, signer: true },
    { pubkey: TREASURY_USDT_ATA, signer: false },
    ...(includeReference ? [{ pubkey: reference, signer: false }] : [])
  ];
  return {
    blockTime: 1_800_000_000,
    transaction: { message: { accountKeys, instructions: [] } },
    meta: {
      err: null,
      preTokenBalances: [{ accountIndex: 1, mint: USDT_MINT, uiTokenAmount: { amount: "4000000000" } }],
      postTokenBalances: [{ accountIndex: 1, mint: USDT_MINT, uiTokenAmount: { amount: String(4_000_000_000n + BigInt(amount)) } }]
    }
  };
}

function mockConnection(transactions, treasurySignatures) {
  return {
    async getSignaturesForAddress() {
      return treasurySignatures.map(signature => ({ signature, err: null }));
    },
    async getParsedTransactions(signatures) {
      return signatures.map(signature => transactions.get(signature)?.parsed || null);
    },
    async getTransactions(signatures) {
      return signatures.map(signature => transactions.get(signature)?.raw || null);
    }
  };
}

function mockDependencies(overrides = {}) {
  const payments = [];
  const runs = [];
  const flagged = [];
  const removed = [];
  return {
    payments,
    runs,
    flagged,
    removed,
    dependencies: {
      ensureReconciliationIndexes: async () => ({ backfilled: false, indexed: 0 }),
      listCandidateSignatures: async () => [],
      listReferenceAddresses: async () => new Set([reference]),
      listTerminalReconciliationSignatures: async () => new Set(),
      getOrderIdByReference: async value => value === reference ? "order-1" : null,
      settleVerifiedPayment: async ({ orderId, signature }) => ({
        alreadyPaid: false,
        reviewRequired: false,
        order: { id: orderId, reference, amountBaseUnits: "1000000000", paymentSignature: signature }
      }),
      recordReconciliationPayment: async (signature, record) => payments.push({ signature, ...record }),
      recordReconciliationRun: async summary => runs.push(summary),
      flagCandidateReconciliationIssue: async (...args) => flagged.push(args),
      removeCandidateSignature: async (...args) => removed.push(args),
      ...overrides
    }
  };
}

test("calculates only positive official-USDT treasury credits", () => {
  assert.equal(treasuryUsdtCredit(incomingFixture()), 1_000_000_000n);
  const outgoing = incomingFixture();
  outgoing.meta.postTokenBalances[0].uiTokenAmount.amount = "3000000000";
  assert.equal(treasuryUsdtCredit(outgoing), 0n);
  const failed = incomingFixture();
  failed.meta.err = { InstructionError: [2, "Custom"] };
  assert.equal(treasuryUsdtCredit(failed), 0n);
});

test("accepts only a near-future Netlify scheduled-event payload", () => {
  const now = Date.now();
  assert.equal(validScheduledEvent({ next_run: new Date(now + 5 * 60_000).toISOString() }, now), true);
  assert.equal(validScheduledEvent({ next_run: new Date(now + 30 * 60_000).toISOString() }, now), false);
  assert.equal(validScheduledEvent({}), false);
  assert.equal(validScheduledEvent(null), false);
});

test("deduplicates candidate and treasury discovery then settles once", async () => {
  const signature = "candidate-and-treasury-signature";
  const transactions = new Map([[signature, { parsed: incomingFixture(), raw: { transaction: {} } }]]);
  let settlements = 0;
  const mocks = mockDependencies({
    listCandidateSignatures: async () => [{ signature, orderId: "order-1" }],
    settleVerifiedPayment: async input => {
      settlements += 1;
      return { alreadyPaid: false, order: { id: input.orderId, reference, amountBaseUnits: "1000000000" } };
    }
  });
  const summary = await runPaymentReconciliation({
    connection: mockConnection(transactions, [signature]),
    dependencies: mocks.dependencies
  });
  assert.equal(settlements, 1);
  assert.equal(summary.matched, 1);
  assert.equal(summary.incomingCredits, 1);
  assert.equal(mocks.payments.at(-1).status, "matched_paid");
});

test("records a treasury credit with no order reference as unmatched", async () => {
  const signature = "unmatched-treasury-signature";
  const transactions = new Map([[signature, { parsed: incomingFixture("500000", false), raw: { transaction: {} } }]]);
  const mocks = mockDependencies();
  const summary = await runPaymentReconciliation({
    connection: mockConnection(transactions, [signature]),
    dependencies: mocks.dependencies
  });
  assert.equal(summary.unmatched, 1);
  assert.equal(summary.matched, 0);
  assert.equal(mocks.payments[0].status, "unmatched_incoming");
  assert.equal(mocks.payments[0].amountBaseUnits, "500000");
});

test("keeps a non-finalized candidate queued for a later run", async () => {
  const signature = "not-finalized-signature";
  const mocks = mockDependencies({
    listCandidateSignatures: async () => [{ signature, orderId: "order-1" }]
  });
  const summary = await runPaymentReconciliation({
    connection: mockConnection(new Map(), []),
    dependencies: mocks.dependencies
  });
  assert.equal(summary.pendingFinalization, 1);
  assert.equal(mocks.removed.length, 0);
  assert.equal(mocks.flagged.length, 0);
});

test("quarantines a finalized candidate that fails permanent validation", async () => {
  const signature = "invalid-finalized-signature";
  const transactions = new Map([[signature, { parsed: incomingFixture(), raw: { transaction: {} } }]]);
  const error = Object.assign(new Error("mismatch"), { status: 400, code: "PAYMENT_MISMATCH" });
  const mocks = mockDependencies({
    listCandidateSignatures: async () => [{ signature, orderId: "order-1" }],
    settleVerifiedPayment: async () => { throw error; }
  });
  const summary = await runPaymentReconciliation({
    connection: mockConnection(transactions, []),
    dependencies: mocks.dependencies
  });
  assert.equal(summary.mismatched, 1);
  assert.equal(mocks.flagged.length, 1);
  assert.deepEqual(mocks.removed[0], [signature, "order-1"]);
  assert.equal(mocks.payments[0].status, "payment_mismatch");
});
