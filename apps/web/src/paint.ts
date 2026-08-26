import {
  browserWindowHeight,
  derivePlacement,
  gradientLine,
  type Placement,
  type Rect,
  type Size,
} from "./placement";
import type { Composition, HexColor, SolidBackground, UploadedBackgroundStore } from "./session";

const PAINT_SCALE = 2;

type PaintOptions = {
  defaultSolid: SolidBackground;
  store: UploadedBackgroundStore;
  createCanvas: () => HTMLCanvasElement;
};

export async function paintBackground(
  ctx: CanvasRenderingContext2D,
  composition: Composition,
  options: Pick<PaintOptions, "defaultSolid" | "store">,
): Promise<void> {
  const width = composition.width * PAINT_SCALE;
  const height = composition.height * PAINT_SCALE;
  const fillSolid = (color: HexColor) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
  };
  switch (composition.background.type) {
    case "solid":
      fillSolid(composition.background.color);
      return;
    case "gradient": {
      const { start, end } = gradientLine(
        composition.width,
        composition.height,
        composition.background.angle,
      );
      const gradient = ctx.createLinearGradient(
        start.x * PAINT_SCALE,
        start.y * PAINT_SCALE,
        end.x * PAINT_SCALE,
        end.y * PAINT_SCALE,
      );
      for (const stop of composition.background.stops) {
        gradient.addColorStop(stop.offset, stop.color);
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      return;
    }
    case "image": {
      const record = await options.store.get(composition.background.id);
      if (record === undefined || record === "unavailable") {
        fillSolid(options.defaultSolid.color);
        return;
      }
      let bitmap: ImageBitmap;
      try {
        bitmap = await createImageBitmap(record.blob);
      } catch {
        fillSolid(options.defaultSolid.color);
        return;
      }
      const fitScale = Math.max(
        composition.width / bitmap.width,
        composition.height / bitmap.height,
      );
      const drawnWidth = bitmap.width * fitScale;
      const drawnHeight = bitmap.height * fitScale;
      const x = ((composition.width - drawnWidth) / 2) * PAINT_SCALE;
      const y = ((composition.height - drawnHeight) / 2) * PAINT_SCALE;
      ctx.drawImage(bitmap, x, y, drawnWidth * PAINT_SCALE, drawnHeight * PAINT_SCALE);
      if (typeof bitmap.close === "function") {
        bitmap.close();
      }
    }
  }
}

function pathScaledRect(ctx: CanvasRenderingContext2D, rect: Rect, radius: number): void {
  ctx.roundRect(
    rect.x * PAINT_SCALE,
    rect.y * PAINT_SCALE,
    rect.width * PAINT_SCALE,
    rect.height * PAINT_SCALE,
    radius * PAINT_SCALE,
  );
}

export function paintShadow(
  ctx: CanvasRenderingContext2D,
  outer: Rect,
  outerRadius: number,
  shadow: { offset: number; blur: number; opacity: number },
  createCanvas: () => HTMLCanvasElement,
): void {
  if (shadow.offset === 0 && shadow.blur === 0) {
    return;
  }
  const layer = createCanvas();
  layer.width = ctx.canvas.width;
  layer.height = ctx.canvas.height;
  const shadowContext = layer.getContext("2d");
  if (shadowContext === null) {
    return;
  }
  shadowContext.shadowColor = `rgba(0,0,0,${String(shadow.opacity)})`;
  shadowContext.shadowOffsetX = shadow.offset * PAINT_SCALE;
  shadowContext.shadowOffsetY = shadow.offset * PAINT_SCALE;
  shadowContext.shadowBlur = shadow.blur * PAINT_SCALE;
  shadowContext.fillStyle = "#000000";
  shadowContext.beginPath();
  pathScaledRect(shadowContext, outer, outerRadius);
  shadowContext.fill();
  shadowContext.shadowColor = "rgba(0,0,0,0)";
  shadowContext.shadowOffsetX = 0;
  shadowContext.shadowOffsetY = 0;
  shadowContext.shadowBlur = 0;
  shadowContext.globalCompositeOperation = "destination-out";
  shadowContext.beginPath();
  pathScaledRect(shadowContext, outer, outerRadius);
  shadowContext.fill();
  ctx.drawImage(layer, 0, 0);
}

const WINDOW_THEME = {
  light: { bar: "#F1F3F4", pill: "#FFFFFF", text: "#202124", hairline: "#E1E3E4" },
  dark: { bar: "#202124", pill: "#303134", text: "#E8EAED", hairline: "#3C4043" },
} as const;

const TRAFFIC_LIGHTS = ["#FF5F57", "#FEBC2E", "#28C840"] as const;

export function paintBrowserWindow(
  ctx: CanvasRenderingContext2D,
  drawn: Rect,
  scheme: "light" | "dark",
  url: string,
): number {
  const theme = WINDOW_THEME[scheme];
  const barHeight = browserWindowHeight(drawn.width);
  ctx.fillStyle = theme.bar;
  ctx.fillRect(
    drawn.x * PAINT_SCALE,
    drawn.y * PAINT_SCALE,
    drawn.width * PAINT_SCALE,
    barHeight * PAINT_SCALE,
  );
  ctx.fillStyle = theme.hairline;
  ctx.fillRect(
    drawn.x * PAINT_SCALE,
    (drawn.y + barHeight) * PAINT_SCALE - 1,
    drawn.width * PAINT_SCALE,
    1,
  );
  const lightDiameter = barHeight * 0.32;
  const lightRadius = lightDiameter / 2;
  const gap = lightDiameter * 0.65;
  const inset = barHeight * 0.4;
  const lightsLeft = drawn.x + inset;
  const centerY = drawn.y + barHeight / 2;
  for (const [index, color] of TRAFFIC_LIGHTS.entries()) {
    const centerX = lightsLeft + lightRadius + index * (lightDiameter + gap);
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(
      centerX * PAINT_SCALE,
      centerY * PAINT_SCALE,
      lightRadius * PAINT_SCALE,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  const lightsRight = lightsLeft + 3 * lightDiameter + 2 * gap;
  const pillLeft = lightsRight + inset;
  const pillRight = drawn.x + drawn.width - inset;
  const pillWidth = pillRight - pillLeft;
  const pillHeight = barHeight * 0.52;
  const pillY = drawn.y + (barHeight - pillHeight) / 2;
  if (pillWidth > 0) {
    const pill = { x: pillLeft, y: pillY, width: pillWidth, height: pillHeight };
    ctx.fillStyle = theme.pill;
    ctx.beginPath();
    pathScaledRect(ctx, pill, pillHeight / 2);
    ctx.fill();
    if (url !== "") {
      ctx.save();
      ctx.beginPath();
      pathScaledRect(ctx, pill, pillHeight / 2);
      ctx.clip();
      ctx.fillStyle = theme.text;
      ctx.font = `${String(pillHeight * 0.55 * PAINT_SCALE)}px system-ui`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.fillText(
        url,
        (pillLeft + pillHeight * 0.4) * PAINT_SCALE,
        (pillY + pillHeight / 2) * PAINT_SCALE,
      );
      ctx.restore();
    }
  }
  return barHeight;
}

export async function paintScreenshot(
  ctx: CanvasRenderingContext2D,
  composition: Composition,
  placement: Placement,
  screenshot: Blob,
  createCanvas: () => HTMLCanvasElement,
): Promise<void> {
  const { drawn } = placement;
  const borderWidth = composition.border.width;
  const outer = {
    x: drawn.x - borderWidth,
    y: drawn.y - borderWidth,
    width: drawn.width + 2 * borderWidth,
    height: drawn.height + 2 * borderWidth,
  };
  const outerRadius = composition.radius + borderWidth;
  paintShadow(ctx, outer, outerRadius, composition.shadow, createCanvas);
  if (borderWidth > 0) {
    ctx.save();
    ctx.fillStyle = composition.border.color;
    ctx.beginPath();
    pathScaledRect(ctx, outer, outerRadius);
    pathScaledRect(ctx, drawn, composition.radius);
    ctx.fill("evenodd");
    ctx.restore();
  }
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(screenshot);
  } catch {
    return;
  }
  ctx.save();
  ctx.beginPath();
  pathScaledRect(ctx, drawn, composition.radius);
  ctx.clip();
  let screenshotY = drawn.y;
  let screenshotHeight = drawn.height;
  if (composition.browserWindow !== "none") {
    const barHeight = paintBrowserWindow(ctx, drawn, composition.browserWindow, composition.url);
    screenshotY = drawn.y + barHeight;
    screenshotHeight = drawn.height - barHeight;
  }
  ctx.drawImage(
    bitmap,
    drawn.x * PAINT_SCALE,
    screenshotY * PAINT_SCALE,
    drawn.width * PAINT_SCALE,
    screenshotHeight * PAINT_SCALE,
  );
  ctx.restore();
  if (typeof bitmap.close === "function") {
    bitmap.close();
  }
}

export async function renderComposition(
  composition: Composition,
  screenshotSize: Size | null,
  options: PaintOptions,
): Promise<HTMLCanvasElement> {
  const canvas = options.createCanvas();
  canvas.width = composition.width * PAINT_SCALE;
  canvas.height = composition.height * PAINT_SCALE;
  const ctx = canvas.getContext("2d");
  if (ctx === null) {
    return canvas;
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, canvas.width, canvas.height);
  ctx.clip();
  await paintBackground(ctx, composition, options);
  if (composition.screenshot !== null && screenshotSize !== null) {
    await paintScreenshot(
      ctx,
      composition,
      derivePlacement(composition, screenshotSize),
      composition.screenshot,
      options.createCanvas,
    );
  }
  ctx.restore();
  return canvas;
}
