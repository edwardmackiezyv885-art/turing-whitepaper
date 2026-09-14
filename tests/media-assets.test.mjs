import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

const dataSource = readFileSync(new URL("../data.js", import.meta.url), "utf8");
const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const fishingVideo = readFileSync(new URL("../assets/media/fishing-catch.mp4", import.meta.url));
const gameplayVideos = [
  ["battle", "battle-riders.mp4", readFileSync(new URL("../assets/media/battle-riders.mp4", import.meta.url))],
  ["mining", "mining-crystal-cave.mp4", readFileSync(new URL("../assets/media/mining-crystal-cave.mp4", import.meta.url))],
  ["adventure", "adventure-journey.mp4", readFileSync(new URL("../assets/media/adventure-journey.mp4", import.meta.url))],
  ["building", "building-blueprint.mp4", readFileSync(new URL("../assets/media/building-blueprint.mp4", import.meta.url))]
];

test("fishing video markup allows user-initiated audio in both languages", () => {
  const tags = [...dataSource.matchAll(/<video[^>]*>\s*<source src="\.\/assets\/media\/fishing-catch\.mp4"[^>]*>/g)]
    .map(match => match[0]);
  assert.equal(tags.length, 2);
  for (const tag of tags) {
    assert.match(tag, /\bcontrols\b/);
    assert.match(tag, /\bplaysinline\b/);
    assert.doesNotMatch(tag, /\bmuted\b/);
    assert.doesNotMatch(tag, /\bautoplay\b/);
  }
});

test("published fishing MP4 contains H.264 video and AAC audio tracks", () => {
  const atoms = fishingVideo.toString("latin1");
  assert.match(atoms, /vide/);
  assert.match(atoms, /avc1/);
  assert.match(atoms, /soun/);
  assert.match(atoms, /mp4a/);
});

test("battle, mining, adventure, and building videos replace their hero images in both languages", () => {
  for (const [, fileName] of gameplayVideos) {
    const escaped = fileName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const heroVideoRefs = [...dataSource.matchAll(new RegExp(`heroVideo: "\\.\\/assets\\/media\\/${escaped}"`, "g"))];
    assert.equal(heroVideoRefs.length, 2, `${fileName} should be referenced once per language`);
    assert.equal([...dataSource.matchAll(new RegExp(`<source src="\\.\\/assets\\/media\\/${escaped}"`, "g"))].length, 0);
  }
  assert.match(appSource, /<video class="hero-video" controls muted loop playsinline preload="metadata"/);
  assert.match(appSource, /data-autoplay-media/);
  assert.match(appSource, /prefers-reduced-motion: reduce/);
  assert.match(appSource, /video\.autoplay = true/);
  assert.match(appSource, /video\.play\(\)\.catch/);
});

test("mining and battle source videos are mapped to their intended gameplay pages", () => {
  const sha256 = video => createHash("sha256").update(video).digest("hex").toUpperCase();
  const battleVideo = gameplayVideos.find(([slug]) => slug === "battle")[2];
  const miningVideo = gameplayVideos.find(([slug]) => slug === "mining")[2];
  assert.equal(sha256(miningVideo), "DD49CD10CBD6E8041C1D06246D48A61969F075C3A476FB99515E346461BC4B35");
  assert.equal(sha256(battleVideo), "CA762306ED58606F144EADFF61C6F43D3E27F3E0CE3B1F316F5CA604F51077E3");
});

test("published gameplay MP4s contain browser-compatible H.264 video and AAC audio tracks", () => {
  for (const [slug, fileName, video] of gameplayVideos) {
    const atoms = video.toString("latin1");
    assert.match(atoms, /vide/, `${slug} video track missing in ${fileName}`);
    assert.match(atoms, /avc1/, `${slug} H.264 track missing in ${fileName}`);
    assert.match(atoms, /soun/, `${slug} audio track missing in ${fileName}`);
    assert.match(atoms, /mp4a/, `${slug} AAC track missing in ${fileName}`);
    assert.ok(atoms.indexOf("moov") < atoms.indexOf("mdat"), `${slug} should be fast-start optimized`);
  }
});
