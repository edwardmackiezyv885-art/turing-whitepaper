import { createPublicKey, verify as verifySignature } from "node:crypto";
import { PublicKey } from "@solana/web3.js";
import {
  NETWORK,
  TOKEN_PROGRAM_ID,
  TREASURY_OWNER,
  TREASURY_USDT_ATA,
  USDT_DECIMALS,
  USDT_MINT,
  safeEqualText,
  sha256
} from "./config.mjs";

export {
  NETWORK,
  TOKEN_PROGRAM_ID,
  TREASURY_OWNER,
  TREASURY_USDT_ATA,
  USDT_DECIMALS,
  USDT_MINT,
  safeEqualText,
  sha256
};

export const MERCHANT_SERVICE_FEE = Object.freeze({
  id: "metaverse-cbd-onboarding",
  amount: "299000000",
  displayAmount: "299",
  referenceCny: "10,000",
  zh: "元宇宙 CBD 商家入驻服务",
  en: "Metaverse CBD Merchant Onboarding Service"
});

export const MERCHANT_ORDER_TTL_MS = 5 * 60 * 1000;
export const MERCHANT_PAID_STATUSES = new Set(["service_fee_paid", "paid_manual_review"]);

export function isApplicationId(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
}

export function buildMerchantOrderMemo(applicationId, orderId) {
  if (!isApplicationId(applicationId) || !isApplicationId(orderId)) {
    throw new Error("Invalid merchant order memo input");
  }
  return `TURING MERCHANT SERVICE FEE | APPLICATION ${applicationId} | ${MERCHANT_SERVICE_FEE.displayAmount} USDT | ORDER ${orderId}`;
}

export function requireMerchantPublicKey(value, label = "wallet") {
  if (typeof value !== "string" || value.length > 64) throw new Error(`Invalid ${label}`);
  try { return new PublicKey(value).toBase58(); }
  catch { throw new Error(`Invalid ${label}`); }
}

export function merchantWalletProofMessage({ buyer, applicationId, timestamp, origin }) {
  return `TURING MERCHANT SERVICE FEE\nWallet: ${buyer}\nApplication: ${applicationId}\nAmount: ${MERCHANT_SERVICE_FEE.displayAmount} USDT\nTimestamp: ${timestamp}\nOrigin: ${origin}`;
}

export function verifyMerchantWalletProof(request, buyer, applicationId, proof) {
  const origin = request.headers.get("origin") || "";
  const timestamp = String(proof?.timestamp || "");
  const signatureBase64 = String(proof?.signatureBase64 || "");
  const timestampMs = Date.parse(timestamp);
  if (!origin || !Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > 5 * 60 * 1000) {
    throw Object.assign(new Error("Wallet proof has expired"), { status: 401, code: "WALLET_PROOF_EXPIRED" });
  }
  let signature;
  try { signature = Buffer.from(signatureBase64, "base64"); } catch { signature = Buffer.alloc(0); }
  if (signature.length !== 64 || signature.toString("base64") !== signatureBase64) {
    throw Object.assign(new Error("Invalid wallet proof"), { status: 401, code: "INVALID_WALLET_PROOF" });
  }
  const message = merchantWalletProofMessage({ buyer, applicationId, timestamp, origin });
  const derPrefix = Buffer.from("302a300506032b6570032100", "hex");
  const publicKey = createPublicKey({
    key: Buffer.concat([derPrefix, new PublicKey(buyer).toBuffer()]),
    format: "der",
    type: "spki"
  });
  if (!verifySignature(null, Buffer.from(message, "utf8"), publicKey, signature)) {
    throw Object.assign(new Error("Wallet proof verification failed"), { status: 401, code: "INVALID_WALLET_PROOF" });
  }
  return sha256(`${message}:${signature.toString("base64")}`);
}

export function publicMerchantOrder(order) {
  return {
    id: order.id,
    applicationId: order.applicationId,
    serviceId: order.serviceId,
    serviceNameZh: order.serviceNameZh,
    serviceNameEn: order.serviceNameEn,
    status: order.status,
    amount: order.displayAmount,
    currency: "USDT",
    network: NETWORK,
    buyer: order.buyer,
    createdAt: order.createdAt,
    expiresAt: order.expiresAt,
    paidAt: order.paidAt || null,
    paymentSignature: order.paymentSignature || null,
    notice: "COMMERCIAL_SERVICE_FEE_NO_YIELD_NO_PRINCIPAL_REDEMPTION_NO_NFT_NO_TUR"
  };
}
