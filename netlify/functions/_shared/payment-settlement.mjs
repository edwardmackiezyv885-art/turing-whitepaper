import { PAID_STATUSES } from "./config.mjs";
import {
  claimSignature, finalizeReservation, getOrder, removeCandidateSignature, updateOrder
} from "./store.mjs";
import { validatePaymentTransaction } from "./verify-solana.mjs";

const REVIEWABLE_RESERVATION_ERRORS = new Set([
  "RESERVATION_LOST", "RESERVATION_CONFLICT", "DUPLICATE_PAYMENT_REVIEW"
]);

function paidAt(parsed) {
  return new Date(Number(parsed.blockTime) * 1000).toISOString();
}

function paymentMetadata(order, signature, parsed, source) {
  return {
    paymentSignature: signature,
    candidateSignature: null,
    paidAt: paidAt(parsed),
    verifiedAt: new Date().toISOString(),
    paymentVerificationSource: source,
    reconciliationStatus: "matched",
    reconciliationError: null,
    reconciliationCheckedAt: new Date().toISOString(),
    ...(source === "scheduled_reconciliation" ? { reconciledAt: new Date().toISOString() } : {}),
    referralStatus: order.isTest
      ? (order.referrer ? "historical_non_production_claimed" : "historical_non_production_direct")
      : (order.referrer ? "claimed_pending_eligibility_review" : "official_direct")
  };
}

async function cleanupCandidate(signature, orderId) {
  try { await removeCandidateSignature(signature, orderId); }
  catch { /* A stale queue item is harmless and will be cleaned on a later run. */ }
}

export async function settleVerifiedPayment({ orderId, signature, parsed, raw, source = "customer_verify" }) {
  const current = await getOrder(orderId, true);
  const order = current?.data;
  if (!order) throw Object.assign(new Error("Order not found"), { status: 404, code: "ORDER_NOT_FOUND" });
  if (PAID_STATUSES.has(order.status)) {
    if (order.paymentSignature !== signature) {
      throw Object.assign(new Error("Order is already paid"), { status: 409, code: "ORDER_ALREADY_PAID" });
    }
    await cleanupCandidate(signature, orderId);
    return { order, alreadyPaid: true, reviewRequired: order.status === "paid_manual_review" };
  }

  validatePaymentTransaction(parsed, order, raw);
  await claimSignature(signature, orderId);

  let reviewReason = null;
  try {
    await finalizeReservation(order, signature);
  } catch (error) {
    if (!REVIEWABLE_RESERVATION_ERRORS.has(error.code)) throw error;
    reviewReason = error.code;
  }

  const metadata = paymentMetadata(order, signature, parsed, source);
  const paidOrder = reviewReason
    ? { ...order, ...metadata, status: "paid_manual_review", reviewReason }
    : { ...order, ...metadata, status: order.isTest ? "test_paid" : "nft_pending" };

  try {
    await updateOrder(orderId, paidOrder, current.etag);
  } catch (error) {
    const latest = await getOrder(orderId);
    if (latest && PAID_STATUSES.has(latest.status) && latest.paymentSignature === signature) {
      await cleanupCandidate(signature, orderId);
      return { order: latest, alreadyPaid: true, reviewRequired: latest.status === "paid_manual_review" };
    }
    throw error;
  }
  await cleanupCandidate(signature, orderId);
  return { order: paidOrder, alreadyPaid: false, reviewRequired: Boolean(reviewReason) };
}
