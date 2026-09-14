import { envFlag, NETWORK, TREASURY_OWNER, TREASURY_USDT_ATA, USDT_MINT } from "./_shared/config.mjs";
import { json, methodNotAllowed } from "./_shared/http.mjs";

export default async function handler(request) {
  if (request.method !== "GET") return methodNotAllowed(["GET"]);
  return json(200, {
    network: NETWORK,
    currency: "USDT",
    mint: USDT_MINT,
    treasuryOwner: TREASURY_OWNER,
    treasuryAta: TREASURY_USDT_ATA,
    saleEnabled: envFlag("SALE_ENABLED"),
    paymentTestEnabled: envFlag("PAYMENT_TEST_ENABLED")
  });
}

export const config = { path: "/api/node-orders/config" };
