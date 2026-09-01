import type {
  GradientBackground,
  HexColor,
  SolidBackground,
} from "@/features/studio/composition/session";

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

export const catalogDefaultSolid = {
  type: "solid",
  color: "#E4E4E7",
} satisfies SolidBackground;

export type AspectPreset = {
  name: string;
  ratio: string;
  width: number;
  height: number;
  // The placements this Frame is meant for, shown on the chip's tooltip. One
  // preset per ratio: pixel counts differ between platforms, the shape does not.
  note: string;
};

export const aspectPresets: readonly AspectPreset[] = [
  {
    name: "Social post",
    ratio: "4:5",
    width: 1080,
    height: 1350,
    note: "Instagram, Facebook, LinkedIn and Threads feeds",
  },
  {
    name: "Short-form video",
    ratio: "9:16",
    width: 1080,
    height: 1920,
    note: "Reels, Stories, TikTok and YouTube Shorts",
  },
  {
    name: "Landscape",
    ratio: "16:9",
    width: 1920,
    height: 1080,
    note: "YouTube, X posts and slides",
  },
  {
    name: "Instagram grid",
    ratio: "3:4",
    width: 1080,
    height: 1440,
    note: "Instagram's tallest feed size; the profile grid previews at 3:4",
  },
  {
    name: "Pinterest Pin",
    ratio: "2:3",
    width: 1000,
    height: 1500,
    note: "The Pin size Pinterest recommends",
  },
  {
    name: "Square",
    ratio: "1:1",
    width: 1080,
    height: 1080,
    note: "Square feed posts",
  },
  {
    name: "Link preview",
    ratio: "1.91:1",
    width: 1200,
    height: 630,
    note: "The Open Graph card scrapers read",
  },
  {
    name: "Classic",
    ratio: "4:3",
    width: 1440,
    height: 1080,
    note: "Untrimmed desktop screenshots",
  },
  {
    name: "Photo",
    ratio: "3:2",
    width: 1620,
    height: 1080,
    note: "Camera-native landscape",
  },
];

export function aspectPresetFor(width: number, height: number): AspectPreset | undefined {
  return aspectPresets.find((preset) => preset.width === width && preset.height === height);
}
