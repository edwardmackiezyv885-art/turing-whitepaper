import { PublicKey } from "@solana/web3.js";

const ASSOCIATED_TOKEN_PROGRAM = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
const MEMO_PROGRAM = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";

const keyText = value => {
  if (typeof value === "string") return value;
  if (value?.toBase58) return value.toBase58();
  if (value?.pubkey?.toBase58) return value.pubkey.toBase58();
  return String(value?.pubkey || value || "");
};

export function validatePaymentTransaction(parsedTransaction, order, rawTransaction) {
  if (!parsedTransaction?.meta || parsedTransaction.meta.err) throw paymentError("Transaction failed", "TRANSACTION_FAILED");
  const message = parsedTransaction.transaction?.message;
  if (!message) throw paymentError("Malformed transaction", "INVALID_TRANSACTION");

  const accountKeys = message.accountKeys || [];
  const keys = accountKeys.map(keyText);
  const buyerIndex = keys.indexOf(order.buyer);
  if (buyerIndex < 0 || !accountKeys[buyerIndex]?.signer) throw paymentError("Buyer did not sign this transaction", "BUYER_NOT_SIGNER");
  if (keys[0] !== order.buyer) throw paymentError("Unexpected transaction fee payer", "INVALID_FEE_PAYER");
  if (!keys.includes(order.reference)) throw paymentError("Order reference is missing", "REFERENCE_MISSING");

  const allowedPrograms = new Set([order.tokenProgram, ASSOCIATED_TOKEN_PROGRAM, MEMO_PROGRAM]);
  const instructions = message.instructions || [];
  if (instructions.length !== 3) throw paymentError("Transaction must contain exactly one order payment", "UNEXPECTED_INSTRUCTION_COUNT");
  for (const instruction of instructions) {
    const program = keyText(instruction.programId);
    if (!allowedPrograms.has(program)) throw paymentError("Transaction contains an unexpected instruction", "UNEXPECTED_INSTRUCTION");
  }

  const memoInstructions = instructions.filter(instruction => keyText(instruction.programId) === MEMO_PROGRAM);
  const memoFound = memoInstructions.length === 1 && memoInstructions.some(instruction =>
    keyText(instruction.programId) === MEMO_PROGRAM && String(instruction.parsed || "") === order.memo
  );
  if (!memoFound) throw paymentError("Order memo is missing", "MEMO_MISSING");

  const transferInstructions = instructions.filter(instruction => keyText(instruction.programId) === order.tokenProgram && instruction.parsed?.type === "transferChecked");
  const transfer = transferInstructions.length === 1 && transferInstructions.find(instruction => {
    if (keyText(instruction.programId) !== order.tokenProgram || instruction.parsed?.type !== "transferChecked") return false;
    const info = instruction.parsed.info || {};
    const authority = info.authority || info.multisigAuthority;
    return authority === order.buyer &&
      info.source === order.buyerAta &&
      info.destination === order.treasuryAta &&
      info.mint === order.mint &&
      String(info.tokenAmount?.amount) === order.amountBaseUnits &&
      Number(info.tokenAmount?.decimals) === Number(order.decimals);
  });
  if (!transfer) throw paymentError("USDT transfer does not match this order", "PAYMENT_MISMATCH");

  const rawMessage = rawTransaction?.transaction?.message;
  const rawInstructions = rawMessage?.compiledInstructions || rawMessage?.instructions || [];
  const rawKeys = rawMessage?.staticAccountKeys || rawMessage?.accountKeys || [];
  const referenceIndex = rawKeys.map(keyText).indexOf(order.reference);
  const transferIndex = instructions.indexOf(transfer);
  const rawTransfer = rawInstructions[transferIndex];
  const transferAccounts = rawTransfer?.accountKeyIndexes || rawTransfer?.accounts || [];
  if (referenceIndex < 0 || !Array.from(transferAccounts).includes(referenceIndex)) {
    throw paymentError("Order reference is not bound to the USDT transfer", "REFERENCE_NOT_BOUND");
  }

  const treasuryIndex = keys.indexOf(order.treasuryAta);
  if (treasuryIndex < 0) throw paymentError("Treasury token account is missing", "TREASURY_ACCOUNT_MISSING");
  const balanceFor = (balances = []) => balances.find(item => item.accountIndex === treasuryIndex && item.mint === order.mint)?.uiTokenAmount?.amount || "0";
  const before = BigInt(balanceFor(parsedTransaction.meta.preTokenBalances));
  const after = BigInt(balanceFor(parsedTransaction.meta.postTokenBalances));
  if (after - before !== BigInt(order.amountBaseUnits)) throw paymentError("Treasury did not receive the exact order amount", "TREASURY_BALANCE_MISMATCH");

  const blockTimeMs = Number(parsedTransaction.blockTime || 0) * 1000;
  if (!blockTimeMs || blockTimeMs < Date.parse(order.createdAt) - 60_000 || blockTimeMs > Date.parse(order.expiresAt) + 60_000) {
    throw paymentError("Payment is outside the valid order window", "PAYMENT_TIME_INVALID");
  }
  return true;
}

export function paymentError(message, code) {
  return Object.assign(new Error(message), { status: 400, code });
}

export function isSolanaSignature(value) {
  return typeof value === "string" && /^[1-9A-HJ-NP-Za-km-z]{64,100}$/.test(value);
}

export function isSolanaAddress(value) {
  try { return new PublicKey(value).toBase58() === value; }
  catch { return false; }
}
