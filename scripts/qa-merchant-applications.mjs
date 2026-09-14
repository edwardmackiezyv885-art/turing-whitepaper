import { readFile } from "node:fs/promises";
import { basename, extname, resolve } from "node:path";
import { randomUUID } from "node:crypto";

const origin = process.env.QA_ORIGIN || "http://127.0.0.1:8891";
const adminToken = process.env.ADMIN_TOKEN || "";
const storefrontPath = resolve(process.env.QA_STOREFRONT_IMAGE || "assets/nodes/thumbs/tnode-l1-explorer.webp");
const productPath = resolve(process.env.QA_PRODUCT_IMAGE || "assets/nodes/thumbs/tnode-l2-builder.webp");

if (!adminToken) throw new Error("ADMIN_TOKEN is required for merchant application QA");

async function request(path, options = {}) {
  const response = await fetch(new URL(path, origin), {
    ...options,
    headers: {
      Connection: "close",
      Accept: "application/json",
      ...(options.headers || {})
    }
  });
  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json") ? await response.json() : await response.arrayBuffer();
  return { response, body };
}

function expect(result, status, code = "") {
  if (result.response.status !== status || (code && result.body?.error !== code)) {
    throw new Error(`Expected ${status}${code ? ` ${code}` : ""}, received ${result.response.status}: ${JSON.stringify(result.body)}`);
  }
  return result.body;
}

async function upload(draft, kind, filePath, caption) {
  const bytes = await readFile(filePath);
  const extension = extname(filePath).toLowerCase();
  const mimeType = extension === ".png" ? "image/png" : extension === ".jpg" || extension === ".jpeg" ? "image/jpeg" : "image/webp";
  const assetId = randomUUID();
  const form = new FormData();
  form.set("applicationId", draft.applicationId);
  form.set("assetId", assetId);
  form.set("kind", kind);
  form.set("caption", caption);
  form.set("width", "400");
  form.set("height", "300");
  form.set("file", new Blob([bytes], { type: mimeType }), basename(filePath));
  const result = await request("/api/merchant-assets/upload", {
    method: "POST",
    headers: {
      Origin: origin,
      "X-Application-Token": draft.applicationToken
    },
    body: form
  });
  return expect(result, 201).asset;
}

const draft = expect(await request("/api/merchant-applications/draft", {
  method: "POST",
  headers: {
    Origin: origin,
    "Content-Type": "application/json"
  },
  body: "{}"
}), 201);

const storefrontAsset = await upload(draft, "storefront", storefrontPath, "QA 店面封面");
const productAsset = await upload(draft, "product", productPath, "QA 商品");

const applicationPayload = {
  applicationId: draft.applicationId,
  locale: "zh",
  sourcePage: "local-merchant-api-qa",
  businessName: "图灵商家接口 QA",
  entityType: "company",
  registrationRegion: "Metaverse",
  contactName: "QA",
  contactMethod: "qa@example.invalid",
  storeAddress: "图灵元宇宙城市 CBD",
  businessCategory: "QA",
  launchRegion: "turing-metaverse-city",
  businessIntro: "用于验证店面图片与后台同步，不用于公开展示。",
  productsServices: "接口测试商品。",
  playerOffer: "测试优惠。",
  gemPreference: "review",
  officialWebsite: "",
  assetLinks: "",
  authorizationConfirmed: true,
  termsAcknowledged: true,
  privacyAcknowledged: true,
  assetIds: [storefrontAsset.id, productAsset.id],
  products: [{
    id: productAsset.id,
    assetId: productAsset.id,
    name: "QA 商品",
    priceLabel: "68 CNY",
    description: "本地端到端测试商品"
  }]
};

const submitted = expect(await request("/api/merchant-applications/submit", {
  method: "POST",
  headers: {
    Origin: origin,
    "Content-Type": "application/json",
    "X-Application-Token": draft.applicationToken
  },
  body: JSON.stringify(applicationPayload)
}), 201).application;

const adminHeaders = { Authorization: `Bearer ${adminToken}` };
const listed = expect(await request("/api/merchant-applications/admin?status=submitted", {
  headers: adminHeaders
}), 200);
if (!listed.applications.some(application => application.id === draft.applicationId)) {
  throw new Error("Submitted application was not returned by the admin API");
}
if (listed.applications.some(application => "applicationTokenHash" in application)) {
  throw new Error("Admin API exposed an application token hash");
}

const assetResponse = await request(`/api/merchant-assets/file?applicationId=${draft.applicationId}&assetId=${storefrontAsset.id}`, {
  headers: adminHeaders
});
if (assetResponse.response.status !== 200 || assetResponse.body.byteLength < 100) {
  throw new Error("Admin asset API did not return the uploaded image");
}

expect(await request("/api/merchant-applications/admin", {
  method: "POST",
  headers: { ...adminHeaders, "Content-Type": "application/json" },
  body: JSON.stringify({ action: "set_status", applicationId: draft.applicationId, status: "approved", note: "Local QA approved" })
}), 200);
expect(await request("/api/merchant-applications/admin", {
  method: "POST",
  headers: { ...adminHeaders, "Content-Type": "application/json" },
  body: JSON.stringify({ action: "set_status", applicationId: draft.applicationId, status: "catalog_ready", note: "Local QA catalog ready" })
}), 200);

const catalog = expect(await request(`/api/merchant-catalog/export?applicationId=${draft.applicationId}`, {
  headers: adminHeaders
}), 200).catalog;
if (catalog.schema !== "turing.chain-catalog.v1" || catalog.products[0]?.image?.assetId !== productAsset.id) {
  throw new Error("Exported chain catalog does not match the submitted product");
}
if (JSON.stringify(catalog).includes("qa@example.invalid")) {
  throw new Error("Exported catalog contains private contact details");
}

const sync = expect(await request("/api/merchant-catalog/sync", {
  method: "POST",
  headers: { ...adminHeaders, "Content-Type": "application/json" },
  body: JSON.stringify({ applicationId: draft.applicationId })
}), 503, "CHAIN_MALL_SYNC_DISABLED");

console.log(JSON.stringify({
  ok: true,
  applicationId: draft.applicationId,
  uploadedAssets: 2,
  adminVisible: true,
  catalogSchema: catalog.schema,
  catalogProducts: catalog.products.length,
  privateContactExcluded: true,
  chainSync: sync.error
}, null, 2));

