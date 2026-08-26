import { expect, test } from "vite-plus/test";
import { changeLine, exportLine, placeLine, uploadLine } from "./messages";

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

test("a refused session change writes the change line", () => {
  expect(changeLine("ok")).toBeNull();
  expect(changeLine("refuse")).toBe("Couldn't apply that change.");
});

test("a successful Export writes no Preview line", () => {
  expect(exportLine("ok")).toBeNull();
});

test("an occupied Export refuse writes the Export line", () => {
  expect(exportLine("refuse")).toBe("Couldn't export that image.");
});

test("a successful upload writes no Image line", () => {
  expect(uploadLine("ok")).toBeNull();
});

test("an undecodable upload writes the file line", () => {
  expect(uploadLine("undecodable")).toBe("That file isn't an image.");
});

test("a quota upload writes the storage line", () => {
  expect(uploadLine("quota")).toBe("Not enough storage for that image.");
});

test("an unavailable upload writes the browser line", () => {
  expect(uploadLine("unavailable")).toBe("Can't store images in this browser.");
});
