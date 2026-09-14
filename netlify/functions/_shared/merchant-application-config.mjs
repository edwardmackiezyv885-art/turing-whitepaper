import { randomBytes, timingSafeEqual } from "node:crypto";
import { sha256 } from "./config.mjs";

export const MERCHANT_APPLICATION_SCHEMA = "turing.merchant-application.v1";
export const MERCHANT_CATALOG_SCHEMA = "turing.chain-catalog.v1";
export const MERCHANT_DRAFT_TTL_MS = 48 * 60 * 60 * 1000;
export const MERCHANT_ASSET_MAX_BYTES = 4 * 1024 * 1024;
export const MERCHANT_ASSET_INPUT_MAX_BYTES = 12 * 1024 * 1024;
export const MERCHANT_ASSET_LIMITS = Object.freeze({ storefront: 6, product: 12 });
export const MERCHANT_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
export const MERCHANT_APPLICATION_STATUSES = new Set([
  "draft",
  "submitted",
  "under_review",
  "changes_requested",
  "approved",
  "catalog_ready",
  "rejected"
]);

const ENTITY_TYPES = new Set(["company", "sole-proprietor", "brand", "authorized-agent", "other"]);
const GEM_PREFERENCES = new Set(["pilot", "benefit-only", "review", "not-now"]);
const LOCALES = new Set(["zh", "en"]);

export function isMerchantUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
}

function cleanText(value, max, required = false) {
  const text = String(value ?? "").replace(/\r\n?/g, "\n").trim();
  if (required && !text) throw Object.assign(new Error("Required merchant field is missing"), { status: 400, code: "INVALID_APPLICATION_FIELD" });
  if (text.length > max) throw Object.assign(new Error("Merchant field is too long"), { status: 400, code: "INVALID_APPLICATION_FIELD" });
  return text;
}

function oneOf(value, allowed, code = "INVALID_APPLICATION_FIELD") {
  const normalized = String(value || "");
  if (!allowed.has(normalized)) throw Object.assign(new Error("Merchant field has an unsupported value"), { status: 400, code });
  return normalized;
}

function cleanUrl(value) {
  const text = cleanText(value, 300);
  if (!text) return "";
  let parsed;
  try { parsed = new URL(text); } catch { parsed = null; }
  if (!parsed || !["https:", "http:"].includes(parsed.protocol)) {
    throw Object.assign(new Error("Official website URL is invalid"), { status: 400, code: "INVALID_APPLICATION_FIELD" });
  }
  return parsed.toString();
}

function cleanAssetIds(value) {
  if (!Array.isArray(value)) return [];
  const ids = value.map(item => String(item || "")).filter(isMerchantUuid);
  return [...new Set(ids)].slice(0, MERCHANT_ASSET_LIMITS.storefront + MERCHANT_ASSET_LIMITS.product);
}

function cleanProducts(value, assetIds) {
  if (!Array.isArray(value)) return [];
  const allowedAssets = new Set(assetIds);
  return value.slice(0, MERCHANT_ASSET_LIMITS.product).map((item, index) => {
    const assetId = String(item?.assetId || "");
    if (!allowedAssets.has(assetId)) {
      throw Object.assign(new Error("Product image is not attached to this application"), { status: 400, code: "INVALID_PRODUCT_ASSET" });
    }
    return {
      id: isMerchantUuid(item?.id) ? String(item.id) : assetId,
      assetId,
      sortOrder: index,
      name: cleanText(item?.name, 120, true),
      priceLabel: cleanText(item?.priceLabel, 80, true),
      description: cleanText(item?.description, 500)
    };
  });
}

export function randomApplicationToken() {
  return randomBytes(32).toString("base64url");
}

export function verifyApplicationToken(application, provided) {
  const token = String(provided || "");
  const expected = String(application?.applicationTokenHash || "");
  const actual = sha256(token);
  const left = Buffer.from(expected);
  const right = Buffer.from(actual);
  if (!token || left.length !== right.length || !timingSafeEqual(left, right)) {
    throw Object.assign(new Error("Merchant application credential is invalid"), { status: 401, code: "INVALID_APPLICATION_TOKEN" });
  }
  return true;
}

export function normalizeMerchantSubmission(body, draft) {
  const assetIds = cleanAssetIds(body.assetIds);
  const draftAssets = Array.isArray(draft?.assets) ? draft.assets : [];
  const owned = new Set(draftAssets.map(asset => asset.id));
  if (assetIds.some(id => !owned.has(id))) {
    throw Object.assign(new Error("Application contains an unknown asset"), { status: 400, code: "UNKNOWN_APPLICATION_ASSET" });
  }
  const storefrontAssetIds = assetIds.filter(id => draftAssets.find(asset => asset.id === id)?.kind === "storefront")
    .slice(0, MERCHANT_ASSET_LIMITS.storefront);
  const productAssetIds = assetIds.filter(id => draftAssets.find(asset => asset.id === id)?.kind === "product")
    .slice(0, MERCHANT_ASSET_LIMITS.product);
  const products = cleanProducts(body.products, productAssetIds);
  const locale = oneOf(body.locale || "zh", LOCALES);

  return {
    schema: MERCHANT_APPLICATION_SCHEMA,
    id: draft.id,
    version: Number(draft.version || 1),
    status: "submitted",
    createdAt: draft.createdAt,
    submittedAt: new Date().toISOString(),
    expiresAt: null,
    applicationTokenHash: draft.applicationTokenHash,
    locale,
    sourcePage: cleanText(body.sourcePage || "whitepaper-merchant-onboarding", 80),
    business: {
      name: cleanText(body.businessName, 120, true),
      entityType: oneOf(body.entityType, ENTITY_TYPES),
      registrationRegion: cleanText(body.registrationRegion, 100, true),
      category: cleanText(body.businessCategory, 100, true)
    },
    contact: {
      name: cleanText(body.contactName, 80, true),
      method: cleanText(body.contactMethod, 160, true)
    },
    storefront: {
      address: cleanText(body.storeAddress, 240, true),
      launchRegion: body.launchRegion === "turing-metaverse-city" ? body.launchRegion : "turing-metaverse-city",
      introduction: cleanText(body.businessIntro, 1800, true),
      officialWebsite: cleanUrl(body.officialWebsite),
      externalAssetLinks: cleanText(body.assetLinks, 1600),
      coverAssetId: storefrontAssetIds[0] || null,
      galleryAssetIds: storefrontAssetIds
    },
    offering: {
      summary: cleanText(body.productsServices, 1800, true),
      playerOffer: cleanText(body.playerOffer, 1200, true),
      gemPreference: oneOf(body.gemPreference, GEM_PREFERENCES),
      products
    },
    declarations: {
      authorizationConfirmed: body.authorizationConfirmed === true,
      termsAcknowledged: body.termsAcknowledged === true,
      privacyAcknowledged: body.privacyAcknowledged === true
    },
    assets: draftAssets.filter(asset => assetIds.includes(asset.id)),
    review: {
      status: "submitted",
      note: "",
      updatedAt: new Date().toISOString()
    },
    chainCatalog: {
      schema: MERCHANT_CATALOG_SCHEMA,
      readiness: storefrontAssetIds.length > 0 && products.length > 0 ? "review_required" : "missing_assets",
      syncStatus: "not_configured",
      target: "turing-chain-marketplace",
      storefrontAssetIds,
      productAssetIds,
      contentUri: null,
      transactionSignature: null,
      lastAttemptAt: null
    }
  };
}

export function safeMerchantApplicationForAdmin(application) {
  if (!application) return null;
  const { applicationTokenHash, ...safe } = application;
  return safe;
}

export function buildMerchantCatalog(application) {
  if (!application || application.status === "draft") {
    throw Object.assign(new Error("Merchant application is not submitted"), { status: 409, code: "APPLICATION_NOT_SUBMITTED" });
  }
  const assetById = new Map((application.assets || []).map(asset => [asset.id, asset]));
  const publicAsset = id => {
    const asset = assetById.get(id);
    return asset ? {
      assetId: asset.id,
      role: asset.kind,
      mimeType: asset.mimeType,
      bytes: asset.bytes,
      width: asset.width || null,
      height: asset.height || null,
      sha256: asset.sha256,
      contentUri: null
    } : null;
  };
  return {
    schema: MERCHANT_CATALOG_SCHEMA,
    generatedAt: new Date().toISOString(),
    applicationId: application.id,
    merchantId: null,
    status: application.chainCatalog?.readiness || "review_required",
    storefront: {
      name: application.business.name,
      category: application.business.category,
      introduction: application.storefront.introduction,
      launchRegion: application.storefront.launchRegion,
      cover: application.storefront.coverAssetId ? publicAsset(application.storefront.coverAssetId) : null,
      gallery: (application.storefront.galleryAssetIds || []).map(publicAsset).filter(Boolean)
    },
    products: (application.offering.products || []).map(product => ({
      id: product.id,
      name: product.name,
      priceLabel: product.priceLabel,
      description: product.description,
      image: publicAsset(product.assetId)
    })),
    chain: {
      target: "turing-chain-marketplace",
      contentUri: application.chainCatalog?.contentUri || null,
      transactionSignature: application.chainCatalog?.transactionSignature || null,
      syncStatus: application.chainCatalog?.syncStatus || "not_configured"
    }
  };
}
