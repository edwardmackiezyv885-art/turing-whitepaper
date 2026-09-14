import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";

const dataSource = readFileSync(new URL("../data.js", import.meta.url), "utf8");
const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const styleSource = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
const indexSource = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const headerSource = readFileSync(new URL("../_headers", import.meta.url), "utf8");
const dashboardData = JSON.parse(readFileSync(new URL("../assets/data/economy-dashboard.json", import.meta.url), "utf8"));

const context = { window: {} };
vm.runInNewContext(dataSource, context);
const whitepaper = context.window.WHITEPAPER_DATA;

test("economy data and RWA page is linked in navigation and available bilingually", () => {
  const economyNav = whitepaper.zh.navigation.find(item => item.slug === "economy");
  assert.deepEqual(Array.from(economyNav.children, item => item.slug), ["economy-dashboard", "tokenomics"]);
  for (const lang of ["zh", "en"]) {
    const page = whitepaper[lang].pages["economy-dashboard"];
    assert.ok(page);
    assert.match(page.content, /data-economy-dashboard/);
    assert.match(page.content, /id="economy-cycle"/);
    assert.match(page.content, /id="rwa"/);
  }
});

test("dashboard exposes all requested metrics without fabricated launch values", () => {
  const requiredMetrics = [
    "turBurnedToday",
    "gemIssuedToday",
    "gemBurnedToday",
    "turBurnedTotal",
    "gemCirculating",
    "registeredPlayersTotal",
    "rwaMerchantsLive",
    "rwaGemOrdersToday",
    "rwaDiscountRedemptionsToday",
    "rwaTurBurnedTotal"
  ];
  assert.equal(dashboardData.status, "prelaunch");
  assert.equal(dashboardData.timezone, "Asia/Shanghai");
  assert.equal(dashboardData.asOf, null);
  for (const metric of requiredMetrics) {
    assert.ok(Object.hasOwn(dashboardData.metrics, metric));
    assert.equal(dashboardData.metrics[metric], null);
    assert.match(dataSource, new RegExp(`data-metric="${metric}"`));
  }
});

test("removed player and spending cards are absent from the dashboard", () => {
  for (const lang of ["zh", "en"]) {
    const content = whitepaper[lang].pages["economy-dashboard"].content;
    assert.doesNotMatch(content, /data-metric="newPlayersToday"/);
    assert.doesNotMatch(content, /data-metric="activePlayersToday"/);
    assert.doesNotMatch(content, /data-metric="gameSpendToday"/);
    assert.doesNotMatch(content, /dashboard-note/);
  }
  assert.equal(Object.hasOwn(dashboardData.metrics, "newPlayersToday"), false);
  assert.equal(Object.hasOwn(dashboardData.metrics, "activePlayersToday"), false);
  assert.equal(Object.hasOwn(dashboardData.metrics, "gameSpendToday"), false);
});

test("dashboard fetches fresh data and has responsive UI rules", () => {
  assert.match(appSource, /fetch\("\.\/assets\/data\/economy-dashboard\.json", \{ cache: "no-store" \}\)/);
  assert.match(appSource, /hydrateEconomyDashboard\(lang, slug\)/);
  assert.match(appSource, /Asia\/Shanghai/);
  assert.match(styleSource, /\.economy-metric-grid/);
  assert.match(styleSource, /\.economy-cycle/);
  assert.match(styleSource, /@media \(max-width: 560px\)/);
  assert.match(headerSource, /\/assets\/data\/economy-dashboard\.json\s+Cache-Control: no-cache, no-store, must-revalidate/);
  assert.match(indexSource, /styles\.css\?v=\d{8}-[a-z-]+/);
});
