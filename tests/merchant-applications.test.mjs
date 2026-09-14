import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { sha256 } from "../netlify/functions/_shared/config.mjs";
import {
  MERCHANT_APPLICATION_SCHEMA,
  MERCHANT_ASSET_INPUT_MAX_BYTES,
  MERCHANT_ASSET_LIMITS,
  MERCHANT_ASSET_MAX_BYTES,
  MERCHANT_CATALOG_SCHEMA,
  buildMerchantCatalog,
  normalizeMerchantSubmission,
  randomApplicationToken,
  safeMerchantApplicationForAdmin,
  verifyApplicationToken
} from "../netlify/functions/_shared/merchant-application-config.mjs";
import configHandler from "../netlify/functions/merchant-applications-config.mjs";
import syncHandler from "../netlify/functions/merchant-catalog-sync.mjs";

const origin = "https://meta9898.shop";
const applicationId = "22222222-2222-4222-8222-222222222222";
const storefrontId = "33333333-3333-4333-8333-333333333333";
const productId = "44444444-4444-4444-8444-444444444444";
const token = randomApplicationToken();

const draft = {
  schema: MERCHANT_APPLICATION_SCHEMA,
  id: applicationId,
  version: 1,
  status: "draft",
  createdAt: "2026-07-30T00:00:00.000Z",
  expiresAt: "2026-08-01T00:00:00.000Z",
  applicationTokenHash: sha256(token),
  assets: [
    {
      id: storefrontId,
      kind: "storefront",
      originalName: "store.webp",
      mimeType: "image/webp",
      bytes: 240000,
      width: 1600,
      height: 1000,
      sha256: "a".repeat(64),
      caption: "门店正面"
    },
    {
      id: productId,
      kind: "product",
      originalName: "product.webp",
      mimeType: "image/webp",
      bytes: 180000,
      width: 1200,
      height: 1200,
      sha256: "b".repeat(64),
      caption: "招牌商品"
    }
  ]
};

const submission = {
  applicationId,
  locale: "zh",
  sourcePage: "whitepaper-merchant-onboarding",
  businessName: "图灵测试商店",
  entityType: "company",
  registrationRegion: "云南",
  contactName: "测试联系人",
  contactMethod: "merchant@example.com",
  storeAddress: "图灵元宇宙城市 CBD",
  businessCategory: "餐饮",
  launchRegion: "turing-metaverse-city",
  businessIntro: "展示实体门店、品牌与服务场景。",
  productsServices: "本地特色商品与到店服务。",
  playerOffer: "游戏渠道到店客户享受公开折扣。",
  gemPreference: "pilot",
  officialWebsite: "https://example.com/store",
  assetLinks: "",
  authorizationConfirmed: true,
  termsAcknowledged: true,
  privacyAcknowledged: true,
  assetIds: [storefrontId, productId],
  products: [{
    id: productId,
    assetId: productId,
    name: "招牌套餐",
    priceLabel: "68 CNY",
    description: "门店可用"
  }]
};

test("merchant schemas and upload boundaries are versioned and exact", () => {
  assert.equal(MERCHANT_APPLICATION_SCHEMA, "turing.merchant-application.v1");
  assert.equal(MERCHANT_CATALOG_SCHEMA, "turing.chain-catalog.v1");
  assert.deepEqual(MERCHANT_ASSET_LIMITS, { storefront: 6, product: 12 });
  assert.equal(MERCHANT_ASSET_INPUT_MAX_BYTES, 12 * 1024 * 1024);
  assert.equal(MERCHANT_ASSET_MAX_BYTES, 4 * 1024 * 1024);
  assert.ok(token.length >= 40);
});

test("application tokens are verified by hash and never exposed to the admin view", () => {
  assert.equal(verifyApplicationToken(draft, token), true);
  assert.throws(
    () => verifyApplicationToken(draft, "wrong-token"),
    error => error.code === "INVALID_APPLICATION_TOKEN" && error.status === 401
  );
  const safe = safeMerchantApplicationForAdmin(draft);
  assert.equal("applicationTokenHash" in safe, false);
  assert.equal(draft.applicationTokenHash, sha256(token));
});

test("submission binds owned images to a structured, reviewable catalog", () => {
  const application = normalizeMerchantSubmission(submission, draft);
  assert.equal(application.status, "submitted");
  assert.equal(application.storefront.coverAssetId, storefrontId);
  assert.deepEqual(application.storefront.galleryAssetIds, [storefrontId]);
  assert.equal(application.offering.products[0].assetId, productId);
  assert.equal(application.offering.products[0].priceLabel, "68 CNY");
  assert.equal(application.chainCatalog.readiness, "review_required");
  assert.equal(application.chainCatalog.syncStatus, "not_configured");
  assert.equal(application.assets.length, 2);
});

test("submission rejects images that do not belong to its draft", () => {
  assert.throws(
    () => normalizeMerchantSubmission({
      ...submission,
      assetIds: [...submission.assetIds, "55555555-5555-4555-8555-555555555555"]
    }, draft),
    error => error.code === "UNKNOWN_APPLICATION_ASSET"
  );
  assert.throws(
    () => normalizeMerchantSubmission({
      ...submission,
      products: [{ ...submission.products[0], assetId: storefrontId }]
    }, draft),
    error => error.code === "INVALID_PRODUCT_ASSET"
  );
});

test("marketplace export excludes merchant contact details and keeps content URIs unassigned", () => {
  const application = normalizeMerchantSubmission(submission, draft);
  const catalog = buildMerchantCatalog(application);
  assert.equal(catalog.schema, MERCHANT_CATALOG_SCHEMA);
  assert.equal(catalog.storefront.name, submission.businessName);
  assert.equal(catalog.storefront.cover.assetId, storefrontId);
  assert.equal(catalog.storefront.cover.contentUri, null);
  assert.equal(catalog.products[0].image.assetId, productId);
  assert.equal(catalog.chain.syncStatus, "not_configured");
  assert.equal("contact" in catalog, false);
  assert.doesNotMatch(JSON.stringify(catalog), /merchant@example\.com/);
});

test("public application config advertises export while chain writes stay disabled", async () => {
  process.env.CHAIN_MALL_SYNC_ENABLED = "false";
  const response = await configHandler(new Request(`${origin}/api/merchant-applications/config`));
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.applicationSchema, MERCHANT_APPLICATION_SCHEMA);
  assert.equal(body.catalogSchema, MERCHANT_CATALOG_SCHEMA);
  assert.equal(body.chainCatalog.exportReady, true);
  assert.equal(body.chainCatalog.syncEnabled, false);
  assert.equal(body.chainCatalog.writeMode, "disabled_until_adapter_configured");
});

test("chain sync is admin protected before any store access or write attempt", async () => {
  const response = await syncHandler(new Request(`${origin}/api/merchant-catalog/sync`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ applicationId })
  }));
  assert.equal(response.status, 401);
  assert.equal((await response.json()).error, "UNAUTHORIZED");
});

test("API documentation keeps the write adapter explicitly reserved", () => {
  const source = readFileSync(new URL("../MERCHANT_CATALOG_API.md", import.meta.url), "utf8");
  assert.match(source, /turing\.merchant-application\.v1/);
  assert.match(source, /turing\.chain-catalog\.v1/);
  assert.match(source, /CHAIN_MALL_SYNC_ENABLED=false/);
  assert.match(source, /CHAIN_MALL_ADAPTER_NOT_CONFIGURED/);
});
