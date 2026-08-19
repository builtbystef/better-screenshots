import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

export default function setup(): void {
  const require = createRequire(import.meta.url);
  const jsdomDir = path.dirname(require.resolve("jsdom/package.json"));
  const dest = path.join(jsdomDir, "..", "canvas");
  const src = path.resolve(fileURLToPath(new URL("./canvas-shim", import.meta.url)));
  if (fs.existsSync(dest)) {
    return;
  }
  fs.symlinkSync(src, dest, "dir");
}
