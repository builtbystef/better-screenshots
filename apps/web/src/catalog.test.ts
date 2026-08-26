import { expect, test } from "vite-plus/test";
import {
  aspectPresetFor,
  aspectPresets,
  catalogDefaultSolid,
  catalogGradientFor,
  catalogGradients,
  catalogSolidFor,
  catalogSolids,
} from "./catalog";

test("Catalog solids are the eight named hexes in order", () => {
  expect(catalogSolids.map((entry) => [entry.name, entry.color])).toEqual([
    ["Zinc 100", "#F4F4F5"],
    ["Zinc 200", "#E4E4E7"],
    ["Slate", "#CBD5E1"],
    ["Charcoal", "#27272A"],
    ["Black", "#09090B"],
    ["Sky", "#BAE6FD"],
    ["Teal", "#99F6E4"],
    ["Rose", "#FECDD3"],
  ]);
});

test("Catalog gradients are the six named two-stop values in order", () => {
  expect(
    catalogGradients.map((entry) => [
      entry.name,
      entry.value.angle,
      entry.value.stops.map((stop) => [stop.offset, stop.color]),
    ]),
  ).toEqual([
    [
      "Zinc fade",
      180,
      [
        [0, "#F4F4F5"],
        [1, "#D4D4D8"],
      ],
    ],
    [
      "Slate dusk",
      160,
      [
        [0, "#CBD5E1"],
        [1, "#64748B"],
      ],
    ],
    [
      "Sky wash",
      135,
      [
        [0, "#BAE6FD"],
        [1, "#E0E7FF"],
      ],
    ],
    [
      "Teal mist",
      150,
      [
        [0, "#99F6E4"],
        [1, "#BAE6FD"],
      ],
    ],
    [
      "Night",
      180,
      [
        [0, "#27272A"],
        [1, "#09090B"],
      ],
    ],
    [
      "Rose mist",
      140,
      [
        [0, "#FECDD3"],
        [1, "#E0E7FF"],
      ],
    ],
  ]);
});

test("catalogSolidFor returns the Catalog entry for a case-insensitive color match", () => {
  expect(catalogSolidFor("#e4e4e7")).toEqual({ name: "Zinc 200", color: "#E4E4E7" });
});

test("catalogSolidFor returns undefined when the color is absent from the Catalog", () => {
  expect(catalogSolidFor("#FFFFFF")).toBeUndefined();
});

test("catalogGradientFor returns the Catalog entry for an equal value", () => {
  expect(
    catalogGradientFor({
      type: "gradient",
      angle: 180,
      stops: [
        { offset: 0, color: "#f4f4f5" },
        { offset: 1, color: "#d4d4d8" },
      ],
    }),
  ).toEqual({
    name: "Zinc fade",
    value: {
      type: "gradient",
      angle: 180,
      stops: [
        { offset: 0, color: "#F4F4F5" },
        { offset: 1, color: "#D4D4D8" },
      ],
    },
  });
});

test("catalogGradientFor returns undefined when the value is absent from the Catalog", () => {
  expect(
    catalogGradientFor({
      type: "gradient",
      angle: 160,
      stops: [
        { offset: 0, color: "#F4F4F5" },
        { offset: 1, color: "#D4D4D8" },
      ],
    }),
  ).toBeUndefined();
});

test("Catalog default solid is Zinc 200", () => {
  expect(catalogDefaultSolid).toEqual({ type: "solid", color: "#E4E4E7" });
});

test("aspectPresetFor returns the Catalog entry for an exact Frame", () => {
  expect(aspectPresetFor(1920, 1080)).toEqual({ name: "16:9", width: 1920, height: 1080 });
});

test("aspectPresetFor returns undefined when the Frame is absent from the Catalog", () => {
  expect(aspectPresetFor(1920, 1081)).toBeUndefined();
});

test("Aspect presets are the seven named Frame sizes in order", () => {
  expect(aspectPresets.map((entry) => [entry.name, entry.width, entry.height])).toEqual([
    ["16:9", 1920, 1080],
    ["1:1", 1080, 1080],
    ["4:5", 1080, 1350],
    ["9:16", 1080, 1920],
    ["4:3", 1440, 1080],
    ["3:2", 1620, 1080],
    ["1.91:1", 1200, 630],
  ]);
});

test("each Aspect preset's name describes its Frame ratio", () => {
  for (const preset of aspectPresets) {
    const namedRatio = /^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/.exec(preset.name);
    expect(namedRatio).not.toBeNull();
    if (namedRatio === null) {
      continue;
    }
    const namedWidth = Number(namedRatio[1]);
    const namedHeight = Number(namedRatio[2]);
    expect(Math.abs(preset.width / preset.height - namedWidth / namedHeight)).toBeLessThan(0.01);
  }
});

test("every Catalog color is a six-digit hex", () => {
  const colors = [
    ...catalogSolids.map((solid) => solid.color),
    ...catalogGradients.flatMap((gradient) => gradient.value.stops.map((stop) => stop.color)),
    catalogDefaultSolid.color,
  ];

  for (const color of colors) {
    expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
  }
});
