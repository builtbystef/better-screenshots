// @vitest-environment jsdom

import { expect, test } from "vite-plus/test";
import { isFileDrag, isTextFieldTarget, placeLine, schemeClass } from "./chrome";

test("schemeClass maps dark to the dark class", () => {
  expect(schemeClass("dark")).toBe("dark");
});

test("schemeClass maps light to no class", () => {
  expect(schemeClass("light")).toBeNull();
});

test("schemeClass maps no-preference to no class", () => {
  expect(schemeClass("no-preference")).toBeNull();
});

test("a successful place writes no Preview line", () => {
  expect(placeLine("picker", "ok")).toBeNull();
  expect(placeLine("drop", "ok")).toBeNull();
  expect(placeLine("paste", "ok")).toBeNull();
});

test("picker, drop, or paste of an undecodable file writes the file line", () => {
  expect(placeLine("picker", "refuse")).toBe("That file isn't an image.");
  expect(placeLine("drop", "refuse")).toBe("That file isn't an image.");
  expect(placeLine("paste", "refuse")).toBe("That file isn't an image.");
});

test("paste with no image writes the clipboard line", () => {
  expect(placeLine("paste", "empty")).toBe("No image on the clipboard.");
});

test("an empty picker or drop writes no Preview line", () => {
  expect(placeLine("picker", "empty")).toBeNull();
  expect(placeLine("drop", "empty")).toBeNull();
});

test("a drag is a file drag when types include Files", () => {
  expect(isFileDrag(["Files"])).toBe(true);
  expect(isFileDrag(["text/plain", "Files"])).toBe(true);
});

test("a drag without Files is not a file drag", () => {
  expect(isFileDrag([])).toBe(false);
  expect(isFileDrag(["text/plain"])).toBe(false);
});

test("text, number, and textarea are text field targets", () => {
  const text = document.createElement("input");
  text.type = "text";
  const number = document.createElement("input");
  number.type = "number";
  const area = document.createElement("textarea");
  expect(isTextFieldTarget(text)).toBe(true);
  expect(isTextFieldTarget(number)).toBe(true);
  expect(isTextFieldTarget(area)).toBe(true);
});

test("file, button, and a plain element are not text field targets", () => {
  const file = document.createElement("input");
  file.type = "file";
  const button = document.createElement("button");
  const div = document.createElement("div");
  expect(isTextFieldTarget(file)).toBe(false);
  expect(isTextFieldTarget(button)).toBe(false);
  expect(isTextFieldTarget(div)).toBe(false);
  expect(isTextFieldTarget(null)).toBe(false);
});
