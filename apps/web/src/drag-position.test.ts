import { expect, test } from "vite-plus/test";
import { positionFromDrag } from "./drag";

test("positionFromDrag adds a scaled Preview drag to its starting Position", () => {
  expect(
    positionFromDrag({
      origin: { x: 100, y: -50 },
      start: { x: 0, y: 0 },
      current: { x: 10, y: -15 },
      previewWidth: 960,
      compositionWidth: 1920,
    }),
  ).toEqual({ x: 120, y: -80 });
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
