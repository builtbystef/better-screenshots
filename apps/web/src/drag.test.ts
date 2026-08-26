// @vitest-environment jsdom

import { expect, test } from "vite-plus/test";
import { clampPosition, isFileDrag, isTextFieldTarget, positionFromDrag } from "./drag";

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

test("positionFromDrag maps a horizontal Preview drag into Composition Position", () => {
  expect(
    positionFromDrag({
      origin: { x: 0, y: 0 },
      start: { x: 0, y: 0 },
      current: { x: 10, y: 0 },
      previewWidth: 960,
      compositionWidth: 1920,
    }),
  ).toEqual({ x: 20, y: 0 });
});

test("positionFromDrag snaps a fractional Preview drag to integer Position", () => {
  expect(
    positionFromDrag({
      origin: { x: 0, y: 0 },
      start: { x: 0, y: 0 },
      current: { x: 10.4, y: -3.2 },
      previewWidth: 960,
      compositionWidth: 1920,
    }),
  ).toEqual({ x: 21, y: -6 });
});

test("clampPosition keeps the Screenshot center inside the frame", () => {
  expect(clampPosition({ x: 5000, y: -4000 }, { width: 1920, height: 1080 })).toEqual({
    x: 960,
    y: -540,
  });
});

test("clampPosition leaves a Position already inside the frame", () => {
  expect(clampPosition({ x: 10, y: -20 }, { width: 1920, height: 1080 })).toEqual({
    x: 10,
    y: -20,
  });
});
