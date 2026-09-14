import { isMerchantUuid } from "./_shared/merchant-application-config.mjs";
import { getMerchantAsset } from "./_shared/merchant-application-store.mjs";
import { handleError, json, methodNotAllowed, requireAdmin } from "./_shared/http.mjs";

export default async function handler(request) {
  if (request.method !== "GET") return methodNotAllowed(["GET"]);
  try {
    requireAdmin(request);
    const url = new URL(request.url);
    const applicationId = String(url.searchParams.get("applicationId") || "");
    const assetId = String(url.searchParams.get("assetId") || "");
    if (!isMerchantUuid(applicationId) || !isMerchantUuid(assetId)) {
      return json(400, { error: "INVALID_ASSET_REFERENCE", message: "Asset reference is invalid" });
    }
    const asset = await getMerchantAsset(applicationId, assetId);
    if (!asset?.data) return json(404, { error: "ASSET_NOT_FOUND", message: "Merchant asset not found" });
    return new Response(asset.data, {
      status: 200,
      headers: {
        "content-type": String(asset.metadata?.mimeType || "application/octet-stream"),
        "content-length": String(asset.data.byteLength),
        "cache-control": "private, no-store",
        "content-disposition": "inline",
        "x-content-type-options": "nosniff"
      }
    });
  } catch (error) {
    return handleError(error);
  }
}

export const config = { path: "/api/merchant-assets/file" };
