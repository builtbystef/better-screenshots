import type { GradientBackground, HexColor } from "./session";

export type CatalogSolid = { name: string; color: HexColor };

export const catalogSolids: readonly CatalogSolid[] = [
  { name: "Zinc 100", color: "#F4F4F5" },
  { name: "Zinc 200", color: "#E4E4E7" },
  { name: "Slate", color: "#CBD5E1" },
  { name: "Charcoal", color: "#27272A" },
  { name: "Black", color: "#09090B" },
  { name: "Sky", color: "#BAE6FD" },
  { name: "Teal", color: "#99F6E4" },
  { name: "Rose", color: "#FECDD3" },
];

export function catalogSolidFor(color: HexColor): CatalogSolid | undefined {
  const needle = color.toLowerCase();
  return catalogSolids.find((entry) => entry.color.toLowerCase() === needle);
}

export type CatalogGradient = { name: string; value: GradientBackground };

export const catalogGradients: readonly CatalogGradient[] = [
  {
    name: "Zinc fade",
    value: {
      type: "gradient",
      angle: 180,
      stops: [
        { offset: 0, color: "#F4F4F5" },
        { offset: 1, color: "#D4D4D8" },
      ],
    },
  },
  {
    name: "Slate dusk",
    value: {
      type: "gradient",
      angle: 160,
      stops: [
        { offset: 0, color: "#CBD5E1" },
        { offset: 1, color: "#64748B" },
      ],
    },
  },
  {
    name: "Sky wash",
    value: {
      type: "gradient",
      angle: 135,
      stops: [
        { offset: 0, color: "#BAE6FD" },
        { offset: 1, color: "#E0E7FF" },
      ],
    },
  },
  {
    name: "Teal mist",
    value: {
      type: "gradient",
      angle: 150,
      stops: [
        { offset: 0, color: "#99F6E4" },
        { offset: 1, color: "#BAE6FD" },
      ],
    },
  },
  {
    name: "Night",
    value: {
      type: "gradient",
      angle: 180,
      stops: [
        { offset: 0, color: "#27272A" },
        { offset: 1, color: "#09090B" },
      ],
    },
  },
  {
    name: "Rose mist",
    value: {
      type: "gradient",
      angle: 140,
      stops: [
        { offset: 0, color: "#FECDD3" },
        { offset: 1, color: "#E0E7FF" },
      ],
    },
  },
];

function sameStops(left: GradientBackground["stops"], right: GradientBackground["stops"]): boolean {
  return (
    left.length === right.length &&
    left.every(
      (stop, index) =>
        stop.offset === right[index]?.offset &&
        stop.color.toLowerCase() === right[index].color.toLowerCase(),
    )
  );
}

export function catalogGradientFor(value: GradientBackground): CatalogGradient | undefined {
  return catalogGradients.find(
    (entry) => entry.value.angle === value.angle && sameStops(entry.value.stops, value.stops),
  );
}

export const catalogDefaultSolid = { type: "solid" as const, color: "#E4E4E7" };

export type AspectPreset = { name: string; width: number; height: number };

export const aspectPresets: readonly AspectPreset[] = [
  { name: "16:9", width: 1920, height: 1080 },
  { name: "1:1", width: 1080, height: 1080 },
  { name: "4:5", width: 1080, height: 1350 },
  { name: "9:16", width: 1080, height: 1920 },
  { name: "4:3", width: 1440, height: 1080 },
  { name: "3:2", width: 1620, height: 1080 },
  { name: "1.91:1", width: 1200, height: 630 },
];

export function aspectPresetFor(width: number, height: number): AspectPreset | undefined {
  return aspectPresets.find((preset) => preset.width === width && preset.height === height);
}
