import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import { PublicKey } from "@solana/web3.js";
import {
  MERCHANT_ORDER_TTL_MS,
  MERCHANT_PAID_STATUSES,
  MERCHANT_SERVICE_FEE,
  TREASURY_OWNER,
  TREASURY_USDT_ATA,
  USDT_DECIMALS,
  USDT_MINT,
  buildMerchantOrderMemo,
  merchantWalletProofMessage,
  publicMerchantOrder,
  verifyMerchantWalletProof
} from "../netlify/functions/_shared/merchant-config.mjs";
import publicConfigHandler from "../netlify/functions/merchant-orders-config.mjs";
import createOrderHandler from "../netlify/functions/merchant-orders-create.mjs";

const applicationId = "22222222-2222-4222-8222-222222222222";
const orderId = "11111111-1111-4111-8111-111111111111";
const origin = "https://meta9898.shop";

test("merchant service fee has one exact Mainnet USDT amount", () => {
  assert.equal(MERCHANT_SERVICE_FEE.amount, "299000000");
  assert.equal(MERCHANT_SERVICE_FEE.displayAmount, "299");
  assert.equal(MERCHANT_SERVICE_FEE.referenceCny, "10,000");
  assert.equal(USDT_DECIMALS, 6);
  assert.equal(USDT_MINT, "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB");
  assert.equal(TREASURY_OWNER, "FFhKLmZq6UZF3VvmckCZt8DvXq8LAVQaYc2SLa6Er2W8");
  assert.equal(TREASURY_USDT_ATA, "DDeDE8pBjqDwQazgCwPMNuJGePjckgcWTn6wMtmcLXNg");
  assert.equal(MERCHANT_ORDER_TTL_MS, 5 * 60 * 1000);
  assert.equal(MERCHANT_PAID_STATUSES.has("service_fee_paid"), true);
});

test("merchant memo binds application, exact amount, and order", () => {
  assert.equal(
    buildMerchantOrderMemo(applicationId, orderId),
    `TURING MERCHANT SERVICE FEE | APPLICATION ${applicationId} | 299 USDT | ORDER ${orderId}`
  );
  assert.throws(() => buildMerchantOrderMemo("not-an-application", orderId), /Invalid merchant order memo input/);
});

test("fresh Ed25519 proof binds wallet control to the merchant application and amount", () => {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const rawPublicKey = publicKey.export({ format: "der", type: "spki" }).subarray(-32);
  const buyer = new PublicKey(rawPublicKey).toBase58();
  const timestamp = new Date().toISOString();
  const message = merchantWalletProofMessage({ buyer, applicationId, timestamp, origin });
  assert.match(message, new RegExp(applicationId));
  assert.match(message, /Amount: 299 USDT/);
  const signatureBase64 = sign(null, Buffer.from(message), privateKey).toString("base64");
  const request = new Request(`${origin}/api/merchant-orders/create`, { headers: { origin } });
  assert.match(
    verifyMerchantWalletProof(request, buyer, applicationId, { timestamp, signatureBase64 }),
    /^[0-9a-f]{64}$/
  );
});

test("merchant public order never exposes a token or redemption entitlement", () => {
  const order = publicMerchantOrder({
    id: orderId,
    applicationId,
    serviceId: MERCHANT_SERVICE_FEE.id,
    serviceNameZh: MERCHANT_SERVICE_FEE.zh,
    serviceNameEn: MERCHANT_SERVICE_FEE.en,
    status: "service_fee_paid",
    displayAmount: MERCHANT_SERVICE_FEE.displayAmount,
    buyer: TREASURY_OWNER,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + MERCHANT_ORDER_TTL_MS).toISOString()
  });
  assert.equal(order.notice, "COMMERCIAL_SERVICE_FEE_NO_YIELD_NO_PRINCIPAL_REDEMPTION_NO_NFT_NO_TUR");
  assert.equal("nftMint" in order, false);
  assert.equal("turAmount" in order, false);
  assert.equal("principalRedemption" in order, false);
});

test("public merchant config exposes only fixed settlement information", async () => {
  process.env.MERCHANT_FEE_ENABLED = "true";
  const response = await publicConfigHandler(new Request(`${origin}/api/merchant-orders/config`));
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.enabled, true);
  assert.equal(body.network, "mainnet-beta");
  assert.equal(body.amountBaseUnits, "299000000");
  assert.equal(body.mint, USDT_MINT);
  assert.equal(body.treasuryAta, TREASURY_USDT_ATA);
  assert.equal(body.settlementNotice, "COMMERCIAL_SERVICE_FEE_NO_YIELD_NO_PRINCIPAL_REDEMPTION_NO_NFT_NO_TUR");
  assert.equal("adminToken" in body, false);
  assert.equal("privateKey" in body, false);
});

test("order creation is gated and rejects an invalid application before any RPC call", async () => {
  process.env.MERCHANT_FEE_ENABLED = "false";
  let response = await createOrderHandler(new Request(`${origin}/api/merchant-orders/create`, {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify({})
  }));
  assert.equal(response.status, 403);
  assert.equal((await response.json()).error, "MERCHANT_FEE_CLOSED");

  process.env.MERCHANT_FEE_ENABLED = "true";
  response = await createOrderHandler(new Request(`${origin}/api/merchant-orders/create`, {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify({ applicationId: "invalid" })
  }));
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, "INVALID_APPLICATION");
});
