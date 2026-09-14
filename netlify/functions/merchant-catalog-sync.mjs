import { envFlag } from "./_shared/config.mjs";
import { buildMerchantCatalog, isMerchantUuid } from "./_shared/merchant-application-config.mjs";
import { getMerchantApplication } from "./_shared/merchant-application-store.mjs";
import { handleError, json, methodNotAllowed, readJson, requireAdmin } from "./_shared/http.mjs";

export default async function handler(request) {
  if (request.method !== "POST") return methodNotAllowed(["POST"]);
  try {
    requireAdmin(request);
    const body = await readJson(request);
    const applicationId = String(body.applicationId || "");
    if (!isMerchantUuid(applicationId)) {
      throw Object.assign(new Error("Merchant application ID is invalid"), { status: 400, code: "INVALID_APPLICATION" });
    }
    const application = await getMerchantApplication(applicationId);
    if (!application) throw Object.assign(new Error("Merchant application not found"), { status: 404, code: "APPLICATION_NOT_FOUND" });
    const catalog = buildMerchantCatalog(application);
    if (application.status !== "catalog_ready" || application.chainCatalog?.readiness !== "ready_for_sync") {
      throw Object.assign(new Error("Merchant catalog has not passed review"), { status: 409, code: "CATALOG_NOT_READY" });
    }
    if (!envFlag("CHAIN_MALL_SYNC_ENABLED")) {
      return json(503, {
        error: "CHAIN_MALL_SYNC_DISABLED",
        message: "Chain marketplace adapter is reserved but not enabled",
        schema: catalog.schema,
        applicationId: application.id,
        requiredState: "catalog_ready"
      });
    }
    return json(501, {
      error: "CHAIN_MALL_ADAPTER_NOT_CONFIGURED",
      message: "Configure and audit the chain marketplace adapter before enabling writes",
      schema: catalog.schema,
      applicationId: application.id
    });
  } catch (error) {
    return handleError(error);
  }
}

export const config = { path: "/api/merchant-catalog/sync" };
