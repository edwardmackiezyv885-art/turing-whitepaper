import { MERCHANT_PAID_STATUSES } from "./merchant-config.mjs";
import {
  claimMerchantSignature,
  getMerchantOrder,
  removeMerchantCandidate,
  updateMerchantOrder
} from "./merchant-store.mjs";
import { validatePaymentTransaction } from "./verify-solana.mjs";

function paidAt(parsed) {
  return new Date(Number(parsed.blockTime) * 1000).toISOString();
}

export async function settleMerchantPayment({ orderId, signature, parsed, raw, source = "customer_verify" }) {
  const current = await getMerchantOrder(orderId, true);
  const order = current?.data;
  if (!order) throw Object.assign(new Error("Order not found"), { status: 404, code: "ORDER_NOT_FOUND" });
  if (MERCHANT_PAID_STATUSES.has(order.status)) {
    if (order.paymentSignature !== signature) {
      throw Object.assign(new Error("Order is already paid"), { status: 409, code: "ORDER_ALREADY_PAID" });
    }
    try { await removeMerchantCandidate(signature, orderId); } catch { /* Harmless stale candidate. */ }
    return { order, alreadyPaid: true };
  }

  validatePaymentTransaction(parsed, order, raw);
  await claimMerchantSignature(signature, orderId);
  const paidOrder = {
    ...order,
    status: "service_fee_paid",
    paymentSignature: signature,
    candidateSignature: null,
    paidAt: paidAt(parsed),
    verifiedAt: new Date().toISOString(),
    paymentVerificationSource: source
  };

  try {
    await updateMerchantOrder(orderId, paidOrder, current.etag);
  } catch (error) {
    const latest = await getMerchantOrder(orderId);
    if (latest && MERCHANT_PAID_STATUSES.has(latest.status) && latest.paymentSignature === signature) {
      return { order: latest, alreadyPaid: true };
    }
    throw error;
  }
  try { await removeMerchantCandidate(signature, orderId); } catch { /* Harmless stale candidate. */ }
  return { order: paidOrder, alreadyPaid: false };
}

