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

export function changeLine(outcome: "ok" | "refuse"): string | null {
  return outcome === "ok" ? null : "Couldn't apply that change.";
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
