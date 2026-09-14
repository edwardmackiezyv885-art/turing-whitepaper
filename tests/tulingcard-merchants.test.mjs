import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";

const dataSource = readFileSync(new URL("../data.js", import.meta.url), "utf8");
const styleSource = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
const indexSource = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const context = { window: {} };
vm.runInNewContext(dataSource, context);

test("TulingCard explains the merchant acquisition proposition bilingually", () => {
  for (const lang of ["zh", "en"]) {
    const page = context.window.WHITEPAPER_DATA[lang].pages["card-reality"];
    assert.ok(page.deck.length > 50);
    assert.ok(page.content.length > 6000);
    assert.equal((page.content.match(/class="merchant-benefit-grid"[\s\S]*?<\/div>/) || [""])[0].match(/<article/g)?.length, 3);
    assert.equal((page.content.match(/class="protocol-rail merchant-acquisition-flow"[\s\S]*?<\/ol>/) || [""])[0].match(/<li/g)?.length, 8);
    assert.equal((page.content.match(/class="card-index"/g) || []).length, 6);
    assert.equal((page.content.match(/class="merchant-scenario-steps"[\s\S]*?<\/ol>/) || [""])[0].match(/<li/g)?.length, 5);
  }
});

test("Chinese copy emphasizes foot traffic, exclusive benefits, attribution, and shared value", () => {
  const content = context.window.WHITEPAPER_DATA.zh.pages["card-reality"].content;
  assert.match(content, /转化为实体商家的真实客流/);
  assert.match(content, /获得新增客流和复购机会/);
  assert.match(content, /元宇宙 CBD 展示/);
  assert.match(content, /TulingCard 专属权益/);
  assert.match(content, /到店 GEM 消费/);
  assert.match(content, /去重到店、订单、优惠和退款状态/);
  assert.match(content, /真实收入 \/ TUR 回购销毁 \/ 内容再投入/);
  assert.match(content, /玩家、商家与平台的三方共赢/);
});

test("merchant chapter sets measurement, privacy, and no-guarantee boundaries", () => {
  const zh = context.window.WHITEPAPER_DATA.zh.pages["card-reality"].content;
  const en = context.window.WHITEPAPER_DATA.en.pages["card-reality"].content;
  assert.match(zh, /聚合数据/);
  assert.match(zh, /不会直接获得玩家的钱包余额/);
  assert.match(zh, /不向商家承诺固定曝光、到店人数、销售额或投资回报/);
  assert.match(zh, /不得先涨价后打折/);
  assert.match(en, /measurable foot traffic/i);
  assert.match(en, /aggregated data by default/i);
  assert.match(en, /does not guarantee impressions, visits, sales/i);
});

test("merchant acquisition visuals are responsive and use the new cache key", () => {
  for (const selector of [
    ".merchant-link-banner",
    ".merchant-benefit-grid",
    ".merchant-acquisition-flow",
    ".merchant-scenario-card",
    ".merchant-cycle-statement"
  ]) {
    assert.match(styleSource, new RegExp(selector.replace(".", "\\.")));
  }
  assert.match(styleSource, /@media \(max-width: 820px\)[\s\S]*?\.merchant-scenario-steps/);
  assert.match(styleSource, /@media \(max-width: 560px\)[\s\S]*?\.merchant-scenario-result/);
  assert.match(indexSource, /20260730-merchant-catalog-api-v2/);
});
