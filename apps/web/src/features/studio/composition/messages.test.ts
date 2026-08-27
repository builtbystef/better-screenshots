import { expect, test } from "vite-plus/test";
import {
  changeLine,
  exportLine,
  placeLine,
  uploadLine,
} from "@/features/studio/composition/messages";

test("a place writes a line only when it fails, and clipboard copy only for paste", () => {
  for (const source of ["picker", "drop", "paste"] as const) {
    expect(placeLine(source, "ok")).toBeNull();
    expect(placeLine(source, "refuse")).toBe("That file isn't an image.");
  }
  expect(placeLine("paste", "empty")).toBe("No image on the clipboard.");
  expect(placeLine("picker", "empty")).toBeNull();
  expect(placeLine("drop", "empty")).toBeNull();
});

test("change, export, and upload write a line only on a refusal", () => {
  expect(changeLine("ok")).toBeNull();
  expect(exportLine("ok")).toBeNull();
  expect(uploadLine("ok")).toBeNull();

  expect(changeLine("refuse")).toBe("Couldn't apply that change.");
  expect(exportLine("refuse")).toBe("Couldn't export that image.");
});

test("each upload refusal names its own cause", () => {
  expect(uploadLine("undecodable")).toBe("That file isn't an image.");
  expect(uploadLine("quota")).toBe("Not enough storage for that image.");
  expect(uploadLine("unavailable")).toBe("Can't store images in this browser.");
});
