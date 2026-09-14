import { Connection } from "@solana/web3.js";
import { MERCHANT_PAID_STATUSES, safeEqualText, sha256 } from "./_shared/merchant-config.mjs";
import { assertSameOrigin, handleError, json, methodNotAllowed, readJson } from "./_shared/http.mjs";
import { getMerchantOrder } from "./_shared/merchant-store.mjs";

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
    const order = await getMerchantOrder(orderId);
    if (!order || !safeEqualText(order.customerTokenHash, sha256(customerToken))) {
      throw Object.assign(new Error("Order not found"), { status: 404, code: "ORDER_NOT_FOUND" });
    }
    if (MERCHANT_PAID_STATUSES.has(order.status)) {
      throw Object.assign(new Error("Order is already paid"), { status: 409, code: "ORDER_ALREADY_PAID" });
    }
    if (Date.now() > Date.parse(order.expiresAt)) {
      throw Object.assign(new Error("Order has expired"), { status: 410, code: "ORDER_EXPIRED" });
    }
    const connection = new Connection(process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com", "confirmed");
    const value = await connection.getLatestBlockhash("confirmed");
    return json(200, {
      blockhash: value.blockhash,
      lastValidBlockHeight: value.lastValidBlockHeight,
      refreshedAt: Date.now()
    });
  } catch (error) {
    return handleError(error);
  }
}

export const config = {
  path: "/api/merchant-orders/refresh",
  rateLimit: { windowLimit: 30, windowSize: 180, aggregateBy: ["ip", "domain"] }
};

