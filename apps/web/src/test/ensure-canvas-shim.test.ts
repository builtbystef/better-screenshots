import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, test } from "vite-plus/test";
import { ensureCanvasShim } from "./ensure-canvas-shim";

test("an existing canvas entry fails when it resolves outside the shim", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "canvas-shim-"));
  const shim = path.join(root, "shim");
  const other = path.join(root, "other");
  const entry = path.join(root, "canvas");
  fs.mkdirSync(shim);
  fs.mkdirSync(other);
  fs.symlinkSync(other, entry, "dir");

  try {
    expect(() => ensureCanvasShim(entry, shim)).toThrow(
      `Canvas shim resolves to ${other}; expected ${shim}`,
    );
  } finally {
    fs.rmSync(root, { force: true, recursive: true });
  }
});
