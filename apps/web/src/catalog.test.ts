import { expect, test } from "vite-plus/test";
import { catalogDefaultSolid, catalogGradients, catalogSolids } from "./catalog";

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

test("Catalog default solid is Zinc 200", () => {
  expect(catalogDefaultSolid).toEqual({ type: "solid", color: "#E4E4E7" });
});
