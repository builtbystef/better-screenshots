import type { Frame, Point } from "@/features/studio/composition/session";

export type Rect = Point & Frame;

export type Placement = {
  inner: Rect;
  fitted: Frame;
  drawn: Rect;
};

type PlacementComposition = Frame & {
  padding: number;
  scale: number;
  position: Point;
  browserWindow: "none" | "light" | "dark";
};

const BROWSER_WINDOW_BAR_RATIO = 0.055;

export function browserWindowHeight(width: number): number {
  return width * BROWSER_WINDOW_BAR_RATIO;
}

export function derivePlacement(composition: PlacementComposition, screenshot: Frame): Placement {
  const padding = Math.min(
    composition.padding,
    (Math.min(composition.width, composition.height) - 1) / 2,
  );
  const inner = {
    x: padding,
    y: padding,
    width: composition.width - 2 * padding,
    height: composition.height - 2 * padding,
  };
  const objectWidth = screenshot.width;
  const objectHeight =
    screenshot.height +
    (composition.browserWindow === "none" ? 0 : browserWindowHeight(screenshot.width));
  const fitScale = Math.min(inner.width / objectWidth, inner.height / objectHeight);
  const fitted = { width: objectWidth * fitScale, height: objectHeight * fitScale };
  const drawnWidth = fitted.width * composition.scale;
  const drawnHeight = fitted.height * composition.scale;
  const centerX = composition.width / 2 + composition.position.x;
  const centerY = composition.height / 2 + composition.position.y;
  return {
    inner,
    fitted,
    drawn: {
      x: centerX - drawnWidth / 2,
      y: centerY - drawnHeight / 2,
      width: drawnWidth,
      height: drawnHeight,
    },
  };
}

// The Auto frame's longest edge. A retina screenshot would otherwise derive a
// Frame larger than any preset, and the Export doubles it again.
const AUTO_FRAME_MAX_EDGE = 1920;

type AutoFrameComposition = {
  padding: number;
  browserWindow: "none" | "light" | "dark";
};

// The Frame that holds the Screenshot at its own size with the current Padding
// on every side: `derivePlacement` then fits it at Scale 1 with no empty band
// on any edge. Shrunk to keep the longest edge within AUTO_FRAME_MAX_EDGE.
export function deriveAutoFrame(composition: AutoFrameComposition, screenshot: Frame): Frame {
  const objectHeight =
    screenshot.height +
    (composition.browserWindow === "none" ? 0 : browserWindowHeight(screenshot.width));
  const padding = Math.max(0, composition.padding);
  const width = screenshot.width + 2 * padding;
  const height = objectHeight + 2 * padding;
  const longest = Math.max(width, height);
  const shrink = longest > AUTO_FRAME_MAX_EDGE ? AUTO_FRAME_MAX_EDGE / longest : 1;
  return {
    width: Math.max(1, Math.round(width * shrink)),
    height: Math.max(1, Math.round(height * shrink)),
  };
}

export function gradientLine(
  width: number,
  height: number,
  angle: number,
): { start: Point; end: Point } {
  const theta = (angle * Math.PI) / 180;
  const length = Math.abs(width * Math.sin(theta)) + Math.abs(height * Math.cos(theta));
  const dx = Math.sin(theta);
  const dy = -Math.cos(theta);
  const centerX = width / 2;
  const centerY = height / 2;
  return {
    start: { x: centerX - (dx * length) / 2, y: centerY - (dy * length) / 2 },
    end: { x: centerX + (dx * length) / 2, y: centerY + (dy * length) / 2 },
  };
}
