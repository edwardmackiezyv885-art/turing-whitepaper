import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";

const dataSource = readFileSync(new URL("../data.js", import.meta.url), "utf8");
const styleSource = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
const indexSource = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const context = { window: {} };
vm.runInNewContext(dataSource, context);

test("roadmap separates completed milestones from three future targets", () => {
  for (const lang of ["zh", "en"]) {
    const content = context.window.WHITEPAPER_DATA[lang].pages.roadmap.content;
    assert.equal((content.match(/class="roadmap-item is-complete"/g) || []).length, 8);
    assert.equal((content.match(/class="roadmap-item is-target"/g) || []).length, 3);
    assert.match(content, /2026 Q3/);
    assert.match(content, /2026 Q4/);
    assert.match(content, /2027 Q1/);
    assert.doesNotMatch(content, /2027 Q2|2027 H2/);
  }
});

test("new targets cover public Beta, chain and DeFi, and a non-price 30+ governance goal", () => {
  const zh = context.window.WHITEPAPER_DATA.zh.pages.roadmap.content;
  const en = context.window.WHITEPAPER_DATA.en.pages.roadmap.content;
  assert.match(zh, /完成公开 Beta/);
  assert.match(zh, /公链开发与生态建设/);
  assert.match(zh, /借贷等 DeFi 活动/);
  assert.match(zh, /治理代币生态达到 30\+/);
  assert.match(zh, /不代表代币价格、回报、升值或流动性承诺/);
  assert.match(en, /Complete public Beta/);
  assert.match(en, /Chain development and ecosystem/);
  assert.match(en, /Governance-token ecosystem reaches 30\+/);
});

test("roadmap status styling and release cache-buster are present", () => {
  assert.match(styleSource, /\.roadmap-status\.completed/);
  assert.match(styleSource, /\.roadmap-status\.target/);
  assert.match(styleSource, /\.roadmap-completed \.roadmap-item::before/);
  assert.match(indexSource, /styles\.css\?v=\d{8}-[a-z-]+/);
});
