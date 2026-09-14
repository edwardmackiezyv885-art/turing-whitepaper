import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { existsSync, readFileSync } from "node:fs";

const dataSource = readFileSync(new URL("../data.js", import.meta.url), "utf8");
const styleSource = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
const indexSource = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const context = { window: {} };
vm.runInNewContext(dataSource, context);

test("RWA chapter explains the merchant CBD proposition bilingually", () => {
  for (const lang of ["zh", "en"]) {
    const content = context.window.WHITEPAPER_DATA[lang].pages["economy-dashboard"].content;
    assert.match(content, /rwa-merchant-cbd-v1\.webp/);
    assert.match(content, /class="rwa-onboarding-flow"/);
    assert.match(content, /class="rwa-cycle-diagram"/);
    assert.equal((content.match(/class="rwa-onboarding-flow"[\s\S]*?<\/ol>/) || [""])[0].match(/<li>/g)?.length, 6);
    assert.equal((content.match(/class="rwa-cycle-diagram"[\s\S]*?<\/ol>/) || [""])[0].match(/<li>/g)?.length, 8);
  }

  const zh = context.window.WHITEPAPER_DATA.zh.pages["economy-dashboard"].content;
  const en = context.window.WHITEPAPER_DATA.en.pages["economy-dashboard"].content;
  assert.match(zh, /元宇宙 CBD/);
  assert.match(zh, /GEM 到店消费/);
  assert.match(zh, /商家专属折扣/);
  assert.match(zh, /广告费与数字店面服务费/);
  assert.match(zh, /回购并销毁 TUR/);
  assert.match(en, /metaverse CBD/i);
  assert.match(en, /GEM in-store spend/i);
  assert.match(en, /buy back and burn TUR/i);
});

test("RWA chapter discloses compliance boundaries and public accounting", () => {
  const zh = context.window.WHITEPAPER_DATA.zh.pages["economy-dashboard"].content;
  const en = context.window.WHITEPAPER_DATA.en.pages["economy-dashboard"].content;
  assert.match(zh, /不承诺流量、收益或资产回报/);
  assert.match(zh, /不得虚抬原价/);
  assert.match(zh, /交易记录、回购数量、销毁地址和完成时间/);
  assert.match(zh, /不自动等同于法律意义上的股票、产权/);
  assert.match(en, /no traffic, revenue, or investment-return guarantee/i);
  assert.match(en, /not automatically legal shares, title, ownership, a tradable right/i);
});

test("RWA visuals, data hooks, responsive styles, and cache version are present", () => {
  for (const asset of [
    "../assets/images/rwa-merchant-cbd-v1.png",
    "../assets/images/rwa-merchant-cbd-v1.webp",
    "../assets/images/rwa-merchant-cbd-v1.jpg",
    "../assets/images/rwa-merchant-cbd-v1-800.webp"
  ]) {
    assert.ok(existsSync(new URL(asset, import.meta.url)), `${asset} should exist`);
  }
  assert.match(styleSource, /\.rwa-priority-banner/);
  assert.match(styleSource, /\.rwa-cycle-diagram/);
  assert.match(styleSource, /\.rwa-onboarding-flow/);
  assert.match(styleSource, /@media \(max-width: 820px\)/);
  assert.match(dataSource, /data-metric="rwaMerchantsLive"/);
  assert.match(indexSource, /20260730-merchant-catalog-api-v2/);
});
