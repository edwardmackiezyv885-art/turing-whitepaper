import {
  MERCHANT_APPLICATION_STATUSES,
  isMerchantUuid,
  safeMerchantApplicationForAdmin
} from "./_shared/merchant-application-config.mjs";
import {
  getMerchantApplication,
  listMerchantApplications,
  updateMerchantApplication
} from "./_shared/merchant-application-store.mjs";
import { handleError, json, methodNotAllowed, readJson, requireAdmin } from "./_shared/http.mjs";

const REVIEW_STATUSES = new Set(["submitted", "under_review", "changes_requested", "approved", "catalog_ready", "rejected"]);

export default async function handler(request) {
  if (!["GET", "POST"].includes(request.method)) return methodNotAllowed(["GET", "POST"]);
  try {
    requireAdmin(request);
    if (request.method === "GET") {
      const status = new URL(request.url).searchParams.get("status") || "";
      if (status && !MERCHANT_APPLICATION_STATUSES.has(status)) {
        throw Object.assign(new Error("Invalid merchant application status"), { status: 400, code: "INVALID_STATUS" });
      }
      const applications = await listMerchantApplications(status, 100);
      return json(200, { applications: applications.map(safeMerchantApplicationForAdmin) });
    }
    const body = await readJson(request, 16 * 1024);
    if (body.action !== "set_status" || !REVIEW_STATUSES.has(body.status)) {
      throw Object.assign(new Error("Invalid merchant review action"), { status: 400, code: "INVALID_ACTION" });
    }
    const applicationId = String(body.applicationId || "");
    if (!isMerchantUuid(applicationId)) {
      throw Object.assign(new Error("Merchant application ID is invalid"), { status: 400, code: "INVALID_APPLICATION" });
    }
    const current = await getMerchantApplication(applicationId, true);
    if (!current?.data) throw Object.assign(new Error("Merchant application not found"), { status: 404, code: "APPLICATION_NOT_FOUND" });
    if (current.data.status === "draft") {
      throw Object.assign(new Error("Draft applications cannot enter review"), { status: 409, code: "APPLICATION_NOT_SUBMITTED" });
    }
    if (body.status === "catalog_ready" && current.data.chainCatalog?.readiness !== "review_required") {
      throw Object.assign(new Error("Storefront and structured product images are required before catalog sync"), { status: 409, code: "CATALOG_ASSETS_REQUIRED" });
    }
    const now = new Date().toISOString();
    const next = {
      ...current.data,
      status: body.status,
      version: Number(current.data.version || 1) + 1,
      review: {
        status: body.status,
        note: String(body.note || "").trim().slice(0, 1000),
        updatedAt: now
      },
      chainCatalog: {
        ...current.data.chainCatalog,
        readiness: body.status === "catalog_ready" ? "ready_for_sync" : current.data.chainCatalog?.readiness
      }
    };
    await updateMerchantApplication(applicationId, next, current.etag);
    return json(200, { application: safeMerchantApplicationForAdmin(next) });
  } catch (error) {
    return handleError(error);
  }
}

export const config = { path: "/api/merchant-applications/admin" };
