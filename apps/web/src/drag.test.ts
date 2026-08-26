// @vitest-environment jsdom

import { expect, test } from "vite-plus/test";
import {
  clampPosition,
  filesFrom,
  hitsDrawn,
  isFileDrag,
  isTextFieldTarget,
  positionFromDrag,
} from "./drag";

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

test("filesFrom prefers a non-empty file list over transfer items", () => {
  const listed = new File(["listed"], "listed.png", { type: "image/png" });
  const item = new File(["item"], "item.png", { type: "image/png" });

  expect(
    filesFrom({
      files: [listed],
      items: [{ kind: "file", getAsFile: () => item }],
    }),
  ).toEqual([listed]);
});

test("filesFrom uses image items when the file list is empty", () => {
  const image = new File(["image"], "image.png", { type: "image/png" });

  expect(
    filesFrom({
      files: [],
      items: [{ kind: "file", type: "image/png", getAsFile: () => image }],
    }),
  ).toEqual([image]);
});

test("filesFrom skips string items and files that cannot be read", () => {
  expect(
    filesFrom({
      files: [],
      items: [
        { kind: "string", getAsFile: () => null },
        { kind: "file", getAsFile: () => null },
      ],
    }),
  ).toEqual([]);
  expect(filesFrom({ files: [], items: [] })).toEqual([]);
  expect(filesFrom(null)).toEqual([]);
});

test("hitsDrawn includes points inside every edge and excludes points outside", () => {
  const rect = { left: 100, top: 50, clientWidth: 500, clientLeft: 2 };
  const drawn = { x: 20, y: 40, width: 200, height: 100 };
  const compositionWidth = 1000;

  for (const point of [
    { x: 112.1, y: 95 },
    { x: 211.9, y: 95 },
    { x: 160, y: 72.1 },
    { x: 160, y: 121.9 },
  ]) {
    expect(hitsDrawn({ point, rect, drawn, compositionWidth })).toBe(true);
  }
  for (const point of [
    { x: 111.9, y: 95 },
    { x: 212.1, y: 95 },
    { x: 160, y: 71.9 },
    { x: 160, y: 122.1 },
  ]) {
    expect(hitsDrawn({ point, rect, drawn, compositionWidth })).toBe(false);
  }
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
