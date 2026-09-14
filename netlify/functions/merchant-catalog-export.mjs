import { buildMerchantCatalog, isMerchantUuid } from "./_shared/merchant-application-config.mjs";
import { getMerchantApplication } from "./_shared/merchant-application-store.mjs";
import { handleError, json, methodNotAllowed, requireAdmin } from "./_shared/http.mjs";

export default async function handler(request) {
  if (request.method !== "GET") return methodNotAllowed(["GET"]);
  try {
    requireAdmin(request);
    const applicationId = String(new URL(request.url).searchParams.get("applicationId") || "");
    if (!isMerchantUuid(applicationId)) {
      throw Object.assign(new Error("Merchant application ID is invalid"), { status: 400, code: "INVALID_APPLICATION" });
    }
    const application = await getMerchantApplication(applicationId);
    if (!application) throw Object.assign(new Error("Merchant application not found"), { status: 404, code: "APPLICATION_NOT_FOUND" });
    return json(200, { catalog: buildMerchantCatalog(application) });
  } catch (error) {
    return handleError(error);
  }
}

export const config = { path: "/api/merchant-catalog/export" };
