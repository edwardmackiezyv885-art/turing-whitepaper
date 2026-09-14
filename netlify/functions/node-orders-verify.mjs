import { Connection } from "@solana/web3.js";
import { PAID_STATUSES, publicOrder, safeEqualText, sha256 } from "./_shared/config.mjs";
import { assertSameOrigin, handleError, json, methodNotAllowed, readJson } from "./_shared/http.mjs";
import { settleVerifiedPayment } from "./_shared/payment-settlement.mjs";
import { enqueueCandidateSignature, getOrder, updateOrder } from "./_shared/store.mjs";
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

    const current = await getOrder(orderId, true);
    const order = current?.data;
    if (!order || !safeEqualText(order.customerTokenHash, sha256(customerToken))) {
      throw Object.assign(new Error("Order not found"), { status: 404, code: "ORDER_NOT_FOUND" });
    }
    if (PAID_STATUSES.has(order.status)) {
      if (order.paymentSignature !== signature) throw Object.assign(new Error("Order is already paid"), { status: 409, code: "ORDER_ALREADY_PAID" });
      return json(200, { order: publicOrder(order) });
    }
    const connection = new Connection(process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com", "finalized");
    const parsed = await connection.getParsedTransaction(signature, { commitment: "finalized", maxSupportedTransactionVersion: 0 });
    if (!parsed) {
      const confirming = { ...order, status: "payment_confirming", candidateSignature: signature, verificationUpdatedAt: new Date().toISOString() };
      try { await updateOrder(orderId, confirming, current.etag); } catch { /* concurrent poll is harmless */ }
      try { await enqueueCandidateSignature(signature, orderId); } catch { /* Treasury reconciliation remains a fallback. */ }
      return json(202, { order: publicOrder(confirming), retryAfterMs: 3000 });
    }

    const raw = await connection.getTransaction(signature, { commitment: "finalized", maxSupportedTransactionVersion: 0 });
    if (!raw) {
      try { await enqueueCandidateSignature(signature, orderId); } catch { /* Treasury reconciliation remains a fallback. */ }
      return json(202, { order: publicOrder(order), retryAfterMs: 3000 });
    }
    const settled = await settleVerifiedPayment({ orderId, signature, parsed, raw, source: "customer_verify" });
    return json(settled.reviewRequired ? 202 : 200, {
      order: publicOrder(settled.order),
      ...(settled.reviewRequired ? { reviewRequired: true } : {})
    });
  } catch (error) {
    return handleError(error);
  }
}

export const config = {
  path: "/api/node-orders/verify",
  rateLimit: { windowLimit: 60, windowSize: 180, aggregateBy: ["ip", "domain"] }
};
