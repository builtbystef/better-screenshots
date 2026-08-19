import type { GradientBackground, HexColor } from "./session";

export type PlaceSource = "picker" | "drop" | "paste";

export type PlaceOutcome = "ok" | "refuse" | "empty";

export function placeLine(source: PlaceSource, outcome: PlaceOutcome): string | null {
  if (outcome === "ok") {
    return null;
  }
  if (outcome === "empty") {
    return source === "paste" ? "No image on the clipboard." : null;
  }
  return "That file isn't an image.";
}

export function exportLine(outcome: "ok" | "refuse"): string | null {
  return outcome === "ok" ? null : "Couldn't export that image.";
}

export function isFileDrag(types: readonly string[]): boolean {
  return types.includes("Files");
}

const NON_TEXT_INPUT_TYPES = new Set([
  "button",
  "checkbox",
  "color",
  "file",
  "hidden",
  "image",
  "radio",
  "range",
  "reset",
  "submit",
]);

export function isTextFieldTarget(target: EventTarget | null): boolean {
  if (target instanceof HTMLTextAreaElement) {
    return true;
  }
  if (target instanceof HTMLInputElement) {
    return !NON_TEXT_INPUT_TYPES.has(target.type);
  }
  return target instanceof HTMLElement && target.isContentEditable === true;
}

const HEX_DIGITS = /^#?([0-9A-Fa-f]{6})$/;

export function parseHex(raw: string): `#${string}` | "refuse" {
  const match = HEX_DIGITS.exec(raw);
  return match === null ? "refuse" : `#${match[1]}`;
}

const INTEGER = /^[+-]?\d+$/;

export function parseInteger(raw: string): number | "refuse" {
  const trimmed = raw.trim();
  return INTEGER.test(trimmed) ? Number(trimmed) : "refuse";
}

const DECIMAL = /^[+-]?\d+(\.\d+)?$/;

export function parseScale(raw: string): number | "refuse" {
  const trimmed = raw.trim();
  if (!DECIMAL.test(trimmed)) {
    return "refuse";
  }
  const value = Number(`${Math.round(Number(`${trimmed}e2`))}e-2`);
  return value <= 0 ? "refuse" : value;
}

export function parseOpacityPercent(raw: string): number | "refuse" {
  const parsed = parseInteger(raw);
  return parsed === "refuse" || parsed < 0 || parsed > 100 ? "refuse" : parsed;
}

export function matchingSolid(color: HexColor, solids: readonly HexColor[]): HexColor | null {
  const needle = color.toLowerCase();
  return solids.find((solid) => solid.toLowerCase() === needle) ?? null;
}

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

export function matchingGradient(
  value: GradientBackground,
  gradients: readonly GradientBackground[],
): GradientBackground | null {
  return (
    gradients.find(
      (gradient) => gradient.angle === value.angle && sameStops(gradient.stops, value.stops),
    ) ?? null
  );
}

export function schemeClass(prefers: "dark" | "light" | "no-preference"): "dark" | null {
  return prefers === "dark" ? "dark" : null;
}

export const schemeBootScript = `(function () {
  function schemeClass(prefers) {
    return prefers === "dark" ? "dark" : null;
  }
  function apply() {
    var prefers = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : window.matchMedia("(prefers-color-scheme: light)").matches
        ? "light"
        : "no-preference";
    var next = schemeClass(prefers);
    document.documentElement.classList.toggle("dark", next === "dark");
  }
  apply();
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", apply);
})()`;
