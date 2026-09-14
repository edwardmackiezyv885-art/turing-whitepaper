import { Connection } from "@solana/web3.js";
import { MERCHANT_PAID_STATUSES, safeEqualText, sha256 } from "./_shared/merchant-config.mjs";
import { assertSameOrigin, handleError, json, methodNotAllowed, readJson } from "./_shared/http.mjs";
import { validateSignedOrderTransaction } from "./_shared/order-transaction.mjs";
import {
  enqueueMerchantCandidate,
  getMerchantOrder,
  updateMerchantOrder
} from "./_shared/merchant-store.mjs";

export default async function handler(request) {
  if (request.method !== "POST") return methodNotAllowed(["POST"]);
  try {
    assertSameOrigin(request);
    const body = await readJson(request);
    const orderId = String(body.orderId || "");
    const customerToken = String(body.customerToken || "");
    if (!/^[0-9a-f-]{36}$/i.test(orderId)) {
      throw Object.assign(new Error("Invalid order"), { status: 400, code: "INVALID_ORDER" });
    }
    const current = await getMerchantOrder(orderId, true);
    const order = current?.data;
    if (!order || !safeEqualText(order.customerTokenHash, sha256(customerToken))) {
      throw Object.assign(new Error("Order not found"), { status: 404, code: "ORDER_NOT_FOUND" });
    }
    if (MERCHANT_PAID_STATUSES.has(order.status)) {
      if (!order.paymentSignature) throw Object.assign(new Error("Order is already paid"), { status: 409, code: "ORDER_ALREADY_PAID" });
      return json(200, { signature: order.paymentSignature, status: order.status });
    }
    if (Date.now() > Date.parse(order.expiresAt) + 60_000) {
      throw Object.assign(new Error("Order has expired"), { status: 410, code: "ORDER_EXPIRED" });
    }

    const { bytes } = validateSignedOrderTransaction(String(body.signedTransactionBase64 || ""), order);
    const connection = new Connection(process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com", "confirmed");
    let signature;
    try {
      signature = await connection.sendRawTransaction(bytes, {
        skipPreflight: false,
        preflightCommitment: "confirmed",
        maxRetries: 3
      });
    } catch (error) {
      const message = String(error?.message || "The signed transaction was rejected by Solana");
      const safeMessage = /insufficient|blockhash|account|funds|balance/i.test(message)
        ? message.slice(0, 300)
        : "The signed transaction was rejected by Solana";
      throw Object.assign(new Error(safeMessage), { status: 400, code: "TRANSACTION_REJECTED" });
    }

    const confirming = {
      ...order,
      status: "payment_confirming",
      candidateSignature: signature,
      verificationUpdatedAt: new Date().toISOString()
    };
    try { await updateMerchantOrder(orderId, confirming, current.etag); } catch { /* Concurrent status reads are harmless. */ }
    try { await enqueueMerchantCandidate(signature, orderId); } catch { /* Reference recovery remains available. */ }
    return json(202, { signature, status: "payment_confirming" });
  } catch (error) {
    return handleError(error);
  }
}

export const config = {
  path: "/api/merchant-orders/broadcast",
  rateLimit: { windowLimit: 5, windowSize: 180, aggregateBy: ["ip", "domain"] }
};

