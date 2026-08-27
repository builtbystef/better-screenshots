import { expect, test } from "vite-plus/test";
import {
  formatScale,
  parseHex,
  parseInteger,
  parseNonNegativeInteger,
  parseOpacityPercent,
  parseScale,
} from "@/features/studio/composition/parse";

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

test("parseNonNegativeInteger accepts zero and a positive integer", () => {
  expect(parseNonNegativeInteger("0")).toBe(0);
  expect(parseNonNegativeInteger("42")).toBe(42);
});

test("parseNonNegativeInteger refuses a negative value and a non-integer", () => {
  expect(parseNonNegativeInteger("-1")).toBe("refuse");
  expect(parseNonNegativeInteger("2.5")).toBe("refuse");
});

test("formatScale pads a Scale to two decimals", () => {
  expect(formatScale(1.2)).toBe("1.20");
});

test("parseOpacityPercent accepts a percent integer", () => {
  expect(parseOpacityPercent("25")).toBe(25);
});

test("parseOpacityPercent refuses a value outside 0-100 and a non-integer", () => {
  expect(parseOpacityPercent("101")).toBe("refuse");
  expect(parseOpacityPercent("25.5")).toBe("refuse");
});
