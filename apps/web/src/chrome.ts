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
