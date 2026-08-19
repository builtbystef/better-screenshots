export type HexColor = string;

export type SolidBackground = { type: "solid"; color: HexColor };

export type GradientStop = { offset: number; color: HexColor };

export type GradientBackground = {
  type: "gradient";
  angle: number;
  stops: GradientStop[];
};

export type ImageBackground = { type: "image"; id: string };

export type Background = SolidBackground | GradientBackground | ImageBackground;

export type Composition = {
  width: number;
  height: number;
  background: Background;
  screenshot: Blob | null;
  padding: number;
  scale: number;
  position: { x: number; y: number };
  shadow: { offset: number; blur: number; opacity: number };
  border: { width: number; color: HexColor };
  radius: number;
};

export type UploadedBackground = {
  id: string;
  filename: string;
  addedAt: Date;
  width: number;
  height: number;
  byteLength: number;
  blob: Blob;
};

export type UploadedBackgroundStore = {
  list(): Promise<UploadedBackground[] | "unavailable">;
  put(record: UploadedBackground): Promise<"ok" | "quota" | "unavailable">;
  get(id: string): Promise<UploadedBackground | undefined | "unavailable">;
  remove(id: string): Promise<"ok" | "unavailable">;
};

export type Rect = { x: number; y: number; width: number; height: number };

export type Placement = {
  inner: Rect;
  fitted: { width: number; height: number };
  drawn: Rect;
};

export type Refuse = "refuse";

type Size = { width: number; height: number };

async function decodeImageSize(blob: Blob): Promise<Size | null> {
  try {
    const bitmap = await createImageBitmap(blob);
    const { width, height } = bitmap;
    if (typeof bitmap.close === "function") {
      bitmap.close();
    }
    if (width === 0 || height === 0) {
      return null;
    }
    return { width, height };
  } catch {
    return null;
  }
}

function derivePlacement(composition: Composition, screenshot: Size): Placement {
  const p = Math.min(
    composition.padding,
    (Math.min(composition.width, composition.height) - 1) / 2,
  );
  const inner = {
    x: p,
    y: p,
    width: composition.width - 2 * p,
    height: composition.height - 2 * p,
  };
  const k = Math.min(inner.width / screenshot.width, inner.height / screenshot.height);
  const fitted = { width: screenshot.width * k, height: screenshot.height * k };
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

const PAINT_SCALE = 2;

function gradientLine(
  width: number,
  height: number,
  angle: number,
): { start: { x: number; y: number }; end: { x: number; y: number } } {
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

async function paintBackground(
  ctx: CanvasRenderingContext2D,
  composition: Composition,
  options: { defaultSolid: SolidBackground; store: UploadedBackgroundStore },
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
      const k = Math.max(composition.width / bitmap.width, composition.height / bitmap.height);
      const drawnWidth = bitmap.width * k;
      const drawnHeight = bitmap.height * k;
      const x = ((composition.width - drawnWidth) / 2) * PAINT_SCALE;
      const y = ((composition.height - drawnHeight) / 2) * PAINT_SCALE;
      ctx.drawImage(bitmap, x, y, drawnWidth * PAINT_SCALE, drawnHeight * PAINT_SCALE);
      if (typeof bitmap.close === "function") {
        bitmap.close();
      }
    }
  }
}

function pathRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  ctx.roundRect(x, y, width, height, radius);
}

function paintShadow(
  ctx: CanvasRenderingContext2D,
  outer: Rect,
  outerRadius: number,
  shadow: { offset: number; blur: number; opacity: number },
): void {
  if (shadow.offset === 0 && shadow.blur === 0) {
    return;
  }
  const layer = document.createElement("canvas");
  layer.width = ctx.canvas.width;
  layer.height = ctx.canvas.height;
  const shadowCtx = layer.getContext("2d");
  if (shadowCtx === null) {
    return;
  }
  shadowCtx.shadowColor = `rgba(0,0,0,${String(shadow.opacity)})`;
  shadowCtx.shadowOffsetX = shadow.offset * PAINT_SCALE;
  shadowCtx.shadowOffsetY = shadow.offset * PAINT_SCALE;
  shadowCtx.shadowBlur = shadow.blur * PAINT_SCALE;
  shadowCtx.fillStyle = "#000000";
  shadowCtx.beginPath();
  pathRoundedRect(
    shadowCtx,
    outer.x * PAINT_SCALE,
    outer.y * PAINT_SCALE,
    outer.width * PAINT_SCALE,
    outer.height * PAINT_SCALE,
    outerRadius * PAINT_SCALE,
  );
  shadowCtx.fill();
  shadowCtx.shadowColor = "rgba(0,0,0,0)";
  shadowCtx.shadowOffsetX = 0;
  shadowCtx.shadowOffsetY = 0;
  shadowCtx.shadowBlur = 0;
  shadowCtx.globalCompositeOperation = "destination-out";
  shadowCtx.beginPath();
  pathRoundedRect(
    shadowCtx,
    outer.x * PAINT_SCALE,
    outer.y * PAINT_SCALE,
    outer.width * PAINT_SCALE,
    outer.height * PAINT_SCALE,
    outerRadius * PAINT_SCALE,
  );
  shadowCtx.fill();
  ctx.drawImage(layer, 0, 0);
}

async function paintScreenshot(
  ctx: CanvasRenderingContext2D,
  composition: Composition,
  placement: Placement,
  screenshot: Blob,
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
  paintShadow(ctx, outer, outerRadius, composition.shadow);
  if (borderWidth > 0) {
    ctx.save();
    ctx.fillStyle = composition.border.color;
    ctx.beginPath();
    pathRoundedRect(
      ctx,
      outer.x * PAINT_SCALE,
      outer.y * PAINT_SCALE,
      outer.width * PAINT_SCALE,
      outer.height * PAINT_SCALE,
      outerRadius * PAINT_SCALE,
    );
    pathRoundedRect(
      ctx,
      drawn.x * PAINT_SCALE,
      drawn.y * PAINT_SCALE,
      drawn.width * PAINT_SCALE,
      drawn.height * PAINT_SCALE,
      composition.radius * PAINT_SCALE,
    );
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
  pathRoundedRect(
    ctx,
    drawn.x * PAINT_SCALE,
    drawn.y * PAINT_SCALE,
    drawn.width * PAINT_SCALE,
    drawn.height * PAINT_SCALE,
    composition.radius * PAINT_SCALE,
  );
  ctx.clip();
  ctx.drawImage(
    bitmap,
    drawn.x * PAINT_SCALE,
    drawn.y * PAINT_SCALE,
    drawn.width * PAINT_SCALE,
    drawn.height * PAINT_SCALE,
  );
  ctx.restore();
  if (typeof bitmap.close === "function") {
    bitmap.close();
  }
}

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

function isHexColor(value: string): boolean {
  return HEX_COLOR.test(value);
}

function isUsableBackground(background: Background): boolean {
  switch (background.type) {
    case "solid":
      return isHexColor(background.color);
    case "gradient":
      return (
        Number.isFinite(background.angle) &&
        background.stops.length >= 2 &&
        background.stops.every(
          (stop) =>
            Number.isFinite(stop.offset) &&
            stop.offset >= 0 &&
            stop.offset <= 1 &&
            isHexColor(stop.color),
        )
      );
    case "image":
      return background.id !== "";
  }
}

export type StudioSession = {
  readonly composition: Composition;
  readonly uploadedBackgrounds: readonly UploadedBackground[];
  readonly placement: Placement | null;
  placeScreenshot(sources: readonly Blob[]): Promise<"ok" | Refuse>;
  setBackground(background: Background): "ok" | Refuse;
  uploadBackground(file: Blob, filename: string): Promise<UploadedBackground | Refuse>;
  removeBackground(id: string): Promise<"ok" | Refuse>;
  setPadding(value: number): "ok" | Refuse;
  setScale(value: number): "ok" | Refuse;
  setPosition(x: number, y: number): "ok" | Refuse;
  setShadow(offset: number, blur: number, opacity: number): "ok" | Refuse;
  setBorder(width: number, color: HexColor): "ok" | Refuse;
  setRadius(value: number): "ok" | Refuse;
  render(): Promise<HTMLCanvasElement>;
  exportPng(now: Date): Promise<{ blob: Blob; filename: string } | Refuse>;
};

export async function createSession(options: {
  defaultSolid: SolidBackground;
  store: UploadedBackgroundStore;
}): Promise<StudioSession> {
  const listed = await options.store.list();
  const storeUnavailable = listed === "unavailable";
  let uploadedBackgrounds: UploadedBackground[] = storeUnavailable ? [] : [...listed];
  let screenshotSize: Size | null = null;
  let composition: Composition = {
    width: 1920,
    height: 1080,
    background: options.defaultSolid,
    screenshot: null,
    padding: 120,
    scale: 1,
    position: { x: 0, y: 0 },
    shadow: { offset: 16, blur: 32, opacity: 0.25 },
    border: { width: 0, color: "#FFFFFF" },
    radius: 16,
  };
  async function renderComposition(): Promise<HTMLCanvasElement> {
    const canvas = document.createElement("canvas");
    canvas.width = composition.width * 2;
    canvas.height = composition.height * 2;
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
      );
    }
    ctx.restore();
    return canvas;
  }
  return {
    get composition() {
      return composition;
    },
    get uploadedBackgrounds() {
      return uploadedBackgrounds;
    },
    get placement() {
      return screenshotSize === null ? null : derivePlacement(composition, screenshotSize);
    },
    async placeScreenshot(sources) {
      for (const blob of sources) {
        const size = await decodeImageSize(blob);
        if (size === null) {
          continue;
        }
        composition = { ...composition, screenshot: blob };
        screenshotSize = size;
        return "ok";
      }
      return "refuse";
    },
    setBackground(background) {
      if (!isUsableBackground(background)) {
        return "refuse";
      }
      composition = { ...composition, background };
      return "ok";
    },
    async uploadBackground(file, filename) {
      if (storeUnavailable) {
        return "refuse";
      }
      const size = await decodeImageSize(file);
      if (size === null) {
        return "refuse";
      }
      const record: UploadedBackground = {
        id: crypto.randomUUID(),
        filename,
        addedAt: new Date(),
        width: size.width,
        height: size.height,
        byteLength: file.size,
        blob: file,
      };
      if ((await options.store.put(record)) !== "ok") {
        return "refuse";
      }
      uploadedBackgrounds = [...uploadedBackgrounds, record];
      return record;
    },
    async removeBackground(id) {
      if (
        storeUnavailable ||
        (composition.background.type === "image" && composition.background.id === id)
      ) {
        return "refuse";
      }
      if ((await options.store.remove(id)) !== "ok") {
        return "refuse";
      }
      uploadedBackgrounds = uploadedBackgrounds.filter((record) => record.id !== id);
      return "ok";
    },
    setPadding(value) {
      if (!Number.isFinite(value) || value < 0) {
        return "refuse";
      }
      composition = { ...composition, padding: value };
      return "ok";
    },
    setScale(value) {
      if (!Number.isFinite(value) || value <= 0) {
        return "refuse";
      }
      composition = { ...composition, scale: value };
      return "ok";
    },
    setPosition(x, y) {
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        return "refuse";
      }
      composition = { ...composition, position: { x, y } };
      return "ok";
    },
    setShadow(offset, blur, opacity) {
      if (
        !Number.isFinite(offset) ||
        !Number.isFinite(blur) ||
        !Number.isFinite(opacity) ||
        offset < 0 ||
        blur < 0 ||
        opacity < 0 ||
        opacity > 1
      ) {
        return "refuse";
      }
      composition = { ...composition, shadow: { offset, blur, opacity } };
      return "ok";
    },
    setBorder(width, color) {
      if (!Number.isFinite(width) || width < 0 || !isHexColor(color)) {
        return "refuse";
      }
      composition = { ...composition, border: { width, color } };
      return "ok";
    },
    setRadius(value) {
      if (!Number.isFinite(value) || value < 0) {
        return "refuse";
      }
      composition = { ...composition, radius: value };
      return "ok";
    },
    render: renderComposition,
    async exportPng(now) {
      if (composition.screenshot === null) {
        return "refuse";
      }
      const canvas = await renderComposition();
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/png");
      });
      if (blob === null) {
        return "refuse";
      }
      const year = String(now.getFullYear());
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      return {
        blob,
        filename: `better-screenshots-${year}-${month}-${day}T${hours}${minutes}${seconds}.png`,
      };
    },
  };
}
