import {
  isMerchantUuid,
  normalizeMerchantSubmission,
  safeMerchantApplicationForAdmin,
  verifyApplicationToken
} from "./_shared/merchant-application-config.mjs";
import { getMerchantApplication, updateMerchantApplication } from "./_shared/merchant-application-store.mjs";
import { assertSameOrigin, handleError, json, methodNotAllowed, readJson } from "./_shared/http.mjs";

export default async function handler(request) {
  if (request.method !== "POST") return methodNotAllowed(["POST"]);
  try {
    assertSameOrigin(request);
    const body = await readJson(request, 64 * 1024);
    const applicationId = String(body.applicationId || "");
    if (!isMerchantUuid(applicationId)) {
      throw Object.assign(new Error("Merchant application ID is invalid"), { status: 400, code: "INVALID_APPLICATION" });
    }
    const current = await getMerchantApplication(applicationId, true);
    if (!current?.data) throw Object.assign(new Error("Merchant application not found"), { status: 404, code: "APPLICATION_NOT_FOUND" });
    verifyApplicationToken(current.data, request.headers.get("x-application-token"));
    if (current.data.status !== "draft") {
      if (current.data.status === "submitted") return json(200, { application: safeMerchantApplicationForAdmin(current.data), idempotent: true });
      throw Object.assign(new Error("Merchant application cannot be submitted from its current state"), { status: 409, code: "APPLICATION_NOT_DRAFT" });
    }
    if (Date.parse(current.data.expiresAt) <= Date.now()) {
      throw Object.assign(new Error("Merchant application draft has expired"), { status: 409, code: "APPLICATION_DRAFT_EXPIRED" });
    }
    const submitted = normalizeMerchantSubmission(body, current.data);
    if (!Object.values(submitted.declarations).every(Boolean)) {
      throw Object.assign(new Error("All merchant declarations must be confirmed"), { status: 400, code: "DECLARATIONS_REQUIRED" });
    }
    await updateMerchantApplication(applicationId, submitted, current.etag);
    return json(201, { application: safeMerchantApplicationForAdmin(submitted) });
  } catch (error) {
    return handleError(error);
  }
}

export const config = {
  path: "/api/merchant-applications/submit",
  rateLimit: { windowLimit: 5, windowSize: 300, aggregateBy: ["ip", "domain"] }
};
