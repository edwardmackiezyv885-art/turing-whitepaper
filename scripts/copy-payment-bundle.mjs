import { copyFile } from "node:fs/promises";

await copyFile("netlify-deploy/usdt-payment-adapter.js", "usdt-payment-adapter.js");
