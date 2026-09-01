import { createPainter, PAINT_SCALE } from "@/features/studio/platform/paint";
import {
  deriveAutoFrame,
  derivePlacement,
  type Placement,
} from "@/features/studio/composition/placement";

export type { Placement, Rect } from "@/features/studio/composition/placement";

export type Point = { x: number; y: number };

export type Frame = { width: number; height: number };

async function decodeImageSize(blob: Blob): Promise<Frame | null> {
  try {
    const bitmap = await createImageBitmap(blob);
    const { width, height } = bitmap;
    bitmap.close();
    if (width === 0 || height === 0) {
      return null;
    }
    return { width, height };
  } catch {
    return null;
  }
}

export type HexColor = `#${string}`;

export type SolidBackground = { type: "solid"; color: HexColor };

export type GradientStop = { offset: number; color: HexColor };

export type GradientBackground = {
  type: "gradient";
  angle: number;
  stops: GradientStop[];
};

export type ImageBackground = { type: "image"; id: string };

export type Background = SolidBackground | GradientBackground | ImageBackground;

export type BrowserWindow = "none" | "light" | "dark";

export type Shadow = { offset: number; blur: number; opacity: number };

export type Border = { width: number; color: HexColor };

export type Composition = Frame & {
  background: Background;
  screenshot: Blob | null;
  padding: number;
  scale: number;
  position: Point;
  shadow: Shadow;
  border: Border;
  radius: number;
  browserWindow: BrowserWindow;
  url: string;
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

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

function isHexColor(value: string): value is HexColor {
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

export type UploadRefuse = "undecodable" | "quota" | "unavailable";

export type StudioSession = {
  readonly composition: Composition;
  readonly version: number;
  subscribe: (listener: () => void) => () => void;
  readonly uploadedBackgrounds: readonly UploadedBackground[];
  readonly placement: Placement | null;
  // The Frame the Auto chip would write, or null with no Screenshot to measure.
  readonly autoFrame: Frame | null;
  readonly storage: "ok" | "unavailable";
  placeScreenshot(sources: readonly Blob[]): Promise<"ok" | "refuse">;
  setBackground(background: Background): "ok" | "refuse";
  uploadBackground(file: Blob, filename: string): Promise<UploadedBackground | UploadRefuse>;
  removeBackground(id: string): Promise<"ok" | "refuse">;
  setSize(width: number, height: number): "ok" | "refuse";
  setBrowserWindow(value: BrowserWindow): "ok" | "refuse";
  setUrl(url: string): "ok";
  setPadding(value: number): "ok" | "refuse";
  setScale(value: number): "ok" | "refuse";
  setPosition(x: number, y: number): "ok" | "refuse";
  setShadow(patch: Partial<Shadow>): "ok" | "refuse";
  setBorder(patch: Partial<Border>): "ok" | "refuse";
  setRadius(value: number): "ok" | "refuse";
  render(request?: { scale?: number; canvas?: HTMLCanvasElement }): Promise<HTMLCanvasElement>;
  exportPng(now: Date): Promise<{ blob: Blob; filename: string } | "refuse">;
};

// The Preview asks for the scale that fills its box; anything unusable falls
// back to the Export's scale, which is also the cap.
function usableScale(scale: number | undefined): number {
  if (scale === undefined || !Number.isFinite(scale) || scale <= 0) {
    return PAINT_SCALE;
  }
  return Math.min(scale, PAINT_SCALE);
}

export async function createSession(options: {
  defaultSolid: SolidBackground;
  store: UploadedBackgroundStore;
  createCanvas?: () => HTMLCanvasElement;
}): Promise<StudioSession> {
  const createCanvas = options.createCanvas ?? (() => document.createElement("canvas"));
  const paint = createPainter({
    defaultSolid: options.defaultSolid,
    store: options.store,
    createCanvas,
  });
  const listed = await options.store.list();
  let storage: "ok" | "unavailable" = listed === "unavailable" ? "unavailable" : "ok";
  let uploadedBackgrounds: UploadedBackground[] = listed === "unavailable" ? [] : [...listed];
  let screenshotSize: Frame | null = null;
  let version = 0;
  const listeners = new Set<() => void>();
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
    browserWindow: "none",
    url: "",
  };
  function commit(next: Composition): void {
    composition = next;
    version += 1;
    for (const listener of Array.from(listeners)) {
      listener();
    }
  }
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };
  return {
    get composition() {
      return composition;
    },
    get version() {
      return version;
    },
    subscribe,
    get uploadedBackgrounds() {
      return uploadedBackgrounds;
    },
    get storage() {
      return storage;
    },
    get placement() {
      return screenshotSize === null ? null : derivePlacement(composition, screenshotSize);
    },
    get autoFrame() {
      return screenshotSize === null ? null : deriveAutoFrame(composition, screenshotSize);
    },
    async placeScreenshot(sources) {
      for (const blob of sources) {
        const size = await decodeImageSize(blob);
        if (size === null) {
          continue;
        }
        screenshotSize = size;
        commit({ ...composition, screenshot: blob });
        return "ok";
      }
      return "refuse";
    },
    setBackground(background) {
      if (!isUsableBackground(background)) {
        return "refuse";
      }
      commit({ ...composition, background });
      return "ok";
    },
    async uploadBackground(file, filename) {
      if (storage === "unavailable") {
        return "unavailable";
      }
      const size = await decodeImageSize(file);
      if (size === null) {
        return "undecodable";
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
      const put = await options.store.put(record);
      if (put === "quota") {
        return "quota";
      }
      if (put === "unavailable") {
        storage = "unavailable";
        commit(composition);
        return "unavailable";
      }
      uploadedBackgrounds = [...uploadedBackgrounds, record];
      commit(composition);
      return record;
    },
    async removeBackground(id) {
      if (
        storage === "unavailable" ||
        (composition.background.type === "image" && composition.background.id === id)
      ) {
        return "refuse";
      }
      const removed = await options.store.remove(id);
      if (removed === "unavailable") {
        storage = "unavailable";
        commit(composition);
        return "refuse";
      }
      uploadedBackgrounds = uploadedBackgrounds.filter((record) => record.id !== id);
      commit(composition);
      return "ok";
    },
    setSize(width, height) {
      if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
        return "refuse";
      }
      commit({ ...composition, width, height });
      return "ok";
    },
    setBrowserWindow(value) {
      commit({ ...composition, browserWindow: value });
      return "ok";
    },
    setUrl(url) {
      commit({ ...composition, url });
      return "ok";
    },
    setPadding(value) {
      if (!Number.isFinite(value) || value < 0) {
        return "refuse";
      }
      commit({ ...composition, padding: value });
      return "ok";
    },
    setScale(value) {
      if (!Number.isFinite(value) || value <= 0) {
        return "refuse";
      }
      commit({ ...composition, scale: value });
      return "ok";
    },
    setPosition(x, y) {
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        return "refuse";
      }
      commit({ ...composition, position: { x, y } });
      return "ok";
    },
    setShadow(patch) {
      const shadow = { ...composition.shadow, ...patch };
      if (
        !Number.isFinite(shadow.offset) ||
        !Number.isFinite(shadow.blur) ||
        !Number.isFinite(shadow.opacity) ||
        shadow.offset < 0 ||
        shadow.blur < 0 ||
        shadow.opacity < 0 ||
        shadow.opacity > 1
      ) {
        return "refuse";
      }
      commit({ ...composition, shadow });
      return "ok";
    },
    setBorder(patch) {
      const border = { ...composition.border, ...patch };
      if (!Number.isFinite(border.width) || border.width < 0 || !isHexColor(border.color)) {
        return "refuse";
      }
      commit({ ...composition, border });
      return "ok";
    },
    setRadius(value) {
      if (!Number.isFinite(value) || value < 0) {
        return "refuse";
      }
      commit({ ...composition, radius: value });
      return "ok";
    },
    render: (request) =>
      paint(composition, screenshotSize, {
        scale: usableScale(request?.scale),
        canvas: request?.canvas,
      }),
    async exportPng(now) {
      if (composition.screenshot === null) {
        return "refuse";
      }
      const canvas = await paint(composition, screenshotSize, { scale: PAINT_SCALE });
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
