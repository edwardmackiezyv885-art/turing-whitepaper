import { copyFile } from "node:fs/promises";

for (const file of ["wallet-standard-bridge.js", "metamask-solana-connector.js", "okx-solana-connector.js"]) {
  await copyFile(`netlify-deploy/${file}`, file);
}
