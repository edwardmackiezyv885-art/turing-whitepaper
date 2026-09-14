import { copyFile, rm } from "node:fs/promises";

await rm("netlify-deploy/world-bundle", { recursive: true, force: true });
await copyFile("world-runtime.js", "netlify-deploy/world-runtime.js");
