import { rm } from "node:fs/promises";

await rm("world-bundle", { recursive: true, force: true });
await rm("world-runtime.js", { force: true });
