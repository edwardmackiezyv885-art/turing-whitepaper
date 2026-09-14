import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";

const dataSource = readFileSync(new URL("../data.js", import.meta.url), "utf8");
const styleSource = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
const indexSource = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const context = { window: {} };
vm.runInNewContext(dataSource, context);

test("metaverse navigation exposes three bilingual chapters", () => {
  for (const lang of ["zh", "en"]) {
    const site = context.window.WHITEPAPER_DATA[lang];
    const group = site.navigation.find((item) => item.slug === "metaverse");
    assert.ok(group, "metaverse navigation group should exist");
    assert.deepEqual(Array.from(group.children, (item) => item.slug), ["onchain-identity", "interoperability"]);
    for (const slug of ["metaverse", "onchain-identity", "interoperability"]) {
      assert.ok(site.pages[slug]?.title);
      assert.ok(site.pages[slug]?.deck);
      assert.ok(site.pages[slug]?.content.length > 2000, `${lang}/${slug} should be detailed`);
    }
  }
});

test("metaverse chapter connects spaces, gameplay, RWA, economy, and governance", () => {
  const zh = context.window.WHITEPAPER_DATA.zh.pages.metaverse.content;
  const en = context.window.WHITEPAPER_DATA.en.pages.metaverse.content;
  assert.equal((zh.match(/<article data-layer="0[1-5]">/g) || []).length, 5);
  assert.equal((zh.match(/id="space-types"[\s\S]*?<\/section>/) || [""])[0].match(/class="feature-card"/g)?.length, 6);
  assert.match(zh, /RWA 商业区/);
  assert.match(zh, /TUR \/ GEM \/ DAO/);
  assert.match(zh, /不等同于现实房地产所有权/);
  assert.match(en, /persistent social layer/i);
  assert.match(en, /not physical real-estate ownership/i);
});

test("identity chapter keeps sensitive data off-chain and defines contribution proof", () => {
  const zh = context.window.WHITEPAPER_DATA.zh.pages["onchain-identity"].content;
  const en = context.window.WHITEPAPER_DATA.en.pages["onchain-identity"].content;
  assert.equal((zh.match(/class="identity-map"[\s\S]*?<\/div>/) || [""])[0].match(/<article/g)?.length, 5);
  assert.match(zh, /不会把真实身份、私人聊天、完整行为轨迹或每一次游戏操作公开上链/);
  assert.match(zh, /假名化、最小披露、用途限定和可撤销/);
  assert.match(zh, /声誉凭证原则上不可转让/);
  assert.match(en, /without publishing legal identity, private chat/i);
  assert.match(en, /correction, revocation, and appeal/i);
  assert.match(zh, /w3\.org\/TR\/did-core/);
  assert.match(zh, /w3\.org\/TR\/vc-data-model/);
});

test("interoperability chapter defines portability, creator publishing, and bridge safeguards", () => {
  const zh = context.window.WHITEPAPER_DATA.zh.pages.interoperability.content;
  const en = context.window.WHITEPAPER_DATA.en.pages.interoperability.content;
  assert.equal((zh.match(/<article data-layer="(?:FORMAT|SCHEMA|RIGHTS|GAME|SAFE)">/g) || []).length, 5);
  assert.match(zh, /可携带，不等于在所有世界中无条件可用/);
  assert.match(zh, /权威登记优先、适配器优先、桥接最后/);
  assert.match(zh, /总量、单笔、速率、暂停与延迟提现/);
  assert.match(zh, /khronos\.org\/gltf/);
  assert.match(en, /Open standards do not guarantee universal compatibility/i);
  assert.match(en, /canonical registry first, adapters first, bridges last/i);
});

test("metaverse visual components are responsive and released with a new cache key", () => {
  for (const selector of [
    ".world-layer-stack",
    ".identity-map",
    ".interop-stack",
    ".protocol-rail",
    ".standards-grid"
  ]) {
    assert.match(styleSource, new RegExp(selector.replace(".", "\\.")));
  }
  assert.match(styleSource, /@media \(max-width: 820px\)[\s\S]*?\.protocol-rail/);
  assert.match(styleSource, /@media \(max-width: 560px\)[\s\S]*?\.standards-grid/);
  assert.match(indexSource, /20260730-merchant-catalog-api-v2/);
});
