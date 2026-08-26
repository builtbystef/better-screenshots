import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function ensureCanvasShim(entry: string, shim: string): void {
  const expected = fs.realpathSync(shim);
  if (!fs.existsSync(entry)) {
    fs.symlinkSync(expected, entry, "dir");
    return;
  }

  const resolved = fs.realpathSync(entry);
  if (resolved !== expected) {
    throw new Error(`Canvas shim resolves to ${resolved}; expected ${expected}`);
  }
}

export default function setup(): void {
  const require = createRequire(import.meta.url);
  const jsdomDir = path.dirname(require.resolve("jsdom/package.json"));
  const entry = path.join(jsdomDir, "..", "canvas");
  const shim = path.resolve(fileURLToPath(new URL("./canvas-shim", import.meta.url)));
  ensureCanvasShim(entry, shim);
}
