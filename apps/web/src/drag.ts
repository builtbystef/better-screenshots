import type { Point, Rect } from "./session";

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

export function filesFrom(
  data: {
    files: ArrayLike<File>;
    items: Iterable<{ kind: string; type?: string; getAsFile: () => File | null }>;
  } | null,
): File[] {
  if (data === null) {
    return [];
  }
  if (data.files.length > 0) {
    return Array.from(data.files);
  }
  const files: File[] = [];
  for (const item of data.items) {
    if (item.kind !== "file") {
      continue;
    }
    const file = item.getAsFile();
    if (file !== null) {
      files.push(file);
    }
  }
  return files;
}

export function hitsDrawn(input: {
  point: Point;
  rect: { left: number; top: number; clientWidth: number; clientLeft: number; clientTop: number };
  drawn: Rect;
  compositionWidth: number;
}): boolean {
  const scale = input.rect.clientWidth / input.compositionWidth;
  const left = input.rect.left + input.rect.clientLeft + input.drawn.x * scale;
  const top = input.rect.top + input.rect.clientTop + input.drawn.y * scale;
  return (
    input.point.x >= left &&
    input.point.x < left + input.drawn.width * scale &&
    input.point.y >= top &&
    input.point.y < top + input.drawn.height * scale
  );
}

export function positionFromDrag(input: {
  origin: Point;
  start: Point;
  current: Point;
  previewWidth: number;
  compositionWidth: number;
}): Point {
  const scale = input.compositionWidth / input.previewWidth;
  return {
    x: input.origin.x + Math.round((input.current.x - input.start.x) * scale),
    y: input.origin.y + Math.round((input.current.y - input.start.y) * scale),
  };
}
