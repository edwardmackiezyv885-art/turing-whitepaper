import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";

const dataSource = readFileSync(new URL("../data.js", import.meta.url), "utf8");
const styleSource = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
const indexSource = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const context = { window: {} };
vm.runInNewContext(dataSource, context);
const whitepaper = context.window.WHITEPAPER_DATA;

test("node referral example calculates ten 1,000 U nodes at 10 percent", () => {
  const zh = whitepaper.zh.pages.nodes.content;
  const en = whitepaper.en.pages.nodes.content;
  assert.match(zh, /邀请 10 个 1,000 U 节点/);
  assert.match(zh, /1,000 U 标称价值的邀请 NFT/);
  assert.match(zh, /节点邀请 NFT 标称奖励/);
  assert.match(en, /Refer ten 1,000 U nodes/);
  assert.match(en, /total stated value of 1,000 U/);
});

test("player referral example shows direct, indirect, and combined 30-day arithmetic", () => {
  const zh = whitepaper.zh.pages["player-referrals"].content;
  const en = whitepaper.en.pages["player-referrals"].content;
  assert.match(zh, /10 人/);
  assert.match(zh, /30 U \/ 天/);
  assert.match(zh, /30 天/);
  assert.match(zh, /7%/);
  assert.match(zh, /= 630 U/);
  assert.match(zh, /= 180 U/);
  assert.match(zh, /1,000 U \+ 630 U = 1,630 U/);
  assert.match(zh, /不是现金收益承诺/);
  assert.match(en, /= 630 U/);
  assert.match(en, /1,000 U \+ 630 U = 1,630 U/);
  assert.match(en, /not a cash-return promise/);
});

test("worked examples have responsive, theme-compatible presentation rules", () => {
  assert.match(styleSource, /\.reward-example-grid/);
  assert.match(styleSource, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(styleSource, /\.reward-example-total/);
  assert.match(styleSource, /@media \(max-width: 820px\)/);
  assert.match(styleSource, /\.reward-example-grid \{ grid-template-columns: 1fr; \}/);
  assert.match(indexSource, /20260730-merchant-catalog-api-v2/);
});
