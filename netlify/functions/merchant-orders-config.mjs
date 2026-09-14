import { envFlag } from "./_shared/config.mjs";
import {
  MERCHANT_SERVICE_FEE,
  NETWORK,
  TREASURY_OWNER,
  TREASURY_USDT_ATA,
  USDT_DECIMALS,
  USDT_MINT
} from "./_shared/merchant-config.mjs";
import { json, methodNotAllowed } from "./_shared/http.mjs";

export default async function handler(request) {
  if (request.method !== "GET") return methodNotAllowed(["GET"]);
  return json(200, {
    enabled: envFlag("MERCHANT_FEE_ENABLED"),
    network: NETWORK,
    currency: "USDT",
    amount: MERCHANT_SERVICE_FEE.displayAmount,
    amountBaseUnits: MERCHANT_SERVICE_FEE.amount,
    referenceCny: MERCHANT_SERVICE_FEE.referenceCny,
    serviceId: MERCHANT_SERVICE_FEE.id,
    mint: USDT_MINT,
    decimals: USDT_DECIMALS,
    treasuryOwner: TREASURY_OWNER,
    treasuryAta: TREASURY_USDT_ATA,
    settlementNotice: "COMMERCIAL_SERVICE_FEE_NO_YIELD_NO_PRINCIPAL_REDEMPTION_NO_NFT_NO_TUR"
  });
}

export const config = { path: "/api/merchant-orders/config" };

