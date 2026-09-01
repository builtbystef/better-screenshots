import {
  browserWindowHeight,
  derivePlacement,
  gradientLine,
  type Placement,
  type Rect,
} from "@/features/studio/composition/placement";
import type {
  Composition,
  Frame,
  HexColor,
  Shadow,
  SolidBackground,
  UploadedBackgroundStore,
} from "@/features/studio/composition/session";

// The Export always draws at twice the Frame dimensions. The Preview runs the
// same passes at whatever scale fills its box, capped here so it never spends
// more pixels than the Export would.
export const PAINT_SCALE = 2;

type PainterOptions = {
  defaultSolid: SolidBackground;
  store: UploadedBackgroundStore;
  createCanvas: () => HTMLCanvasElement;
};

export type PaintRequest = {
  scale: number;
  canvas?: HTMLCanvasElement | undefined;
};

export type Painter = (
  composition: Composition,
  screenshotSize: Frame | null,
  request: PaintRequest,
) => Promise<HTMLCanvasElement>;

async function paintBackground(
  ctx: CanvasRenderingContext2D,
  composition: Composition,
  scale: number,
  fallbackSolid: SolidBackground,
  bitmapFor: (id: string) => Promise<ImageBitmap | null>,
): Promise<void> {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
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
        start.x * scale,
        start.y * scale,
        end.x * scale,
        end.y * scale,
      );
      for (const stop of composition.background.stops) {
        gradient.addColorStop(stop.offset, stop.color);
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      return;
    }
    case "image": {
      const bitmap = await bitmapFor(composition.background.id);
      if (bitmap === null) {
        fillSolid(fallbackSolid.color);
        return;
      }
      const fitScale = Math.max(
        composition.width / bitmap.width,
        composition.height / bitmap.height,
      );
      const drawnWidth = bitmap.width * fitScale;
      const drawnHeight = bitmap.height * fitScale;
      const x = ((composition.width - drawnWidth) / 2) * scale;
      const y = ((composition.height - drawnHeight) / 2) * scale;
      ctx.drawImage(bitmap, x, y, drawnWidth * scale, drawnHeight * scale);
    }
  }
}

function pathScaledRect(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  radius: number,
  scale: number,
): void {
  ctx.roundRect(
    rect.x * scale,
    rect.y * scale,
    rect.width * scale,
    rect.height * scale,
    radius * scale,
  );
}

function paintShadow(
  ctx: CanvasRenderingContext2D,
  outer: Rect,
  outerRadius: number,
  shadow: Shadow,
  createCanvas: () => HTMLCanvasElement,
  scale: number,
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
  shadowContext.shadowOffsetX = shadow.offset * scale;
  shadowContext.shadowOffsetY = shadow.offset * scale;
  shadowContext.shadowBlur = shadow.blur * scale;
  shadowContext.fillStyle = "#000000";
  shadowContext.beginPath();
  pathScaledRect(shadowContext, outer, outerRadius, scale);
  shadowContext.fill();
  shadowContext.shadowColor = "rgba(0,0,0,0)";
  shadowContext.shadowOffsetX = 0;
  shadowContext.shadowOffsetY = 0;
  shadowContext.shadowBlur = 0;
  shadowContext.globalCompositeOperation = "destination-out";
  shadowContext.beginPath();
  pathScaledRect(shadowContext, outer, outerRadius, scale);
  shadowContext.fill();
  ctx.drawImage(layer, 0, 0);
}

export const BROWSER_WINDOW_THEME = {
  light: { bar: "#F1F3F4", pill: "#FFFFFF", text: "#202124", hairline: "#E1E3E4" },
  dark: { bar: "#202124", pill: "#303134", text: "#E8EAED", hairline: "#3C4043" },
} as const;

export const BROWSER_WINDOW_TRAFFIC_LIGHTS = ["#FF5F57", "#FEBC2E", "#28C840"] as const;

export function paintBrowserWindow(
  ctx: CanvasRenderingContext2D,
  drawn: Rect,
  scheme: "light" | "dark",
  url: string,
  scale: number,
): number {
  const theme = BROWSER_WINDOW_THEME[scheme];
  const barHeight = browserWindowHeight(drawn.width);
  ctx.fillStyle = theme.bar;
  ctx.fillRect(drawn.x * scale, drawn.y * scale, drawn.width * scale, barHeight * scale);
  ctx.fillStyle = theme.hairline;
  ctx.fillRect(drawn.x * scale, (drawn.y + barHeight) * scale - 1, drawn.width * scale, 1);
  const lightDiameter = barHeight * 0.32;
  const lightRadius = lightDiameter / 2;
  const gap = lightDiameter * 0.65;
  const inset = barHeight * 0.4;
  const lightsLeft = drawn.x + inset;
  const centerY = drawn.y + barHeight / 2;
  for (const [index, color] of BROWSER_WINDOW_TRAFFIC_LIGHTS.entries()) {
    const centerX = lightsLeft + lightRadius + index * (lightDiameter + gap);
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(centerX * scale, centerY * scale, lightRadius * scale, 0, Math.PI * 2);
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
    pathScaledRect(ctx, pill, pillHeight / 2, scale);
    ctx.fill();
    if (url !== "") {
      ctx.save();
      ctx.beginPath();
      pathScaledRect(ctx, pill, pillHeight / 2, scale);
      ctx.clip();
      ctx.fillStyle = theme.text;
      ctx.font = `${String(pillHeight * 0.55 * scale)}px system-ui`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.fillText(url, (pillLeft + pillHeight * 0.4) * scale, (pillY + pillHeight / 2) * scale);
      ctx.restore();
    }
  }
  return barHeight;
}

export function paintScreenshot(
  ctx: CanvasRenderingContext2D,
  composition: Composition,
  placement: Placement,
  bitmap: ImageBitmap,
  createCanvas: () => HTMLCanvasElement,
  scale: number,
): void {
  const { drawn } = placement;
  const borderWidth = composition.border.width;
  const outer = {
    x: drawn.x - borderWidth,
    y: drawn.y - borderWidth,
    width: drawn.width + 2 * borderWidth,
    height: drawn.height + 2 * borderWidth,
  };
  const outerRadius = composition.radius + borderWidth;
  paintShadow(ctx, outer, outerRadius, composition.shadow, createCanvas, scale);
  if (borderWidth > 0) {
    ctx.save();
    ctx.fillStyle = composition.border.color;
    ctx.beginPath();
    pathScaledRect(ctx, outer, outerRadius, scale);
    pathScaledRect(ctx, drawn, composition.radius, scale);
    ctx.fill("evenodd");
    ctx.restore();
  }
  ctx.save();
  ctx.beginPath();
  pathScaledRect(ctx, drawn, composition.radius, scale);
  ctx.clip();
  let screenshotY = drawn.y;
  let screenshotHeight = drawn.height;
  if (composition.browserWindow !== "none") {
    const barHeight = paintBrowserWindow(
      ctx,
      drawn,
      composition.browserWindow,
      composition.url,
      scale,
    );
    screenshotY = drawn.y + barHeight;
    screenshotHeight = drawn.height - barHeight;
  }
  ctx.drawImage(
    bitmap,
    drawn.x * scale,
    screenshotY * scale,
    drawn.width * scale,
    screenshotHeight * scale,
  );
  ctx.restore();
}

// The painter caches decoded bitmaps between paints, so a slider drag repaints
// without re-decoding the Screenshot or re-reading the Uploaded background.
// The WeakMap frees a Screenshot's bitmap when its Blob leaves the Composition.
export function createPainter(options: PainterOptions): Painter {
  const screenshotBitmaps = new WeakMap<Blob, ImageBitmap | "undecodable">();
  let backgroundBitmap: { id: string; bitmap: ImageBitmap } | null = null;

  async function screenshotBitmapFor(blob: Blob): Promise<ImageBitmap | null> {
    const cached = screenshotBitmaps.get(blob);
    if (cached !== undefined) {
      return cached === "undecodable" ? null : cached;
    }
    try {
      const bitmap = await createImageBitmap(blob);
      screenshotBitmaps.set(blob, bitmap);
      return bitmap;
    } catch {
      screenshotBitmaps.set(blob, "undecodable");
      return null;
    }
  }

  async function backgroundBitmapFor(id: string): Promise<ImageBitmap | null> {
    if (backgroundBitmap !== null && backgroundBitmap.id === id) {
      return backgroundBitmap.bitmap;
    }
    const record = await options.store.get(id);
    if (record === undefined || record === "unavailable") {
      return null;
    }
    try {
      const bitmap = await createImageBitmap(record.blob);
      backgroundBitmap = { id, bitmap };
      return bitmap;
    } catch {
      return null;
    }
  }

  return async (composition, screenshotSize, request) => {
    const canvas = request.canvas ?? options.createCanvas();
    canvas.width = Math.max(1, Math.round(composition.width * request.scale));
    canvas.height = Math.max(1, Math.round(composition.height * request.scale));
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
    await paintBackground(
      ctx,
      composition,
      request.scale,
      options.defaultSolid,
      backgroundBitmapFor,
    );
    if (composition.screenshot !== null && screenshotSize !== null) {
      const bitmap = await screenshotBitmapFor(composition.screenshot);
      if (bitmap !== null) {
        paintScreenshot(
          ctx,
          composition,
          derivePlacement(composition, screenshotSize),
          bitmap,
          options.createCanvas,
          request.scale,
        );
      }
    }
    ctx.restore();
    return canvas;
  };
}
