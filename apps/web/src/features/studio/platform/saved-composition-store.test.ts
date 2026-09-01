// @vitest-environment jsdom

import { expect, test } from "vite-plus/test";
import { createSavedCompositionStore } from "@/features/studio/platform/saved-composition-store";
import { defaultComposition } from "@/test/helpers";

test("save then load round-trips the Composition without its Screenshot", () => {
  const store = createSavedCompositionStore();
  localStorage.clear();

  expect(store.save({ ...defaultComposition, padding: 64 })).toBe("ok");

  const { screenshot: _screenshot, ...withoutScreenshot } = defaultComposition;
  expect(store.load()).toEqual({ ...withoutScreenshot, padding: 64 });
});

test("load is none when nothing is stored or the stored value does not parse", () => {
  const store = createSavedCompositionStore();
  localStorage.clear();

  expect(store.load()).toBe("none");

  localStorage.setItem("better-screenshots.saved-composition", "{ not json");
  expect(store.load()).toBe("none");
});

test("a storage that throws is unavailable, for load and for save", () => {
  const store = createSavedCompositionStore(() => {
    throw new Error("blocked");
  });

  expect(store.load()).toBe("unavailable");
  expect(store.save(defaultComposition)).toBe("unavailable");
});
