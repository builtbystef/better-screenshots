// @vitest-environment jsdom

import { afterEach, expect, test, vi } from "vite-plus/test";
import { schemeBootScript } from "./scheme";

const darkQuery = "(prefers-color-scheme: dark)";
const lightQuery = "(prefers-color-scheme: light)";

type Scheme = "dark" | "light" | "no-preference";

function runBootScript(scheme: Scheme) {
  let current = scheme;
  let changeListener: (() => void) | undefined;
  const matchMedia = vi.fn((query: string) => ({
    matches:
      (query === darkQuery && current === "dark") || (query === lightQuery && current === "light"),
    addEventListener: (_type: "change", listener: () => void) => {
      if (query === darkQuery) changeListener = listener;
    },
  }));
  vi.stubGlobal("matchMedia", matchMedia);

  window.eval(schemeBootScript);

  return {
    changeTo(next: Scheme) {
      current = next;
      changeListener?.();
    },
  };
}

afterEach(() => {
  document.documentElement.classList.remove("dark");
  vi.unstubAllGlobals();
});

test("the boot script sets dark on html for the dark colour scheme", () => {
  runBootScript("dark");

  expect(document.documentElement.classList.contains("dark")).toBe(true);
});

test.each(["light", "no-preference"] as const)(
  "the boot script leaves html light for the %s colour scheme",
  (scheme) => {
    runBootScript(scheme);

    expect(document.documentElement.classList.contains("dark")).toBe(false);
  },
);

test("the boot script reapplies the colour scheme after a change", () => {
  const scheme = runBootScript("light");

  scheme.changeTo("dark");
  expect(document.documentElement.classList.contains("dark")).toBe(true);

  scheme.changeTo("light");
  expect(document.documentElement.classList.contains("dark")).toBe(false);
});
