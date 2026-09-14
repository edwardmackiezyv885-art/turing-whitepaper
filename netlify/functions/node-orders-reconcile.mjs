import { randomUUID } from "node:crypto";
import { Connection } from "@solana/web3.js";
import { envFlag } from "./_shared/config.mjs";
import { runPaymentReconciliation } from "./_shared/reconciliation.mjs";
import { acquireReconciliationLease } from "./_shared/store.mjs";

export function validScheduledEvent(value, now = Date.now()) {
  const nextRun = Date.parse(String(value?.next_run || ""));
  return Number.isFinite(nextRun) && nextRun >= now - 60_000 && nextRun <= now + 10 * 60_000;
}

export default async function handler(request) {
  if (!envFlag("RECONCILIATION_ENABLED", true)) return;
  let event;
  try { event = await request.json(); } catch { event = null; }
  if (!validScheduledEvent(event)) return new Response(null, { status: 404 });
  const runId = randomUUID();
  if (!await acquireReconciliationLease(runId)) {
    console.log("Turing payment reconciliation skipped: another run holds the lease");
    return;
  }
  const connection = new Connection(process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com", "finalized");
  const summary = await runPaymentReconciliation({ connection });
  console.log("Turing payment reconciliation completed", JSON.stringify({ runId, ...summary }));
}

export const config = {
  schedule: "*/5 * * * *"
};
