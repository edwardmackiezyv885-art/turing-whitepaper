import { envFlag } from "./_shared/config.mjs";
import {
  MERCHANT_APPLICATION_SCHEMA,
  MERCHANT_ASSET_INPUT_MAX_BYTES,
  MERCHANT_ASSET_LIMITS,
  MERCHANT_ASSET_MAX_BYTES,
  MERCHANT_CATALOG_SCHEMA
} from "./_shared/merchant-application-config.mjs";
import { json, methodNotAllowed } from "./_shared/http.mjs";

export default async function handler(request) {
  if (request.method !== "GET") return methodNotAllowed(["GET"]);
  return json(200, {
    applicationSchema: MERCHANT_APPLICATION_SCHEMA,
    catalogSchema: MERCHANT_CATALOG_SCHEMA,
    imageTypes: ["image/jpeg", "image/png", "image/webp"],
    maxUploadedBytes: MERCHANT_ASSET_MAX_BYTES,
    maxInputBytes: MERCHANT_ASSET_INPUT_MAX_BYTES,
    assetLimits: MERCHANT_ASSET_LIMITS,
    chainCatalog: {
      target: "turing-chain-marketplace",
      exportReady: true,
      syncEnabled: envFlag("CHAIN_MALL_SYNC_ENABLED"),
      writeMode: "disabled_until_adapter_configured"
    }
  });
}

export const config = { path: "/api/merchant-applications/config" };

