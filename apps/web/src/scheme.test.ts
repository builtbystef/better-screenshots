// @vitest-environment jsdom

import { afterEach, expect, test, vi } from "vite-plus/test";
import { schemeBootScript } from "./scheme";

function runBootScript(dark: boolean) {
  let matches = dark;
  let changeListener: (() => void) | undefined;
  vi.stubGlobal("matchMedia", () => ({
    get matches() {
      return matches;
    },
    addEventListener: (_type: "change", listener: () => void) => {
      changeListener = listener;
    },
  }));

  window.eval(schemeBootScript);

  return {
    changeTo(next: boolean) {
      matches = next;
      changeListener?.();
    },
  };
}

afterEach(() => {
  document.documentElement.classList.remove("dark");
  vi.unstubAllGlobals();
});

test("the boot script follows the OS colour scheme at boot and on change", () => {
  const scheme = runBootScript(false);
  expect(document.documentElement.classList.contains("dark")).toBe(false);

  scheme.changeTo(true);
  expect(document.documentElement.classList.contains("dark")).toBe(true);

  scheme.changeTo(false);
  expect(document.documentElement.classList.contains("dark")).toBe(false);
});
