import { parseHex } from "@/features/studio/composition/parse";
import type {
  Background,
  BrowserWindow,
  Composition,
  GradientStop,
  StudioSession,
} from "@/features/studio/composition/session";

// The Saved composition is a Composition without its Screenshot: the settings
// the Studio restores on the next load. The Screenshot itself is deliberately
// not saved — it can be large, and bringing one in is a one-gesture act.
export type SavedComposition = Omit<Composition, "screenshot">;

// Bump when the saved shape changes; a value from another version is refused
// and the Studio opens on its defaults.
const SAVED_VERSION = 1;

export function serializeSavedComposition(composition: Composition): string {
  return JSON.stringify({
    v: SAVED_VERSION,
    width: composition.width,
    height: composition.height,
    background: composition.background,
    padding: composition.padding,
    scale: composition.scale,
    position: composition.position,
    shadow: composition.shadow,
    border: composition.border,
    radius: composition.radius,
    browserWindow: composition.browserWindow,
    url: composition.url,
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function parseBackground(value: unknown): Background | "refuse" {
  if (!isRecord(value)) {
    return "refuse";
  }
  if (value.type === "solid") {
    const color = typeof value.color === "string" ? parseHex(value.color) : "refuse";
    return color === "refuse" ? "refuse" : { type: "solid", color };
  }
  if (value.type === "gradient") {
    if (!isFiniteNumber(value.angle) || !Array.isArray(value.stops)) {
      return "refuse";
    }
    const stops: GradientStop[] = [];
    for (const stop of value.stops as unknown[]) {
      if (!isRecord(stop) || !isFiniteNumber(stop.offset) || typeof stop.color !== "string") {
        return "refuse";
      }
      const color = parseHex(stop.color);
      if (color === "refuse") {
        return "refuse";
      }
      stops.push({ offset: stop.offset, color });
    }
    return { type: "gradient", angle: value.angle, stops };
  }
  if (value.type === "image") {
    return typeof value.id === "string" && value.id !== ""
      ? { type: "image", id: value.id }
      : "refuse";
  }
  return "refuse";
}

const BROWSER_WINDOWS: readonly BrowserWindow[] = ["none", "light", "dark"];

function parseBrowserWindow(value: unknown): BrowserWindow | "refuse" {
  return BROWSER_WINDOWS.includes(value as BrowserWindow) ? (value as BrowserWindow) : "refuse";
}

// Shape-checks a stored string back into a Saved composition. This guards
// against another version's shape or a hand-edited value; each field's range
// is still the Session writers' to enforce on apply.
export function parseSavedComposition(raw: string): SavedComposition | "refuse" {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return "refuse";
  }
  if (!isRecord(value) || value.v !== SAVED_VERSION) {
    return "refuse";
  }
  const background = parseBackground(value.background);
  const browserWindow = parseBrowserWindow(value.browserWindow);
  const { position, shadow, border } = value;
  if (
    background === "refuse" ||
    browserWindow === "refuse" ||
    !isFiniteNumber(value.width) ||
    !isFiniteNumber(value.height) ||
    !isFiniteNumber(value.padding) ||
    !isFiniteNumber(value.scale) ||
    !isFiniteNumber(value.radius) ||
    !isRecord(position) ||
    !isFiniteNumber(position.x) ||
    !isFiniteNumber(position.y) ||
    !isRecord(shadow) ||
    !isFiniteNumber(shadow.offset) ||
    !isFiniteNumber(shadow.blur) ||
    !isFiniteNumber(shadow.opacity) ||
    !isRecord(border) ||
    !isFiniteNumber(border.width) ||
    typeof border.color !== "string" ||
    typeof value.url !== "string"
  ) {
    return "refuse";
  }
  const borderColor = parseHex(border.color);
  if (borderColor === "refuse") {
    return "refuse";
  }
  return {
    width: value.width,
    height: value.height,
    background,
    padding: value.padding,
    scale: value.scale,
    position: { x: position.x, y: position.y },
    shadow: { offset: shadow.offset, blur: shadow.blur, opacity: shadow.opacity },
    border: { width: border.width, color: borderColor },
    radius: value.radius,
    browserWindow,
    url: value.url,
  };
}

// Applies a Saved composition through the Session writers, so every stored
// value passes the same validation as a live edit. A field that no longer
// validates is refused by its writer and stays on the default. An image
// Background is only restored while its Uploaded background still exists.
export function applySavedComposition(session: StudioSession, saved: SavedComposition): void {
  session.setSize(saved.width, saved.height);
  const background = saved.background;
  if (
    background.type !== "image" ||
    session.uploadedBackgrounds.some((record) => record.id === background.id)
  ) {
    session.setBackground(background);
  }
  session.setPadding(saved.padding);
  session.setScale(saved.scale);
  session.setPosition(saved.position.x, saved.position.y);
  session.setShadow(saved.shadow);
  session.setBorder(saved.border);
  session.setRadius(saved.radius);
  session.setBrowserWindow(saved.browserWindow);
  session.setUrl(saved.url);
}
