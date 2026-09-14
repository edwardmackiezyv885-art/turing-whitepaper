import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import { PublicKey } from "@solana/web3.js";
import { PAID_STATUSES, TIERS, TREASURY_USDT_ATA, USDT_MINT, buildOrderMemo, verifyWalletProof } from "../netlify/functions/_shared/config.mjs";
import { validatePaymentTransaction } from "../netlify/functions/_shared/verify-solana.mjs";
import publicConfigHandler from "../netlify/functions/node-orders-config.mjs";
import createOrderHandler from "../netlify/functions/node-orders-create.mjs";

const buyer = "9xQeWvG816bUx9EPfEZ5mYLTnT3Rr7pGdDMv9uYsA2eN";
const buyerAta = "8Y9sBDXzxQtvJtYbxfwAqFtebKj6w1nhmzwTk1BXs8Bq";
const reference = "7YWHMfk9JZe0LMQnVUTTd4cVkGjG4LMuJd7vjb4hJ8YP";
const tokenProgram = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const memoProgram = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";
const ataProgram = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
const now = Date.now();

const order = {
  id: "11111111-1111-4111-8111-111111111111",
  buyer, buyerAta, reference, tokenProgram,
  treasuryAta: TREASURY_USDT_ATA,
  mint: USDT_MINT,
  amountBaseUnits: "1000000000",
  decimals: 6,
  memo: "TURING:11111111-1111-4111-8111-111111111111",
  createdAt: new Date(now - 60_000).toISOString(),
  expiresAt: new Date(now + 60_000).toISOString()
};

function transactionFixture(amount = "1000000000") {
  const accountKeys = [
    { pubkey: buyer, signer: true },
    { pubkey: buyerAta, signer: false },
    { pubkey: TREASURY_USDT_ATA, signer: false },
    { pubkey: reference, signer: false }
  ];
  return {
    blockTime: Math.floor(now / 1000),
    transaction: { message: { accountKeys, instructions: [
      { programId: ataProgram, parsed: { type: "createIdempotent" } },
      { programId: memoProgram, parsed: order.memo },
      { programId: tokenProgram, parsed: { type: "transferChecked", info: {
        authority: buyer, source: buyerAta, destination: TREASURY_USDT_ATA, mint: USDT_MINT,
        tokenAmount: { amount, decimals: 6 }
      } } }
    ] } },
    meta: {
      err: null,
      preTokenBalances: [{ accountIndex: 2, mint: USDT_MINT, uiTokenAmount: { amount: "2000000000" } }],
      postTokenBalances: [{ accountIndex: 2, mint: USDT_MINT, uiTokenAmount: { amount: "3000000000" } }]
    }
  };
}

function rawFixture() {
  return {
    transaction: { message: {
      accountKeys: [buyer, buyerAta, TREASURY_USDT_ATA, reference, USDT_MINT],
      instructions: [
        { accounts: [0, 2, 0, 4] },
        { accounts: [] },
        { accounts: [1, 4, 2, 0, 3] }
      ]
    } }
  };
}

test("USDT tiers use exact six-decimal base units", () => {
  assert.equal(TIERS.explorer.amount, "1000000000");
  assert.equal(TIERS.builder.amount, "5000000000");
  assert.equal(TIERS.cocreator.amount, "10000000000");
  assert.equal(TIERS["market-agent"].amount, "50000000000");
  assert.equal(TIERS.explorer.cap, 350);
  assert.equal(TIERS["test-050"].amount, "500000");
  assert.equal(TIERS["test-050"].cap, 50);
  assert.equal(TIERS["test-050"].isTest, true);
  assert.equal(PAID_STATUSES.has("test_paid"), true);
});

test("production payment memo identifies the node and exact USDT amount", () => {
  const id = "11111111-1111-4111-8111-111111111111";
  assert.equal(
    buildOrderMemo(TIERS.explorer, id),
    `TURING NODE PURCHASE | L1 EXPLORER NODE | 1,000 USDT | ORDER ${id}`
  );
  assert.match(buildOrderMemo(TIERS["market-agent"], id), /L4 CORE MARKET AGENT NODE \| 50,000 USDT/);
});

test("accepts exact finalized-style USDT payment", () => {
  assert.equal(validatePaymentTransaction(transactionFixture(), order, rawFixture()), true);
});

test("accepts Solana's multisigAuthority parsing for a transfer carrying the order reference", () => {
  const fixture = transactionFixture();
  const info = fixture.transaction.message.instructions[2].parsed.info;
  delete info.authority;
  info.multisigAuthority = buyer;
  info.signers = [reference];
  assert.equal(validatePaymentTransaction(fixture, order, rawFixture()), true);
});

test("rejects wrong USDT amount", () => {
  assert.throws(() => validatePaymentTransaction(transactionFixture("999999999"), order, rawFixture()), /does not match/);
});

test("rejects a transaction without buyer signature", () => {
  const fixture = transactionFixture();
  fixture.transaction.message.accountKeys[0].signer = false;
  assert.throws(() => validatePaymentTransaction(fixture, order, rawFixture()), /did not sign/);
});

test("rejects a reference not bound to TransferChecked", () => {
  const raw = rawFixture();
  raw.transaction.message.instructions[2].accounts.pop();
  assert.throws(() => validatePaymentTransaction(transactionFixture(), order, raw), /not bound/);
});

test("verifies a fresh Ed25519 wallet ownership proof", () => {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const rawPublicKey = publicKey.export({ format: "der", type: "spki" }).subarray(-32);
  const wallet = new PublicKey(rawPublicKey).toBase58();
  const timestamp = new Date().toISOString();
  const origin = "https://meta9898.shop";
  const message = `TURING NODE ORDER\nWallet: ${wallet}\nTier: explorer\nReferrer: DIRECT\nTimestamp: ${timestamp}\nOrigin: ${origin}`;
  const signatureBase64 = sign(null, Buffer.from(message), privateKey).toString("base64");
  const request = new Request("https://meta9898.shop/api/node-orders/create", { headers: { origin } });
  assert.match(verifyWalletProof(request, wallet, "explorer", null, { timestamp, signatureBase64 }), /^[0-9a-f]{64}$/);
});

test("0.5 USDT tier is rejected unless the server test switch is enabled", async () => {
  process.env.SALE_ENABLED = "true";
  process.env.PAYMENT_TEST_ENABLED = "false";
  const response = await createOrderHandler(new Request("https://meta9898.shop/api/node-orders/create", {
    method: "POST",
    headers: { origin: "https://meta9898.shop", "content-type": "application/json" },
    body: JSON.stringify({ tierId: "test-050", testMode: true })
  }));
  const body = await response.json();
  assert.equal(response.status, 403);
  assert.equal(body.error, "PAYMENT_TEST_DISABLED");
});

test("0.5 USDT tier requires an explicit test-mode request", async () => {
  process.env.SALE_ENABLED = "true";
  process.env.PAYMENT_TEST_ENABLED = "true";
  const response = await createOrderHandler(new Request("https://meta9898.shop/api/node-orders/create", {
    method: "POST",
    headers: { origin: "https://meta9898.shop", "content-type": "application/json" },
    body: JSON.stringify({ tierId: "test-050" })
  }));
  const body = await response.json();
  assert.equal(response.status, 403);
  assert.equal(body.error, "PAYMENT_TEST_DISABLED");
});

test("public sale config exposes switches without secrets", async () => {
  process.env.SALE_ENABLED = "false";
  process.env.PAYMENT_TEST_ENABLED = "true";
  const response = await publicConfigHandler(new Request("https://meta9898.shop/api/node-orders/config"));
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.saleEnabled, false);
  assert.equal(body.paymentTestEnabled, true);
  assert.equal("testSaleEnabled" in body, false);
  assert.equal(body.mint, USDT_MINT);
  assert.equal("adminToken" in body, false);
});
