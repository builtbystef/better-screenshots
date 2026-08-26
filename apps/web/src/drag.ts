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
