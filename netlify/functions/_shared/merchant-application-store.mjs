import { getStore } from "@netlify/blobs";

const applications = () => getStore({ name: "turing-merchant-applications", consistency: "strong" });
const assets = () => getStore({ name: "turing-merchant-assets", consistency: "strong" });
const applicationKey = id => `application/${id}`;
const assetKey = (applicationId, assetId) => `asset/${applicationId}/${assetId}`;

async function listKeys(store, prefix) {
  const keys = [];
  for await (const page of store.list({ prefix, paginate: true })) {
    keys.push(...page.blobs.map(blob => blob.key));
  }
  return keys;
}

export async function createMerchantApplicationDraft(application) {
  const result = await applications().setJSON(applicationKey(application.id), application, { onlyIfNew: true });
  if (!result.modified) throw Object.assign(new Error("Merchant application ID collision"), { status: 409, code: "APPLICATION_CONFLICT" });
}

export async function getMerchantApplication(id, withMetadata = false) {
  const store = applications();
  return withMetadata
    ? store.getWithMetadata(applicationKey(id), { type: "json" })
    : store.get(applicationKey(id), { type: "json" });
}

export async function updateMerchantApplication(id, application, etag) {
  const result = await applications().setJSON(applicationKey(id), application, { onlyIfMatch: etag });
  if (!result.modified) throw Object.assign(new Error("Merchant application changed concurrently"), { status: 409, code: "APPLICATION_CONFLICT" });
  return result;
}

export async function listMerchantApplications(status = "", limit = 100) {
  const store = applications();
  const keys = await listKeys(store, "application/");
  const result = [];
  for (let offset = 0; offset < keys.length; offset += 20) {
    await Promise.all(keys.slice(offset, offset + 20).map(async key => {
      const application = await store.get(key, { type: "json" });
      if (application && (!status || application.status === status)) result.push(application);
    }));
  }
  return result
    .sort((a, b) => Date.parse(b.submittedAt || b.createdAt) - Date.parse(a.submittedAt || a.createdAt))
    .slice(0, limit);
}

export async function putMerchantAsset(applicationId, assetId, bytes, metadata) {
  const result = await assets().set(assetKey(applicationId, assetId), bytes, { metadata, onlyIfNew: true });
  if (!result.modified) {
    const existing = await assets().getMetadata(assetKey(applicationId, assetId));
    if (existing?.metadata?.sha256 === metadata.sha256) return { modified: false, existing: true };
    throw Object.assign(new Error("Merchant asset ID collision"), { status: 409, code: "ASSET_CONFLICT" });
  }
  return result;
}

export async function getMerchantAsset(applicationId, assetId) {
  return assets().getWithMetadata(assetKey(applicationId, assetId), { type: "arrayBuffer" });
}

export async function deleteMerchantAsset(applicationId, assetId) {
  await assets().delete(assetKey(applicationId, assetId));
}

