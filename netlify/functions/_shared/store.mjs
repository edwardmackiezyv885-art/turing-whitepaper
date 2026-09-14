import { getStore } from "@netlify/blobs";
import { PAID_STATUSES } from "./config.mjs";

const store = () => getStore({ name: "turing-node-orders", consistency: "strong" });
const orderKey = id => `order/${id}`;
const referenceKey = reference => `reference/${reference}`;
const candidateKey = signature => `candidate/${signature}`;
const reconciliationPaymentKey = signature => `reconciliation/payment/${signature}`;
const reconciliationTerminalKey = signature => `reconciliation/terminal/${signature}`;
const RECONCILIATION_INDEX_MARKER = "reconciliation/index-v1";
const RECONCILIATION_RUN_LATEST = "reconciliation/run/latest";
const RECONCILIATION_LEASE = "reconciliation/run/lease";

async function listKeys(prefix) {
  const keys = [];
  for await (const page of store().list({ prefix, paginate: true })) {
    keys.push(...page.blobs.map(blob => blob.key));
  }
  return keys;
}

async function inBatches(items, size, worker) {
  for (let offset = 0; offset < items.length; offset += size) {
    await Promise.all(items.slice(offset, offset + size).map(worker));
  }
}

async function writeReferenceIndex(order) {
  if (!order?.reference || !order?.id) return;
  const s = store();
  const key = referenceKey(order.reference);
  const value = { orderId: order.id, createdAt: order.createdAt };
  const result = await s.setJSON(key, value, { onlyIfNew: true });
  if (result.modified) return;
  const existing = await s.get(key, { type: "json" });
  if (existing?.orderId !== order.id) {
    throw Object.assign(new Error("Order reference is already assigned"), { status: 409, code: "REFERENCE_ALREADY_USED" });
  }
}

export async function createOrderRecord(order) {
  await writeReferenceIndex(order);
  const result = await store().setJSON(orderKey(order.id), order, { onlyIfNew: true });
  if (!result.modified) throw Object.assign(new Error("Order ID collision"), { status: 409, code: "ORDER_CONFLICT" });
}

export async function getOrder(id, withMetadata = false) {
  const s = store();
  return withMetadata
    ? s.getWithMetadata(orderKey(id), { type: "json" })
    : s.get(orderKey(id), { type: "json" });
}

export async function updateOrder(id, order, etag) {
  const result = await store().setJSON(orderKey(id), order, { onlyIfMatch: etag });
  if (!result.modified) throw Object.assign(new Error("Order changed concurrently"), { status: 409, code: "ORDER_CONFLICT" });
  return result;
}

export async function claimSignature(signature, orderId) {
  const s = store();
  const key = `signature/${signature}`;
  const result = await s.setJSON(key, { orderId, claimedAt: new Date().toISOString() }, { onlyIfNew: true });
  if (result.modified) return;
  const existing = await s.get(key, { type: "json" });
  if (existing?.orderId === orderId) return;
  throw Object.assign(new Error("This transaction signature was already used"), { status: 409, code: "SIGNATURE_ALREADY_USED" });
}

export async function claimWalletProof(proofHash, buyer) {
  const result = await store().setJSON(`wallet-proof/${proofHash}`, { buyer, usedAt: new Date().toISOString() }, { onlyIfNew: true });
  if (!result.modified) throw Object.assign(new Error("Wallet proof was already used"), { status: 409, code: "WALLET_PROOF_ALREADY_USED" });
}

export async function claimIssuanceSignature(signature, orderId) {
  const s = store();
  const key = `issuance-signature/${signature}`;
  const result = await s.setJSON(key, { orderId, claimedAt: new Date().toISOString() }, { onlyIfNew: true });
  if (result.modified) return;
  const existing = await s.get(key, { type: "json" });
  if (existing?.orderId === orderId) return;
  throw Object.assign(new Error("This issuance signature is already assigned to another order"), { status: 409, code: "ISSUANCE_SIGNATURE_USED" });
}

export async function releaseSignature(signature, orderId) {
  const record = await store().get(`signature/${signature}`, { type: "json" });
  if (record?.orderId === orderId) await store().delete(`signature/${signature}`);
}

export async function enqueueCandidateSignature(signature, orderId) {
  const s = store();
  const key = candidateKey(signature);
  const value = { signature, orderId, queuedAt: new Date().toISOString() };
  const result = await s.setJSON(key, value, { onlyIfNew: true });
  if (result.modified) return;
  const existing = await s.get(key, { type: "json" });
  if (existing?.orderId !== orderId) {
    throw Object.assign(new Error("Candidate signature is assigned to another order"), { status: 409, code: "CANDIDATE_SIGNATURE_CONFLICT" });
  }
}

export async function removeCandidateSignature(signature, orderId) {
  if (!signature) return;
  const s = store();
  const key = candidateKey(signature);
  const existing = await s.get(key, { type: "json" });
  if (existing?.orderId === orderId) await s.delete(key);
}

export async function listCandidateSignatures(limit = 40) {
  const s = store();
  const keys = (await listKeys("candidate/")).slice(0, limit);
  const records = await Promise.all(keys.map(key => s.get(key, { type: "json" })));
  return records.filter(record => record?.signature && record?.orderId);
}

export async function listReferenceAddresses() {
  return new Set((await listKeys("reference/")).map(key => key.slice("reference/".length)).filter(Boolean));
}

export async function getOrderIdByReference(reference) {
  return (await store().get(referenceKey(reference), { type: "json" }))?.orderId || null;
}

export async function ensureReconciliationIndexes() {
  const s = store();
  if (await s.get(RECONCILIATION_INDEX_MARKER, { type: "json" })) return { backfilled: false, indexed: 0 };
  const keys = await listKeys("order/");
  let indexed = 0;
  await inBatches(keys, 20, async key => {
    const order = await s.get(key, { type: "json" });
    if (!order?.id || !order?.reference) return;
    await writeReferenceIndex(order);
    if (!PAID_STATUSES.has(order.status) && order.candidateSignature) {
      await enqueueCandidateSignature(order.candidateSignature, order.id);
    }
    indexed += 1;
  });
  await s.setJSON(RECONCILIATION_INDEX_MARKER, { completedAt: new Date().toISOString(), indexed });
  return { backfilled: true, indexed };
}

export async function recordReconciliationPayment(signature, record) {
  const s = store();
  const key = reconciliationPaymentKey(signature);
  const current = await s.getWithMetadata(key, { type: "json" });
  const value = {
    ...current?.data,
    ...record,
    signature,
    firstSeenAt: current?.data?.firstSeenAt || new Date().toISOString(),
    lastCheckedAt: new Date().toISOString()
  };
  const result = current
    ? await s.setJSON(key, value, { onlyIfMatch: current.etag })
    : await s.setJSON(key, value, { onlyIfNew: true });
  if (["matched_paid", "already_paid", "unmatched_incoming"].includes(record.status)) {
    await s.setJSON(reconciliationTerminalKey(signature), { signature, status: record.status, completedAt: new Date().toISOString() });
  }
  return result.modified;
}

export async function listTerminalReconciliationSignatures() {
  return new Set((await listKeys("reconciliation/terminal/"))
    .map(key => key.slice("reconciliation/terminal/".length))
    .filter(Boolean));
}

export async function recordReconciliationRun(summary) {
  await store().setJSON(RECONCILIATION_RUN_LATEST, summary);
}

export async function acquireReconciliationLease(runId, ttlMs = 4 * 60_000) {
  const s = store();
  const current = await s.getWithMetadata(RECONCILIATION_LEASE, { type: "json" });
  if (current?.data && Date.parse(current.data.expiresAt) > Date.now()) return false;
  const lease = {
    runId,
    acquiredAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + ttlMs).toISOString()
  };
  const result = current
    ? await s.setJSON(RECONCILIATION_LEASE, lease, { onlyIfMatch: current.etag })
    : await s.setJSON(RECONCILIATION_LEASE, lease, { onlyIfNew: true });
  return result.modified;
}

export async function getLatestReconciliationRun() {
  return store().get(RECONCILIATION_RUN_LATEST, { type: "json" });
}

export async function listReconciliationIssues(limit = 50) {
  const s = store();
  const keys = await listKeys("reconciliation/payment/");
  const records = [];
  await inBatches(keys, 20, async key => {
    const record = await s.get(key, { type: "json" });
    if (record && !["matched_paid", "already_paid"].includes(record.status)) records.push(record);
  });
  return records
    .sort((a, b) => Date.parse(b.lastCheckedAt || b.firstSeenAt) - Date.parse(a.lastCheckedAt || a.firstSeenAt))
    .slice(0, limit);
}

export async function flagCandidateReconciliationIssue(orderId, signature, error, failedOnChain = false) {
  const current = await getOrder(orderId, true);
  if (!current?.data || PAID_STATUSES.has(current.data.status) || current.data.candidateSignature !== signature) return;
  const next = {
    ...current.data,
    status: failedOnChain ? "failed" : "payment_confirming",
    reconciliationStatus: failedOnChain ? "transaction_failed" : "manual_review_required",
    reconciliationError: String(error?.code || "PAYMENT_RECONCILIATION_FAILED").slice(0, 80),
    reconciliationCheckedAt: new Date().toISOString(),
    ...(failedOnChain ? { candidateSignature: null } : {})
  };
  try { await updateOrder(orderId, next, current.etag); } catch { /* A concurrent payment verifier may have completed the order. */ }
}

export async function reserveTier(tier, orderId, expiresAt) {
  const s = store();
  for (let index = 1; index <= tier.cap; index += 1) {
    const key = `reservation/${tier.id}/${String(index).padStart(4, "0")}`;
    const value = { orderId, expiresAt, createdAt: new Date().toISOString() };
    const created = await s.setJSON(key, value, { onlyIfNew: true });
    if (created.modified) return index;
    const current = await s.getWithMetadata(key, { type: "json" });
      if (!current?.data || current.data.status === "paid" || Date.parse(current.data.expiresAt) + 15 * 60_000 > Date.now()) continue;
    const oldOrder = await getOrder(current.data.orderId);
    if (oldOrder && PAID_STATUSES.has(oldOrder.status)) continue;
    const reclaimed = await s.setJSON(key, value, { onlyIfMatch: current.etag });
    if (reclaimed.modified) return index;
  }
  throw Object.assign(new Error("This node tier is sold out or fully reserved"), { status: 409, code: "SOLD_OUT" });
}

export async function finalizeReservation(order, paymentSignature) {
  const s = store();
  const key = `reservation/${order.tierId}/${String(order.reservationSlot).padStart(4, "0")}`;
  const current = await s.getWithMetadata(key, { type: "json" });
  if (!current?.data || current.data.orderId !== order.id) {
    throw Object.assign(new Error("The reserved node slot is no longer available; contact support before retrying"), { status: 409, code: "RESERVATION_LOST" });
  }
  if (current.data.status === "paid") {
    if (current.data.paymentSignature === paymentSignature) return;
    throw Object.assign(new Error("This order already has a different verified payment"), { status: 409, code: "DUPLICATE_PAYMENT_REVIEW" });
  }
  const result = await s.setJSON(key, { ...current.data, status: "paid", paymentSignature, paidAt: new Date().toISOString() }, { onlyIfMatch: current.etag });
  if (!result.modified) throw Object.assign(new Error("Reservation changed concurrently"), { status: 409, code: "RESERVATION_CONFLICT" });
}

export async function listOrders(status = "fulfillment_queue", limit = 100) {
  const s = store();
  const keys = await listKeys("order/");
  const orders = [];
  await inBatches(keys, 20, async key => {
    const order = await s.get(key, { type: "json" });
    const matches = !status || order?.status === status || (status === "fulfillment_queue" && ["nft_pending", "paid_manual_review"].includes(order?.status));
    if (order && matches) orders.push(order);
  });
  return orders.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, limit);
}
