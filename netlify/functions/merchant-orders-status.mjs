import { Connection, PublicKey } from "@solana/web3.js";
import {
  MERCHANT_PAID_STATUSES,
  publicMerchantOrder,
  safeEqualText,
  sha256
} from "./_shared/merchant-config.mjs";
import { assertSameOrigin, handleError, json, methodNotAllowed, readJson } from "./_shared/http.mjs";
import { getMerchantOrder } from "./_shared/merchant-store.mjs";

export default async function handler(request) {
  if (request.method !== "POST") return methodNotAllowed(["POST"]);
  try {
    assertSameOrigin(request);
    const body = await readJson(request);
    const id = String(body.orderId || "");
    const token = String(body.customerToken || "");
    if (!/^[0-9a-f-]{36}$/i.test(id) || token.length < 32 || token.length > 128) {
      throw Object.assign(new Error("Invalid order credentials"), { status: 400, code: "INVALID_ORDER_CREDENTIALS" });
    }
    const order = await getMerchantOrder(id);
    if (!order || !safeEqualText(order.customerTokenHash, sha256(token))) {
      throw Object.assign(new Error("Order not found"), { status: 404, code: "ORDER_NOT_FOUND" });
    }
    let paymentCandidates = [];
    let recoveryBlockHeight = 0;
    if (body.recoverPayment === true && !MERCHANT_PAID_STATUSES.has(order.status)) {
      try {
        const connection = new Connection(process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com", "confirmed");
        const [signatures, blockHeight] = await Promise.all([
          connection.getSignaturesForAddress(new PublicKey(order.reference), { limit: 5 }, "confirmed"),
          connection.getBlockHeight("confirmed")
        ]);
        paymentCandidates = signatures.filter(item => !item.err).map(item => item.signature);
        recoveryBlockHeight = Number(blockHeight || 0);
      } catch {
        // Order status remains available if the RPC recovery query is temporarily unavailable.
      }
    }
    return json(200, {
      order: publicMerchantOrder(order),
      paymentCandidates,
      recoveryBlockHeight
    });
  } catch (error) {
    return handleError(error);
  }
}

export const config = {
  path: "/api/merchant-orders/status",
  rateLimit: { windowLimit: 60, windowSize: 180, aggregateBy: ["ip", "domain"] }
};

