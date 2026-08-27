import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

export default function setup(): void {
  const require = createRequire(import.meta.url);
  const jsdomDir = path.dirname(require.resolve("jsdom/package.json"));
  const entry = path.join(jsdomDir, "..", "canvas");
  const shim = fs.realpathSync(
    path.resolve(fileURLToPath(new URL("./canvas-shim", import.meta.url))),
  );

  if (!fs.existsSync(entry)) {
    fs.symlinkSync(shim, entry, "dir");
    return;
  }

  const resolved = fs.realpathSync(entry);
  if (resolved !== shim) {
    throw new Error(`Canvas shim resolves to ${resolved}; expected ${shim}`);
  }
}
