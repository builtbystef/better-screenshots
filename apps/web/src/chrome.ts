import type { UploadRefuse } from "./session";

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

export function uploadLine(outcome: "ok" | UploadRefuse): string | null {
  switch (outcome) {
    case "ok":
      return null;
    case "undecodable":
      return "That file isn't an image.";
    case "quota":
      return "Not enough storage for that image.";
    case "unavailable":
      return "Can't store images in this browser.";
  }
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

export function positionFromDrag(input: {
  origin: { x: number; y: number };
  start: { x: number; y: number };
  current: { x: number; y: number };
  previewWidth: number;
  compositionWidth: number;
}): { x: number; y: number } {
  const scale = input.compositionWidth / input.previewWidth;
  return {
    x: input.origin.x + Math.round((input.current.x - input.start.x) * scale),
    y: input.origin.y + Math.round((input.current.y - input.start.y) * scale),
  };
}

export function clampPosition(
  position: { x: number; y: number },
  frame: { width: number; height: number },
): { x: number; y: number } {
  const maxX = frame.width / 2;
  const maxY = frame.height / 2;
  return {
    x: Math.min(maxX, Math.max(-maxX, position.x)),
    y: Math.min(maxY, Math.max(-maxY, position.y)),
  };
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
