import { cp, copyFile, mkdir, rm } from "node:fs/promises";

const publish = "netlify-deploy";
const files = [
  "index.html",
  "styles.css",
  "app.js",
  "data.js",
  "merchant-application-config.js",
  "merchant-assets.js",
  "merchant-payment-config.js",
  "merchant-payment.js",
  "node-config.js",
  "node-purchase.js",
  "wallet-standard-bridge.js",
  "metamask-solana-connector.js",
  "okx-solana-connector.js",
  "usdt-payment-adapter.js",
  "admin-node-orders.html",
  "admin-node-orders.js",
  "admin-merchant-applications.html",
  "admin-merchant-applications.js",
  "world-3d.html",
  "world-3d.css",
  "world-boot.js",
  "_headers"
];

await rm(publish, { recursive: true, force: true });
await mkdir(publish, { recursive: true });
for (const file of files) {
  try { await copyFile(file, `${publish}/${file}`); }
  catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
await cp("assets", `${publish}/assets`, { recursive: true, force: true });
