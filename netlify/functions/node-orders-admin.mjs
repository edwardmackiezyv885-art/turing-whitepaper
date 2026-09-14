import { safeOrderForAdmin } from "./_shared/config.mjs";
import { handleError, json, methodNotAllowed, readJson, requireAdmin } from "./_shared/http.mjs";
import {
  claimIssuanceSignature, getLatestReconciliationRun, getOrder,
  listOrders, listReconciliationIssues, updateOrder
} from "./_shared/store.mjs";
import { isSolanaAddress, isSolanaSignature } from "./_shared/verify-solana.mjs";

export default async function handler(request) {
  if (!["GET", "POST"].includes(request.method)) return methodNotAllowed(["GET", "POST"]);
  try {
    requireAdmin(request);
    if (request.method === "GET") {
      const url = new URL(request.url);
      if (url.searchParams.get("view") === "reconciliation") {
        const [latest, issues] = await Promise.all([
          getLatestReconciliationRun(),
          listReconciliationIssues(50)
        ]);
        return json(200, { latest, issues });
      }
      const status = url.searchParams.get("status") || "fulfillment_queue";
      const allowed = new Set(["fulfillment_queue", "nft_pending", "paid_manual_review", "nft_issued", "payment_confirming", "awaiting_payment", ""]);
      if (!allowed.has(status)) throw Object.assign(new Error("Invalid status filter"), { status: 400, code: "INVALID_STATUS" });
      const orders = await listOrders(status, 100);
      return json(200, { orders: orders.map(safeOrderForAdmin) });
    }

    const body = await readJson(request);
    if (!["mark_issued", "mark_nft_issued"].includes(body.action)) throw Object.assign(new Error("Invalid action"), { status: 400, code: "INVALID_ACTION" });
    const orderId = String(body.orderId || "");
    const nftMint = String(body.nftMint || "");
    const issuanceSignature = String(body.issuanceSignature || "");
    if (!/^[0-9a-f-]{36}$/i.test(orderId) || !isSolanaAddress(nftMint) || !isSolanaSignature(issuanceSignature)) {
      throw Object.assign(new Error("Order ID, NFT mint, or issuance signature is invalid"), { status: 400, code: "INVALID_ISSUANCE_RECORD" });
    }
    const current = await getOrder(orderId, true);
    if (!current?.data) throw Object.assign(new Error("Order not found"), { status: 404, code: "ORDER_NOT_FOUND" });
    if (current.data.isTest) throw Object.assign(new Error("Historical non-production orders cannot receive production NFT rights"), { status: 409, code: "NON_PRODUCTION_ORDER_NOT_ISSUABLE" });
    if (current.data.status === "nft_issued" && current.data.nftMint === nftMint && current.data.issuanceSignature === issuanceSignature) {
      return json(200, { order: safeOrderForAdmin(current.data) });
    }
    if (!["nft_pending", "paid_manual_review"].includes(current.data.status)) throw Object.assign(new Error("Order is not waiting for NFT issuance"), { status: 409, code: "ORDER_NOT_PENDING" });
    await claimIssuanceSignature(issuanceSignature, orderId);
    const issued = {
      ...current.data,
      status: "nft_issued",
      nftMint,
      issuanceSignature,
      issuedAt: new Date().toISOString()
    };
    await updateOrder(orderId, issued, current.etag);
    return json(200, { order: safeOrderForAdmin(issued) });
  } catch (error) {
    return handleError(error);
  }
}

export const config = {
  path: "/api/node-orders/admin"
};
