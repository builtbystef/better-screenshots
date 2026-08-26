import { expect, test } from "vite-plus/test";
import { pngBlob } from "./helpers";

test("the test image bitmap polyfill exposes close", async () => {
  const bitmap = await createImageBitmap(pngBlob(2, 3));

  expect(bitmap.width).toBe(2);
  expect(bitmap.height).toBe(3);
  expect(() => bitmap.close()).not.toThrow();
});
