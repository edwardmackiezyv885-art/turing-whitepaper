import { getStore } from "@netlify/blobs";
import { MERCHANT_PAID_STATUSES } from "./merchant-config.mjs";

const store = () => getStore({ name: "turing-merchant-fee-orders", consistency: "strong" });
const orderKey = id => `order/${id}`;

async function listKeys(prefix) {
  const keys = [];
  for await (const page of store().list({ prefix, paginate: true })) {
    keys.push(...page.blobs.map(blob => blob.key));
  }
  return keys;
}

export async function createMerchantOrderRecord(order) {
  const s = store();
  const referenceResult = await s.setJSON(
    `reference/${order.reference}`,
    { orderId: order.id, applicationId: order.applicationId, createdAt: order.createdAt },
    { onlyIfNew: true }
  );
  if (!referenceResult.modified) {
    throw Object.assign(new Error("Order reference is already assigned"), { status: 409, code: "REFERENCE_ALREADY_USED" });
  }
  const result = await s.setJSON(orderKey(order.id), order, { onlyIfNew: true });
  if (!result.modified) throw Object.assign(new Error("Order ID collision"), { status: 409, code: "ORDER_CONFLICT" });
}

export async function getMerchantOrder(id, withMetadata = false) {
  const s = store();
  return withMetadata
    ? s.getWithMetadata(orderKey(id), { type: "json" })
    : s.get(orderKey(id), { type: "json" });
}

export async function updateMerchantOrder(id, order, etag) {
  const result = await store().setJSON(orderKey(id), order, { onlyIfMatch: etag });
  if (!result.modified) throw Object.assign(new Error("Order changed concurrently"), { status: 409, code: "ORDER_CONFLICT" });
  return result;
}

export async function claimMerchantWalletProof(proofHash, buyer, applicationId) {
  const result = await store().setJSON(
    `wallet-proof/${proofHash}`,
    { buyer, applicationId, usedAt: new Date().toISOString() },
    { onlyIfNew: true }
  );
  if (!result.modified) {
    throw Object.assign(new Error("Wallet proof was already used"), { status: 409, code: "WALLET_PROOF_ALREADY_USED" });
  }
}

export async function claimMerchantSignature(signature, orderId) {
  const s = store();
  const key = `signature/${signature}`;
  const result = await s.setJSON(key, { orderId, claimedAt: new Date().toISOString() }, { onlyIfNew: true });
  if (result.modified) return;
  const existing = await s.get(key, { type: "json" });
  if (existing?.orderId === orderId) return;
  throw Object.assign(new Error("This transaction signature was already used"), { status: 409, code: "SIGNATURE_ALREADY_USED" });
}

export async function enqueueMerchantCandidate(signature, orderId) {
  const s = store();
  const key = `candidate/${signature}`;
  const value = { signature, orderId, queuedAt: new Date().toISOString() };
  const result = await s.setJSON(key, value, { onlyIfNew: true });
  if (result.modified) return;
  const existing = await s.get(key, { type: "json" });
  if (existing?.orderId !== orderId) {
    throw Object.assign(new Error("Candidate signature is assigned to another order"), { status: 409, code: "CANDIDATE_SIGNATURE_CONFLICT" });
  }
}

export async function removeMerchantCandidate(signature, orderId) {
  if (!signature) return;
  const s = store();
  const key = `candidate/${signature}`;
  const existing = await s.get(key, { type: "json" });
  if (existing?.orderId === orderId) await s.delete(key);
}

export async function listMerchantOrders(status = "", limit = 100) {
  const s = store();
  const keys = await listKeys("order/");
  const orders = [];
  for (let offset = 0; offset < keys.length; offset += 20) {
    await Promise.all(keys.slice(offset, offset + 20).map(async key => {
      const order = await s.get(key, { type: "json" });
      if (order && (!status || order.status === status)) orders.push(order);
    }));
  }
  return orders
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, limit);
}

export function merchantOrderIsPaid(order) {
  return Boolean(order && MERCHANT_PAID_STATUSES.has(order.status));
}

