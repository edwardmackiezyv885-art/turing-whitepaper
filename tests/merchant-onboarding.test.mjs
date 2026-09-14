import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";

const dataSource = readFileSync(new URL("../data.js", import.meta.url), "utf8");
const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const styleSource = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
const indexSource = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const paymentSource = readFileSync(new URL("../merchant-payment.js", import.meta.url), "utf8");
const paymentConfigSource = readFileSync(new URL("../merchant-payment-config.js", import.meta.url), "utf8");
const applicationConfigSource = readFileSync(new URL("../merchant-application-config.js", import.meta.url), "utf8");
const assetSource = readFileSync(new URL("../merchant-assets.js", import.meta.url), "utf8");
const adminHtmlSource = readFileSync(new URL("../admin-merchant-applications.html", import.meta.url), "utf8");
const adminSource = readFileSync(new URL("../admin-merchant-applications.js", import.meta.url), "utf8");
const context = { window: {} };
vm.runInNewContext(dataSource, context);

test("merchant onboarding is a bilingual top-level sidebar destination", () => {
  for (const lang of ["zh", "en"]) {
    const navigation = context.window.WHITEPAPER_DATA[lang].navigation;
    const slugs = navigation.map(item => item.slug);
    assert.ok(slugs.includes("merchant-onboarding"));
    assert.equal(slugs.indexOf("merchant-onboarding"), slugs.indexOf("card-reality") + 1);

    const page = context.window.WHITEPAPER_DATA[lang].pages["merchant-onboarding"];
    assert.ok(page.title.length > 6);
    assert.ok(page.deck.length > 40);
    assert.match(page.hero, /rwa-merchant-cbd-v1\.webp/);
    assert.ok(page.content.length > 6500);
  }
});

test("merchant page explains value, materials, service scope, and live activation state", () => {
  for (const lang of ["zh", "en"]) {
    const content = context.window.WHITEPAPER_DATA[lang].pages["merchant-onboarding"].content;
    assert.equal((content.match(/class="merchant-activation-grid"[\s\S]*?<div class="callout warning"/) || [""])[0].match(/<article/g)?.length, 3);
    assert.equal((content.match(/class="merchant-material-grid"[\s\S]*?<\/div>/) || [""])[0].match(/<article>/g)?.length, 4);
    assert.equal((content.match(/class="merchant-onboarding-value-grid"[\s\S]*?<\/div>/) || [""])[0].match(/<article>/g)?.length, 4);
    assert.match(content, /merchant-onboarding-form/);
    assert.match(content, /merchant-service-fee-mount/);
    assert.match(content, /name="application_id"/);
    assert.match(content, /name="business_intro"/);
    assert.match(content, /name="products_services"/);
    assert.match(content, /name="player_offer"/);
    assert.match(content, /name="asset_links"/);
    assert.match(content, /name="authorization_confirmed"/);
    assert.match(content, /name="privacy_acknowledged"/);
  }
});

test("merchant copy is a fixed Mainnet commercial service fee with no financial or token promise", () => {
  const zh = context.window.WHITEPAPER_DATA.zh.pages["merchant-onboarding"].content;
  const en = context.window.WHITEPAPER_DATA.en.pages["merchant-onboarding"].content;

  assert.match(zh, /299 USDT/);
  assert.match(zh, /约人民币 10,000 元/);
  assert.match(zh, /Solana 主网/);
  assert.match(zh, /一次性商业服务费/);
  assert.match(zh, /不产生收益、本金返还、NFT 或 TUR 兑付/);
  assert.match(en, /299 USDT/);
  assert.match(en, /approximately CNY 10,000/);
  assert.match(en, /Solana Mainnet/);
  assert.match(en, /One-time commercial service fee/);
  assert.match(en, /no yield, principal redemption, NFT, or TUR settlement/i);

  assert.doesNotMatch(zh, /10%–15%|固定月化|Merchant NFT|NFT → TUR|merchant-return-boundary|merchant-formula/);
  assert.doesNotMatch(en, /10%–15%|fixed monthly|Merchant NFT|NFT → TUR|merchant-return-boundary|merchant-formula/i);
  assert.doesNotMatch(zh, /监管参考|中国人民银行银发|国家行政法规库|merchant-compliance/);
  assert.doesNotMatch(en, /Regulatory reference|PBOC 2021 notice|National Laws and Regulations Database|merchant-compliance/);
});

test("launch region is restricted to the Turing metaverse city", () => {
  const zh = context.window.WHITEPAPER_DATA.zh.pages["merchant-onboarding"].content;
  const en = context.window.WHITEPAPER_DATA.en.pages["merchant-onboarding"].content;
  assert.match(zh, /<select name="launch_region" required><option value="turing-metaverse-city" selected>图灵元宇宙城市 · CBD 商业区<\/option><\/select>/);
  assert.match(en, /<select name="launch_region" required><option value="turing-metaverse-city" selected>Turing Metaverse City · CBD District<\/option><\/select>/);
  assert.doesNotMatch(zh, /元宇宙城市 \/ 现实城市/);
  assert.doesNotMatch(en, /Metaverse city \/ physical city/);
});

test("Netlify application and payment-receipt forms are registered", () => {
  assert.match(indexSource, /<form name="merchant-onboarding"[\s\S]*?data-netlify="true"/);
  assert.match(indexSource, /<form name="merchant-payment-receipt"[\s\S]*?data-netlify="true"/);
  for (const field of [
    "business_name",
    "contact_method",
    "business_intro",
    "products_services",
    "player_offer",
    "authorization_confirmed",
    "terms_acknowledged",
    "privacy_acknowledged",
    "submitted_at",
    "application_id",
    "store_asset_ids",
    "product_asset_ids",
    "catalog_schema"
  ]) {
    assert.match(indexSource, new RegExp(`name="${field}"`));
  }
  for (const field of [
    "order_id",
    "payer_wallet",
    "amount_usdt",
    "network",
    "usdt_mint",
    "transaction_signature",
    "paid_at"
  ]) {
    assert.match(indexSource, new RegExp(`name="${field}"`));
  }
});

test("application submission unlocks checkout with a durable application ID", () => {
  assert.match(appSource, /function enhanceMerchantOnboarding/);
  assert.match(appSource, /TURING_MERCHANT_ASSETS\.prepareSubmission/);
  assert.match(appSource, /X-Application-Token/);
  assert.match(appSource, /merchant-applications\/submit|TURING_MERCHANT_APPLICATION_CONFIG\.api\.submit/);
  assert.match(appSource, /archiveData\.set\("application_id", applicationId\)/);
  assert.match(appSource, /archiveData\.set\("store_asset_ids"/);
  assert.match(appSource, /archiveData\.set\("product_asset_ids"/);
  assert.match(appSource, /turing-merchant-application-submitted/);
  assert.match(appSource, /299 USDT Mainnet service-fee order is unlocked below/);
  assert.match(appSource, /TURING_MERCHANT_PAYMENT\?\.enhance/);
});

test("merchant application supports storefront and structured product image uploads", () => {
  for (const lang of ["zh", "en"]) {
    const content = context.window.WHITEPAPER_DATA[lang].pages["merchant-onboarding"].content;
    assert.match(content, /data-merchant-file-input="storefront"/);
    assert.match(content, /data-merchant-file-input="product"/);
    assert.match(content, /data-merchant-asset-preview="storefront"/);
    assert.match(content, /data-merchant-asset-preview="product"/);
    assert.match(content, /turing\.chain-catalog\.v1/);
  }
  assert.match(applicationConfigSource, /maxInputBytes:\s*12 \* 1024 \* 1024/);
  assert.match(applicationConfigSource, /maxUploadedBytes:\s*4 \* 1024 \* 1024/);
  assert.match(applicationConfigSource, /storefront:\s*6,\s*product:\s*12/);
  assert.match(assetSource, /canvas\.toBlob/);
  assert.match(assetSource, /payload\.set\("kind", kind\)/);
  assert.match(assetSource, /productName/);
  assert.match(assetSource, /priceLabel/);
});

test("merchant review backend exposes private assets and a reserved marketplace export", () => {
  assert.match(adminHtmlSource, /noindex,nofollow,noarchive/);
  assert.match(adminHtmlSource, /merchant-admin-applications/);
  assert.match(adminSource, /config\.api\.asset/);
  assert.match(adminSource, /config\.api\.catalogExport/);
  assert.match(adminSource, /同步链上商城（预留）/);
  assert.match(adminSource, /IntersectionObserver/);
  assert.match(adminSource, /Authorization:\s*`Bearer \$\{adminToken\}`/);
  assert.doesNotMatch(adminSource, /applicationTokenHash/);
});

test("merchant checkout uses exact Mainnet configuration and records verified payment receipts", () => {
  assert.match(paymentConfigSource, /network:\s*"mainnet-beta"/);
  assert.match(paymentConfigSource, /amountUsdt:\s*"1400"/);
  assert.match(paymentSource, /amountBaseUnits !==/);
  assert.match(paymentConfigSource, /Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/);
  assert.match(paymentConfigSource, /DDeDE8pBjqDwQazgCwPMNuJGePjckgcWTn6wMtmcLXNg/);
  assert.match(paymentSource, /merchant-payment-receipt/);
  assert.match(paymentConfigSource, /COMMERCIAL_SERVICE_FEE_NO_YIELD_NO_PRINCIPAL_REDEMPTION_NO_NFT_NO_TUR/);
  assert.match(paymentSource, /result\.settlementNotice !== config\.settlementNotice/);
  assert.match(paymentSource, /applicationId/);
  assert.match(paymentSource, /applicationToken/);
  assert.match(paymentSource, /paymentSignature/);
  assert.match(paymentSource, /explorer\.solana\.com/);
  assert.doesNotMatch(paymentSource, /mintNft|redeemTur|nftMint|turAmount/);
});

test("merchant application UI is responsive, accessible, and released with a fresh cache key", () => {
  for (const selector of [
    ".merchant-status-banner",
    ".merchant-plan-grid",
    ".merchant-activation-grid",
    ".merchant-onboarding-form",
    ".merchant-confirmations",
    ".merchant-uploader",
    ".merchant-upload-drop",
    ".merchant-asset-preview",
    ".merchant-asset-field",
    ".merchant-catalog-reservation",
    ".merchant-form-status",
    ".merchant-service-fee-section",
    ".merchant-wallet-picker",
    ".merchant-payment-message"
  ]) {
    assert.match(styleSource, new RegExp(selector.replace(".", "\\.")));
  }
  assert.match(styleSource, /\.merchant-form-grid input,[\s\S]*?min-height: 46px/);
  assert.match(styleSource, /min-height: 44px/);
  assert.match(styleSource, /:focus-visible/);
  assert.match(styleSource, /@media \(max-width: 560px\)[\s\S]*?\.merchant-service-fee-section/);
  assert.match(styleSource, /@media \(max-width: 560px\)[\s\S]*?font-size: 16px/);
  assert.match(indexSource, /20260730-merchant-catalog-api-v2/);
  assert.match(indexSource, /merchant-payment-config\.js/);
  assert.match(indexSource, /merchant-payment\.js/);
  assert.match(indexSource, /merchant-application-config\.js/);
  assert.match(indexSource, /merchant-assets\.js/);
});
