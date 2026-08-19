import { expect, test } from "vite-plus/test";
import { schemeClass } from "./chrome";

test("schemeClass maps dark to the dark class", () => {
  expect(schemeClass("dark")).toBe("dark");
});

test("schemeClass maps light to no class", () => {
  expect(schemeClass("light")).toBeNull();
});

test("schemeClass maps no-preference to no class", () => {
  expect(schemeClass("no-preference")).toBeNull();
});
