import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { existsSync, readFileSync, statSync } from "node:fs";

const dataSource = readFileSync(new URL("../data.js", import.meta.url), "utf8");
const styleSource = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
const indexSource = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const context = { window: {} };
vm.runInNewContext(dataSource, context);

const assets = [
  "../assets/images/tulingcard-merchant-metaverse-city-v1.png",
  "../assets/images/rwa-physical-digital-twin-v1.png",
  "../assets/images/rwa-gem-merchant-redemption-v1.png",
  "../assets/images/rwa-compliant-assets-registry-v1.png"
];

test("TulingCard and RWA visual assets are present and non-placeholder", () => {
  for (const asset of assets) {
    const url = new URL(asset, import.meta.url);
    assert.ok(existsSync(url), `${asset} should exist`);
    assert.ok(statSync(url).size > 1_000_000, `${asset} should be a full-resolution image`);
  }
});

test("TulingCard uses the supplied merchant-city image in both languages", () => {
  for (const lang of ["zh", "en"]) {
    const content = context.window.WHITEPAPER_DATA[lang].pages["card-reality"].content;
    assert.match(content, /tulingcard-merchant-metaverse-city-v1\.png/);
    assert.match(content, /class="content-figure tulingcard-city-figure"/);
    assert.match(content, /width="1024" height="1536"/);
    assert.match(content, /loading="lazy" decoding="async"/);
  }
});

test("RWA chapter places three generated figures at matching concepts bilingually", () => {
  const names = [
    "rwa-physical-digital-twin-v1.png",
    "rwa-gem-merchant-redemption-v1.png",
    "rwa-compliant-assets-registry-v1.png"
  ];

  for (const lang of ["zh", "en"]) {
    const content = context.window.WHITEPAPER_DATA[lang].pages["economy-dashboard"].content;
    assert.equal((content.match(/class="content-figure rwa-generated-figure"/g) || []).length, 3);
    for (const name of names) assert.ok(content.includes(name));
    assert.ok((content.match(/width="1672" height="941"/g) || []).length >= 3);
    assert.equal((content.match(/loading="lazy" decoding="async"/g) || []).length >= 3, true);
  }
});

test("new figures have responsive presentation and a fresh cache key", () => {
  assert.match(styleSource, /\.tulingcard-city-figure[\s\S]*?max-width: 620px/);
  assert.match(styleSource, /\.tulingcard-city-figure img[\s\S]*?aspect-ratio: auto/);
  assert.match(styleSource, /\.rwa-generated-figure img[\s\S]*?aspect-ratio: 16 \/ 9/);
  assert.match(styleSource, /@media \(max-width: 560px\)[\s\S]*?\.rwa-generated-figure/);
  assert.match(indexSource, /20260730-merchant-catalog-api-v2/);
});
