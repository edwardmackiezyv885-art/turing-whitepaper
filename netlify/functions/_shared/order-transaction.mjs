import { PublicKey, Transaction } from "@solana/web3.js";

const ASSOCIATED_TOKEN_PROGRAM = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
const MEMO_PROGRAM = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";
const SYSTEM_PROGRAM = "11111111111111111111111111111111";

const key = value => new PublicKey(value).toBase58();

function invalid(message, code = "INVALID_SIGNED_TRANSACTION") {
  return Object.assign(new Error(message), { status: 400, code });
}

export function validateSignedOrderTransaction(signedTransactionBase64, order) {
  if (typeof signedTransactionBase64 !== "string" || signedTransactionBase64.length < 100 || signedTransactionBase64.length > 4000) {
    throw invalid("Invalid signed transaction encoding");
  }

  let bytes;
  let transaction;
  try {
    bytes = Buffer.from(signedTransactionBase64, "base64");
    if (!bytes.length || bytes.toString("base64") !== signedTransactionBase64) throw new Error("non-canonical base64");
    transaction = Transaction.from(bytes);
  } catch {
    throw invalid("Unable to parse the signed payment transaction");
  }

  if (!transaction.verifySignatures()) throw invalid("The payment transaction is not signed by the buyer", "INVALID_BUYER_SIGNATURE");
  if (key(transaction.feePayer) !== order.buyer) throw invalid("Unexpected payment fee payer", "INVALID_FEE_PAYER");
  if (transaction.instructions.length !== 3) throw invalid("Unexpected payment instruction count", "UNEXPECTED_INSTRUCTION_COUNT");

  const [ata, memo, transfer] = transaction.instructions;
  if (key(ata.programId) !== ASSOCIATED_TOKEN_PROGRAM || key(memo.programId) !== MEMO_PROGRAM || key(transfer.programId) !== order.tokenProgram) {
    throw invalid("Payment transaction contains an unexpected program", "UNEXPECTED_PROGRAM");
  }

  const ataKeys = ata.keys.map(item => key(item.pubkey));
  if (ata.data.length !== 1 || ata.data[0] !== 1 || ataKeys.length !== 6 ||
    ataKeys[0] !== order.buyer || ataKeys[1] !== order.treasuryAta || ataKeys[2] !== order.treasuryOwner || ataKeys[3] !== order.mint ||
    ataKeys[4] !== SYSTEM_PROGRAM || ataKeys[5] !== order.tokenProgram || !ata.keys[0].isSigner || !ata.keys[0].isWritable || !ata.keys[1].isWritable) {
    throw invalid("Treasury USDT account instruction does not match the order", "TREASURY_ACCOUNT_MISMATCH");
  }

  if (memo.keys.length !== 0 || new TextDecoder().decode(memo.data) !== order.memo) {
    throw invalid("Payment memo does not match the order", "MEMO_MISMATCH");
  }

  const transferKeys = transfer.keys.map(item => key(item.pubkey));
  if (transfer.data.length !== 10 || transfer.data[0] !== 12 || transferKeys.length !== 5 ||
    transferKeys[0] !== order.buyerAta || transferKeys[1] !== order.mint || transferKeys[2] !== order.treasuryAta || transferKeys[3] !== order.buyer || transferKeys[4] !== order.reference ||
    !transfer.keys[0].isWritable || !transfer.keys[2].isWritable || !transfer.keys[3].isSigner || transfer.keys[4].isSigner || transfer.keys[4].isWritable) {
    throw invalid("USDT transfer accounts do not match the order", "PAYMENT_ACCOUNTS_MISMATCH");
  }
  const data = new DataView(transfer.data.buffer, transfer.data.byteOffset, transfer.data.byteLength);
  if (data.getBigUint64(1, true).toString() !== String(order.amountBaseUnits) || transfer.data[9] !== Number(order.decimals)) {
    throw invalid("USDT transfer amount does not match the order", "PAYMENT_AMOUNT_MISMATCH");
  }

  return { bytes, transaction };
}
