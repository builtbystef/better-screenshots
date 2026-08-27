import { expect, test } from "vite-plus/test";
import {
  aspectPresetFor,
  aspectPresets,
  catalogDefaultSolid,
  catalogGradientFor,
  catalogGradients,
  catalogSolidFor,
  catalogSolids,
} from "@/features/studio/composition/catalog";

test("catalogSolidFor matches a Catalog color case-insensitively and misses anything else", () => {
  expect(catalogSolidFor("#e4e4e7")).toEqual({ name: "Zinc 200", color: "#E4E4E7" });
  expect(catalogSolidFor("#FFFFFF")).toBeUndefined();
});

test("catalogGradientFor matches on angle and stops, and misses on a changed angle", () => {
  const zincFade = catalogGradients[0];
  expect(zincFade).toBeDefined();
  if (zincFade === undefined) {
    return;
  }

  expect(
    catalogGradientFor({
      ...zincFade.value,
      stops: zincFade.value.stops.map((stop) => ({ ...stop, color: stop.color.toLowerCase() })),
    } as typeof zincFade.value),
  ).toEqual(zincFade);
  expect(
    catalogGradientFor({ ...zincFade.value, angle: zincFade.value.angle + 5 }),
  ).toBeUndefined();
});

test("aspectPresetFor matches an exact Frame and misses a Frame off by one", () => {
  expect(aspectPresetFor(1920, 1080)).toEqual({ name: "16:9", width: 1920, height: 1080 });
  expect(aspectPresetFor(1920, 1081)).toBeUndefined();
});

test("each Aspect preset's name describes its Frame ratio", () => {
  for (const preset of aspectPresets) {
    const namedRatio = /^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/.exec(preset.name);
    expect(namedRatio).not.toBeNull();
    if (namedRatio === null) {
      continue;
    }
    expect(
      Math.abs(preset.width / preset.height - Number(namedRatio[1]) / Number(namedRatio[2])),
    ).toBeLessThan(0.01);
  }
});

test("every Catalog color is a six-digit hex and the default solid is a Catalog solid", () => {
  const colors = [
    ...catalogSolids.map((solid) => solid.color),
    ...catalogGradients.flatMap((gradient) => gradient.value.stops.map((stop) => stop.color)),
    catalogDefaultSolid.color,
  ];

  for (const color of colors) {
    expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
  }
  expect(catalogSolidFor(catalogDefaultSolid.color)).toBeDefined();
});
