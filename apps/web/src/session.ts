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
  setPadding(value: number): "ok" | Refuse;
  setScale(value: number): "ok" | Refuse;
  setPosition(x: number, y: number): "ok" | Refuse;
  setShadow(offset: number, blur: number, opacity: number): "ok" | Refuse;
  setBorder(width: number, color: HexColor): "ok" | Refuse;
  setRadius(value: number): "ok" | Refuse;
};

export async function createSession(options: {
  defaultSolid: SolidBackground;
  store: UploadedBackgroundStore;
}): Promise<StudioSession> {
  const listed = await options.store.list();
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
  return {
    get composition() {
      return composition;
    },
    uploadedBackgrounds: listed === "unavailable" ? [] : listed,
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
  };
}
