import test from "node:test";
import assert from "node:assert/strict";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction
} from "@solana/web3.js";
import bs58 from "bs58";
import { TREASURY_OWNER, TREASURY_USDT_ATA, USDT_MINT } from "../netlify/functions/_shared/config.mjs";

const TOKEN_PROGRAM = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const ASSOCIATED_PROGRAM = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
const MEMO_PROGRAM = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

const associatedTokenAddress = (mint, owner) => PublicKey.findProgramAddressSync(
  [owner.toBuffer(), TOKEN_PROGRAM.toBuffer(), mint.toBuffer()],
  ASSOCIATED_PROGRAM
)[0];

let adapterImportId = 0;

async function loadPaymentAdapter() {
  const previousWindow = globalThis.window;
  globalThis.window = {};
  try {
    await import(`../src/usdt-payment-adapter.js?test=${Date.now()}-${adapterImportId++}`);
    return globalThis.window.TURING_USDT_PAYMENT;
  } finally {
    globalThis.window = previousWindow;
  }
}

function paymentFixture() {
  const buyerSigner = Keypair.generate();
  const buyer = buyerSigner.publicKey;
  const mint = new PublicKey(USDT_MINT);
  const treasuryOwner = new PublicKey(TREASURY_OWNER);
  const treasuryAta = new PublicKey(TREASURY_USDT_ATA);
  const buyerAta = associatedTokenAddress(mint, buyer);
  const reference = Keypair.generate().publicKey;
  const oldBlockhash = Keypair.generate().publicKey.toBase58();
  const amount = 1_000_000_000n;
  const orderId = "11111111-1111-4111-8111-111111111111";

  const transferData = Buffer.alloc(10);
  transferData[0] = 12;
  transferData.writeBigUInt64LE(amount, 1);
  transferData[9] = 6;
  const transaction = new Transaction({ feePayer: buyer, recentBlockhash: oldBlockhash }).add(
    new TransactionInstruction({
      programId: ASSOCIATED_PROGRAM,
      keys: [
        { pubkey: buyer, isSigner: true, isWritable: true },
        { pubkey: treasuryAta, isSigner: false, isWritable: true },
        { pubkey: treasuryOwner, isSigner: false, isWritable: false },
        { pubkey: mint, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM, isSigner: false, isWritable: false }
      ],
      data: Buffer.from([1])
    }),
    new TransactionInstruction({ programId: MEMO_PROGRAM, keys: [], data: Buffer.from(`TURING:${orderId}`) }),
    new TransactionInstruction({
      programId: TOKEN_PROGRAM,
      keys: [
        { pubkey: buyerAta, isSigner: false, isWritable: true },
        { pubkey: mint, isSigner: false, isWritable: false },
        { pubkey: treasuryAta, isSigner: false, isWritable: true },
        { pubkey: buyer, isSigner: true, isWritable: false },
        { pubkey: reference, isSigner: false, isWritable: false }
      ],
      data: transferData
    })
  );
  const transactionBase64 = transaction.serialize({ requireAllSignatures: false, verifySignatures: false }).toString("base64");
  const expected = {
    buyer: buyer.toBase58(), buyerAta: buyerAta.toBase58(), mint: mint.toBase58(),
    treasuryAta: treasuryAta.toBase58(), treasuryOwner: treasuryOwner.toBase58(),
    amountBaseUnits: amount.toString(), reference: reference.toBase58(), memo: `TURING:${orderId}`
  };
  return { amount, buyer, buyerSigner, expected, transaction, transactionBase64 };
}

test("refreshes only the blockhash of a validated order transaction", async () => {
  const previousFetch = globalThis.fetch;
  try {
    const adapter = await loadPaymentAdapter();
    const { amount, expected, transactionBase64 } = paymentFixture();
    const newBlockhash = Keypair.generate().publicKey.toBase58();
    globalThis.fetch = async () => new Response(JSON.stringify({
      jsonrpc: "2.0", id: 1, result: { value: { blockhash: newBlockhash, lastValidBlockHeight: 123456 } }
    }), { status: 200, headers: { "content-type": "application/json" } });

    assert.equal(adapter.validate({ transactionBase64, expected }), true);
    const refreshed = await adapter.refreshBlockhash({ transactionBase64, expected });
    const decoded = Transaction.from(Buffer.from(refreshed.transactionBase64, "base64"));
    assert.equal(decoded.recentBlockhash, newBlockhash);
    assert.equal(refreshed.lastValidBlockHeight, 123456);
    assert.equal(decoded.instructions.length, 3);
    assert.equal(decoded.instructions[2].data.readBigUInt64LE(1), amount);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("send invokes signAndSendTransaction with the validated transaction", async () => {
  const adapter = await loadPaymentAdapter();
  const { buyer, expected, transactionBase64 } = paymentFixture();
  const signature = bs58.encode(Keypair.generate().secretKey);
  let calls = 0;
  let receivedTransaction = null;
  const provider = {
    publicKey: buyer,
    async signAndSendTransaction(transaction) {
      calls += 1;
      receivedTransaction = transaction;
      return { signature };
    }
  };

  const result = await adapter.send({ provider, transactionBase64, expected });

  assert.equal(calls, 1);
  assert.ok(receivedTransaction instanceof Transaction);
  assert.equal(receivedTransaction.feePayer.toBase58(), buyer.toBase58());
  assert.deepEqual(result, { signature });
});

test("send accepts connectedAddress when a compatible provider has no publicKey", async () => {
  const adapter = await loadPaymentAdapter();
  const { buyer, expected, transactionBase64 } = paymentFixture();
  const signature = bs58.encode(Keypair.generate().secretKey);
  let calls = 0;
  const provider = {
    connectedAddress: buyer.toBase58(),
    async signAndSendTransaction() {
      calls += 1;
      return { signature };
    }
  };

  assert.equal("publicKey" in provider, false);
  const result = await adapter.send({
    provider,
    connectedAddress: buyer.toBase58(),
    transactionBase64,
    expected
  });

  assert.equal(calls, 1);
  assert.deepEqual(result, { signature });
});

test("send rejects an address mismatch before invoking the wallet provider", async () => {
  const adapter = await loadPaymentAdapter();
  const { expected, transactionBase64 } = paymentFixture();
  const connectedAddress = Keypair.generate().publicKey.toBase58();
  let calls = 0;
  const provider = {
    connectedAddress,
    async signAndSendTransaction() {
      calls += 1;
      return { signature: bs58.encode(Keypair.generate().secretKey) };
    }
  };

  await assert.rejects(adapter.send({ provider, connectedAddress, transactionBase64, expected }), error => {
    assert.equal(error.paymentMayHaveBeenSubmitted, false);
    return true;
  });
  assert.equal(calls, 0);
});

test("send prefers wallet-managed signAndSendTransaction and avoids browser RPC", async () => {
  const previousFetch = globalThis.fetch;
  try {
    const adapter = await loadPaymentAdapter();
    const { buyer, expected, transactionBase64 } = paymentFixture();
    const signature = bs58.encode(Keypair.generate().secretKey);
    let signCalls = 0;
    let signAndSendCalls = 0;
    const provider = {
      publicKey: buyer,
      async signTransaction() {
        signCalls += 1;
      },
      async signAndSendTransaction() {
        signAndSendCalls += 1;
        return { signature };
      }
    };
    globalThis.fetch = async () => { throw new Error("browser RPC must not be used"); };

    const result = await adapter.send({ provider, transactionBase64, expected });

    assert.equal(signCalls, 0);
    assert.equal(signAndSendCalls, 1);
    assert.deepEqual(result, { signature });
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("send relays a sign-only wallet transaction through the authenticated order endpoint", async () => {
  const previousFetch = globalThis.fetch;
  try {
    const adapter = await loadPaymentAdapter();
    const { buyer, buyerSigner, expected, transactionBase64 } = paymentFixture();
    const signature = bs58.encode(Keypair.generate().secretKey);
    let relayBody;
    const provider = {
      publicKey: buyer,
      async signTransaction(transaction) {
        transaction.partialSign(buyerSigner);
        return transaction;
      }
    };
    globalThis.fetch = async (url, options) => {
      assert.equal(url, "/api/node-orders/broadcast");
      relayBody = JSON.parse(options.body);
      return new Response(JSON.stringify({ signature }), {
        status: 202,
        headers: { "content-type": "application/json" }
      });
    };

    const result = await adapter.send({
      provider,
      transactionBase64,
      expected,
      relay: { url: "/api/node-orders/broadcast", orderId: "order-id", customerToken: "customer-token" }
    });

    assert.equal(relayBody.orderId, "order-id");
    assert.equal(relayBody.customerToken, "customer-token");
    assert.ok(relayBody.signedTransactionBase64.length > 100);
    assert.deepEqual(result, { signature });
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("send classifies a signing failure as not submitted", async () => {
  const adapter = await loadPaymentAdapter();
  const { buyer, expected, transactionBase64 } = paymentFixture();
  const provider = {
    publicKey: buyer,
    async signTransaction() {
      throw "wallet did not open";
    }
  };

  await assert.rejects(adapter.send({ provider, transactionBase64, expected }), error => {
    assert.equal(error.message, "wallet did not open");
    assert.equal(error.paymentMayHaveBeenSubmitted, false);
    return true;
  });
});
