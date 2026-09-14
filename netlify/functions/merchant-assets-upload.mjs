import { createHash, randomUUID } from "node:crypto";
import {
  MERCHANT_ASSET_LIMITS,
  MERCHANT_ASSET_MAX_BYTES,
  MERCHANT_IMAGE_TYPES,
  verifyApplicationToken
} from "./_shared/merchant-application-config.mjs";
import {
  deleteMerchantAsset,
  getMerchantApplication,
  putMerchantAsset,
  updateMerchantApplication
} from "./_shared/merchant-application-store.mjs";
import { assertSameOrigin, handleError, json, methodNotAllowed } from "./_shared/http.mjs";

const MAX_REQUEST_BYTES = MERCHANT_ASSET_MAX_BYTES + 256 * 1024;

function uuid(value) {
  const text = String(value || "");
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text) ? text : "";
}

function clean(value, max) {
  const text = String(value || "").trim();
  if (text.length > max) throw Object.assign(new Error("Asset metadata is too long"), { status: 400, code: "INVALID_ASSET_METADATA" });
  return text;
}

function imageSignatureIsValid(bytes, mimeType) {
  if (mimeType === "image/jpeg") return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mimeType === "image/png") return bytes.length > 8 && bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"));
  if (mimeType === "image/webp") return bytes.length > 12 && bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
  return false;
}

export default async function handler(request) {
  if (request.method !== "POST") return methodNotAllowed(["POST"]);
  let written = null;
  try {
    assertSameOrigin(request);
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > MAX_REQUEST_BYTES) {
      throw Object.assign(new Error("Image upload exceeds the 4 MB limit"), { status: 413, code: "ASSET_TOO_LARGE" });
    }
    const form = await request.formData();
    const applicationId = uuid(form.get("applicationId"));
    const assetId = uuid(form.get("assetId")) || randomUUID();
    const kind = String(form.get("kind") || "");
    if (!applicationId || !["storefront", "product"].includes(kind)) {
      throw Object.assign(new Error("Application ID or asset type is invalid"), { status: 400, code: "INVALID_ASSET_UPLOAD" });
    }
    const current = await getMerchantApplication(applicationId, true);
    if (!current?.data) throw Object.assign(new Error("Merchant application not found"), { status: 404, code: "APPLICATION_NOT_FOUND" });
    verifyApplicationToken(current.data, request.headers.get("x-application-token"));
    if (current.data.status !== "draft" || Date.parse(current.data.expiresAt) <= Date.now()) {
      throw Object.assign(new Error("Merchant application draft is closed"), { status: 409, code: "APPLICATION_DRAFT_CLOSED" });
    }
    const existing = (current.data.assets || []).find(asset => asset.id === assetId);
    if (existing) return json(200, { asset: existing, idempotent: true });
    const currentCount = (current.data.assets || []).filter(asset => asset.kind === kind).length;
    if (currentCount >= MERCHANT_ASSET_LIMITS[kind]) {
      throw Object.assign(new Error("Image limit reached for this asset group"), { status: 409, code: "ASSET_LIMIT_REACHED" });
    }

    const file = form.get("file");
    if (!file || typeof file.arrayBuffer !== "function") {
      throw Object.assign(new Error("Image file is required"), { status: 400, code: "ASSET_FILE_REQUIRED" });
    }
    const mimeType = String(file.type || "").toLowerCase();
    if (!MERCHANT_IMAGE_TYPES.has(mimeType)) {
      throw Object.assign(new Error("Only JPEG, PNG, and WebP images are accepted"), { status: 415, code: "UNSUPPORTED_ASSET_TYPE" });
    }
    if (!Number.isFinite(file.size) || file.size < 1 || file.size > MERCHANT_ASSET_MAX_BYTES) {
      throw Object.assign(new Error("Image must be between 1 byte and 4 MB"), { status: 413, code: "ASSET_TOO_LARGE" });
    }
    const bytes = Buffer.from(await file.arrayBuffer());
    if (!imageSignatureIsValid(bytes, mimeType)) {
      throw Object.assign(new Error("Image contents do not match the declared file type"), { status: 415, code: "INVALID_IMAGE_SIGNATURE" });
    }
    const width = Number(form.get("width") || 0);
    const height = Number(form.get("height") || 0);
    const summary = {
      id: assetId,
      kind,
      originalName: clean(file.name || "merchant-image", 160),
      mimeType,
      bytes: bytes.length,
      width: Number.isInteger(width) && width > 0 && width <= 12000 ? width : null,
      height: Number.isInteger(height) && height > 0 && height <= 12000 ? height : null,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      caption: clean(form.get("caption"), 240),
      uploadedAt: new Date().toISOString(),
      reviewStatus: "pending"
    };
    const binary = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    written = { applicationId, assetId, result: await putMerchantAsset(applicationId, assetId, binary, summary) };
    const next = { ...current.data, assets: [...(current.data.assets || []), summary], version: Number(current.data.version || 1) + 1 };
    await updateMerchantApplication(applicationId, next, current.etag);
    return json(201, { asset: summary });
  } catch (error) {
    if (written?.result?.modified) {
      try { await deleteMerchantAsset(written.applicationId, written.assetId); } catch { /* A later cleanup can remove an orphan. */ }
    }
    return handleError(error);
  }
}

export const config = {
  path: "/api/merchant-assets/upload",
  rateLimit: { windowLimit: 30, windowSize: 300, aggregateBy: ["ip", "domain"] }
};

