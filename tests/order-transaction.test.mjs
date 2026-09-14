import test from "node:test";
import assert from "node:assert/strict";
import { Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, TREASURY_OWNER, TREASURY_USDT_ATA, USDT_DECIMALS, USDT_MINT } from "../netlify/functions/_shared/config.mjs";
import { validateSignedOrderTransaction } from "../netlify/functions/_shared/order-transaction.mjs";

const ASSOCIATED_PROGRAM = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
const MEMO_PROGRAM = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");
const TOKEN_PROGRAM = new PublicKey(TOKEN_PROGRAM_ID);
const associatedTokenAddress = (mint, owner) => PublicKey.findProgramAddressSync(
  [owner.toBuffer(), TOKEN_PROGRAM.toBuffer(), mint.toBuffer()],
  ASSOCIATED_PROGRAM
)[0];

function signedOrderFixture() {
  const buyer = Keypair.generate();
  const mint = new PublicKey(USDT_MINT);
  const treasuryOwner = new PublicKey(TREASURY_OWNER);
  const treasuryAta = new PublicKey(TREASURY_USDT_ATA);
  const buyerAta = associatedTokenAddress(mint, buyer.publicKey);
  const reference = Keypair.generate().publicKey;
  const order = {
    buyer: buyer.publicKey.toBase58(), buyerAta: buyerAta.toBase58(), mint: USDT_MINT,
    treasuryOwner: TREASURY_OWNER, treasuryAta: TREASURY_USDT_ATA, tokenProgram: TOKEN_PROGRAM_ID,
    reference: reference.toBase58(), memo: "TURING:11111111-1111-4111-8111-111111111111",
    amountBaseUnits: "1000000000", decimals: USDT_DECIMALS
  };
  const data = Buffer.alloc(10);
  data[0] = 12;
  data.writeBigUInt64LE(1_000_000_000n, 1);
  data[9] = USDT_DECIMALS;
  const transaction = new Transaction({ feePayer: buyer.publicKey, recentBlockhash: Keypair.generate().publicKey.toBase58() }).add(
    new TransactionInstruction({
      programId: ASSOCIATED_PROGRAM,
      keys: [
        { pubkey: buyer.publicKey, isSigner: true, isWritable: true },
        { pubkey: treasuryAta, isSigner: false, isWritable: true },
        { pubkey: treasuryOwner, isSigner: false, isWritable: false },
        { pubkey: mint, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM, isSigner: false, isWritable: false }
      ],
      data: Buffer.from([1])
    }),
    new TransactionInstruction({ programId: MEMO_PROGRAM, keys: [], data: Buffer.from(order.memo) }),
    new TransactionInstruction({
      programId: TOKEN_PROGRAM,
      keys: [
        { pubkey: buyerAta, isSigner: false, isWritable: true },
        { pubkey: mint, isSigner: false, isWritable: false },
        { pubkey: treasuryAta, isSigner: false, isWritable: true },
        { pubkey: buyer.publicKey, isSigner: true, isWritable: false },
        { pubkey: reference, isSigner: false, isWritable: false }
      ],
      data
    })
  );
  transaction.sign(buyer);
  return { order, transaction };
}

test("server relay accepts only the fully signed transaction bound to the order", () => {
  const { order, transaction } = signedOrderFixture();
  const base64 = transaction.serialize().toString("base64");
  const result = validateSignedOrderTransaction(base64, order);
  assert.ok(result.bytes.length > 100);
  assert.equal(result.transaction.feePayer.toBase58(), order.buyer);
});

test("server relay rejects a different USDT amount", () => {
  const { order, transaction } = signedOrderFixture();
  assert.throws(
    () => validateSignedOrderTransaction(transaction.serialize().toString("base64"), { ...order, amountBaseUnits: "999000000" }),
    error => error.code === "PAYMENT_AMOUNT_MISMATCH"
  );
});
