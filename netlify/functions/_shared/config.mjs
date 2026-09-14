import { createHash, createPublicKey, randomBytes, timingSafeEqual, verify as verifySignature } from "node:crypto";
import { PublicKey } from "@solana/web3.js";

export const NETWORK = "mainnet-beta";
export const USDT_MINT = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";
export const USDT_DECIMALS = 6;
export const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
export const TREASURY_OWNER = "FFhKLmZq6UZF3VvmckCZt8DvXq8LAVQaYc2SLa6Er2W8";
export const TREASURY_USDT_ATA = "DDeDE8pBjqDwQazgCwPMNuJGePjckgcWTn6wMtmcLXNg";
export const ORDER_TTL_MS = 5 * 60 * 1000;

export const TIERS = Object.freeze({
  "test-050": Object.freeze({ id: "test-050", level: "TEST", amount: "500000", displayAmount: "0.5", cap: 50, zh: "支付链路测试", en: "Payment Flow Test", isTest: true }),
  explorer: Object.freeze({ id: "explorer", level: "L1", amount: "1000000000", displayAmount: "1,000", cap: 350, zh: "探索节点", en: "Explorer Node" }),
  builder: Object.freeze({ id: "builder", level: "L2", amount: "5000000000", displayAmount: "5,000", cap: 40, zh: "建设节点", en: "Builder Node" }),
  cocreator: Object.freeze({ id: "cocreator", level: "L3", amount: "10000000000", displayAmount: "10,000", cap: 20, zh: "共创节点", en: "Co-creator Node" }),
  "market-agent": Object.freeze({ id: "market-agent", level: "L4", amount: "50000000000", displayAmount: "50,000", cap: 5, zh: "核心市场代理节点", en: "Core Market Agent Node" })
});

export const PAID_STATUSES = new Set(["test_paid", "nft_pending", "paid_manual_review", "nft_issued"]);

export function envFlag(name, fallback = false) {
  const value = process.env[name];
  if (value == null || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

export function buildOrderMemo(tier, orderId) {
  if (!tier?.level || !tier?.en || !tier?.displayAmount || !/^[0-9a-f-]{36}$/i.test(String(orderId || ""))) {
    throw new Error("Invalid order memo input");
  }
  return `TURING NODE PURCHASE | ${tier.level} ${tier.en.toUpperCase()} | ${tier.displayAmount} USDT | ORDER ${orderId}`;
}

export function requirePublicKey(value, label = "wallet") {
  if (typeof value !== "string" || value.length > 64) throw new Error(`Invalid ${label}`);
  try { return new PublicKey(value).toBase58(); }
  catch { throw new Error(`Invalid ${label}`); }
}

export function sha256(value) {
  return createHash("sha256").update(String(value)).digest("hex");
}

export function randomCustomerToken() {
  return randomBytes(32).toString("base64url");
}

export function safeEqualText(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && timingSafeEqual(left, right);
}

export function verifyWalletProof(request, buyer, tierId, referrer, proof) {
  const origin = request.headers.get("origin") || "";
  const timestamp = String(proof?.timestamp || "");
  const signatureBase64 = String(proof?.signatureBase64 || "");
  const timestampMs = Date.parse(timestamp);
  if (!origin || !Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > 5 * 60 * 1000) {
    throw Object.assign(new Error("Wallet proof has expired"), { status: 401, code: "WALLET_PROOF_EXPIRED" });
  }
  let signature;
  try { signature = Buffer.from(signatureBase64, "base64"); } catch { signature = Buffer.alloc(0); }
  if (signature.length !== 64) throw Object.assign(new Error("Invalid wallet proof"), { status: 401, code: "INVALID_WALLET_PROOF" });
  if (signature.toString("base64") !== signatureBase64) throw Object.assign(new Error("Invalid wallet proof encoding"), { status: 401, code: "INVALID_WALLET_PROOF" });
  const message = `TURING NODE ORDER\nWallet: ${buyer}\nTier: ${tierId}\nReferrer: ${referrer || "DIRECT"}\nTimestamp: ${timestamp}\nOrigin: ${origin}`;
  const derPrefix = Buffer.from("302a300506032b6570032100", "hex");
  const publicKey = createPublicKey({ key: Buffer.concat([derPrefix, new PublicKey(buyer).toBuffer()]), format: "der", type: "spki" });
  if (!verifySignature(null, Buffer.from(message, "utf8"), publicKey, signature)) {
    throw Object.assign(new Error("Wallet proof verification failed"), { status: 401, code: "INVALID_WALLET_PROOF" });
  }
  return sha256(`${message}:${signature.toString("base64")}`);
}

export function publicOrder(order) {
  return {
    id: order.id,
    status: order.status,
    tierId: order.tierId,
    tierLevel: order.tierLevel,
    tierNameZh: order.tierNameZh,
    tierNameEn: order.tierNameEn,
    amount: order.displayAmount,
    currency: "USDT",
    network: NETWORK,
    buyer: order.buyer,
    referrer: order.referrer || null,
    referralStatus: order.referralStatus || null,
    createdAt: order.createdAt,
    expiresAt: order.expiresAt,
    paidAt: order.paidAt || null,
    paymentSignature: order.paymentSignature || null,
    nftMint: order.nftMint || null,
    issuanceSignature: order.issuanceSignature || null,
    issuedAt: order.issuedAt || null,
    isTest: Boolean(order.isTest),
    notice: order.isTest ? "NON_PRODUCTION_NO_FORMAL_RIGHTS" : null
  };
}

export function safeOrderForAdmin(order) {
  const { customerTokenHash, ...safe } = order;
  return safe;
}
