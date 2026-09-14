import { Connection } from "@solana/web3.js";
import {
  MERCHANT_PAID_STATUSES,
  publicMerchantOrder,
  safeEqualText,
  sha256
} from "./_shared/merchant-config.mjs";
import { assertSameOrigin, handleError, json, methodNotAllowed, readJson } from "./_shared/http.mjs";
import { settleMerchantPayment } from "./_shared/merchant-payment-settlement.mjs";
import {
  enqueueMerchantCandidate,
  getMerchantOrder,
  updateMerchantOrder
} from "./_shared/merchant-store.mjs";
import { isSolanaSignature } from "./_shared/verify-solana.mjs";

export default async function handler(request) {
  if (request.method !== "POST") return methodNotAllowed(["POST"]);
  try {
    assertSameOrigin(request);
    const body = await readJson(request);
    const orderId = String(body.orderId || "");
    const customerToken = String(body.customerToken || "");
    const signature = String(body.signature || "");
    if (!/^[0-9a-f-]{36}$/i.test(orderId) || !isSolanaSignature(signature)) {
      throw Object.assign(new Error("Invalid order or transaction signature"), { status: 400, code: "INVALID_PAYMENT_SUBMISSION" });
    }
    const current = await getMerchantOrder(orderId, true);
    const order = current?.data;
    if (!order || !safeEqualText(order.customerTokenHash, sha256(customerToken))) {
      throw Object.assign(new Error("Order not found"), { status: 404, code: "ORDER_NOT_FOUND" });
    }
    if (MERCHANT_PAID_STATUSES.has(order.status)) {
      if (order.paymentSignature !== signature) {
        throw Object.assign(new Error("Order is already paid"), { status: 409, code: "ORDER_ALREADY_PAID" });
      }
      return json(200, { order: publicMerchantOrder(order) });
    }

    const connection = new Connection(process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com", "finalized");
    const parsed = await connection.getParsedTransaction(signature, {
      commitment: "finalized",
      maxSupportedTransactionVersion: 0
    });
    if (!parsed) {
      const confirming = {
        ...order,
        status: "payment_confirming",
        candidateSignature: signature,
        verificationUpdatedAt: new Date().toISOString()
      };
      try { await updateMerchantOrder(orderId, confirming, current.etag); } catch { /* Concurrent poll is harmless. */ }
      try { await enqueueMerchantCandidate(signature, orderId); } catch { /* Reference recovery remains available. */ }
      return json(202, { order: publicMerchantOrder(confirming), retryAfterMs: 3000 });
    }
    const raw = await connection.getTransaction(signature, {
      commitment: "finalized",
      maxSupportedTransactionVersion: 0
    });
    if (!raw) {
      try { await enqueueMerchantCandidate(signature, orderId); } catch { /* Reference recovery remains available. */ }
      return json(202, { order: publicMerchantOrder(order), retryAfterMs: 3000 });
    }
    const settled = await settleMerchantPayment({ orderId, signature, parsed, raw });
    return json(200, { order: publicMerchantOrder(settled.order) });
  } catch (error) {
    return handleError(error);
  }
}

export const config = {
  path: "/api/merchant-orders/verify",
  rateLimit: { windowLimit: 60, windowSize: 180, aggregateBy: ["ip", "domain"] }
};

