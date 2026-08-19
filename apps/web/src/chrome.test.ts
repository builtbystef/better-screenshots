// @vitest-environment jsdom

import { expect, test } from "vite-plus/test";
import { catalogGradients, catalogSolids } from "./catalog";
import {
  exportLine,
  isFileDrag,
  isTextFieldTarget,
  matchingGradient,
  matchingSolid,
  parseHex,
  parseInteger,
  parseOpacityPercent,
  parseScale,
  placeLine,
  schemeClass,
} from "./chrome";

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

test("a successful Export writes no Preview line", () => {
  expect(exportLine("ok")).toBeNull();
});

test("an occupied Export refuse writes the Export line", () => {
  expect(exportLine("refuse")).toBe("Couldn't export that image.");
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

test("parseHex accepts six digits without a hash and keeps case", () => {
  expect(parseHex("aabbcc")).toBe("#aabbcc");
});

test("parseHex accepts a hashed six-digit hex and keeps case", () => {
  expect(parseHex("#AaBbCc")).toBe("#AaBbCc");
});

test("parseHex refuses shorthand, empty, and eight-digit hex", () => {
  expect(parseHex("#abc")).toBe("refuse");
  expect(parseHex("")).toBe("refuse");
  expect(parseHex("#aabbccff")).toBe("refuse");
});

const catalogSolidColors = catalogSolids.map((entry) => entry.color);

test("matchingSolid matches a Catalog solid case-insensitively", () => {
  expect(matchingSolid("#e4e4e7", catalogSolidColors)).toBe("#E4E4E7");
});

test("matchingSolid returns null for a hex that is not a Catalog solid", () => {
  expect(matchingSolid("#FFFFFF", catalogSolidColors)).toBeNull();
});

const zincFade = {
  type: "gradient" as const,
  angle: 180,
  stops: [
    { offset: 0, color: "#F4F4F5" },
    { offset: 1, color: "#D4D4D8" },
  ],
};

const catalogGradientValues = catalogGradients.map((entry) => entry.value);

test("matchingGradient of Zinc fade against the Catalog is Zinc fade", () => {
  expect(matchingGradient(zincFade, catalogGradientValues)).toEqual(zincFade);
});

test("matchingGradient of Zinc fade stops at 160 degrees is null", () => {
  expect(matchingGradient({ ...zincFade, angle: 160 }, catalogGradientValues)).toBeNull();
});

test("parseInteger trims whitespace and accepts an optional leading plus", () => {
  expect(parseInteger(" 80 ")).toBe(80);
  expect(parseInteger("+80")).toBe(80);
});

test("parseInteger refuses a unit suffix, a trailing decimal, and a comma decimal", () => {
  expect(parseInteger("80px")).toBe("refuse");
  expect(parseInteger("80.0")).toBe("refuse");
  expect(parseInteger("80,5")).toBe("refuse");
});

test("parseScale accepts an integer and rounds to two decimals", () => {
  expect(parseScale("1")).toBe(1);
  expect(parseScale("1.255")).toBe(1.26);
});

test("parseScale refuses zero and a comma decimal", () => {
  expect(parseScale("0")).toBe("refuse");
  expect(parseScale("1,25")).toBe("refuse");
});

test("parseOpacityPercent accepts a percent integer", () => {
  expect(parseOpacityPercent("25")).toBe(25);
});

test("parseOpacityPercent refuses a value outside 0-100 and a non-integer", () => {
  expect(parseOpacityPercent("101")).toBe("refuse");
  expect(parseOpacityPercent("25.5")).toBe("refuse");
});
