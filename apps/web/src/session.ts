import { renderComposition } from "./paint";
import { derivePlacement, type Placement, type Size } from "./placement";

export type { Placement, Rect } from "./placement";

export type Refuse = "refuse";

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

export type BrowserWindow = "none" | "light" | "dark";

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

export type UploadRefuse = "undecodable" | "quota" | "unavailable";

export type StudioSession = {
  readonly composition: Composition;
  readonly version: number;
  subscribe: (listener: () => void) => () => void;
  readonly uploadedBackgrounds: readonly UploadedBackground[];
  readonly placement: Placement | null;
  readonly storage: "ok" | "unavailable";
  placeScreenshot(sources: readonly Blob[]): Promise<"ok" | Refuse>;
  setBackground(background: Background): "ok" | Refuse;
  uploadBackground(file: Blob, filename: string): Promise<UploadedBackground | UploadRefuse>;
  removeBackground(id: string): Promise<"ok" | Refuse>;
  setSize(width: number, height: number): "ok" | Refuse;
  setBrowserWindow(value: BrowserWindow): "ok" | Refuse;
  setUrl(url: string): "ok";
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
  createCanvas?: () => HTMLCanvasElement;
}): Promise<StudioSession> {
  const createCanvas = options.createCanvas ?? (() => document.createElement("canvas"));
  const listed = await options.store.list();
  const storeUnavailable = listed === "unavailable";
  let storage: "ok" | "unavailable" = storeUnavailable ? "unavailable" : "ok";
  let uploadedBackgrounds: UploadedBackground[] = storeUnavailable ? [] : [...listed];
  let screenshotSize: Size | null = null;
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
    for (const listener of [...listeners]) {
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
        storeUnavailable ||
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
      if (value !== "none" && value !== "light" && value !== "dark") {
        return "refuse";
      }
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
      commit({ ...composition, shadow: { offset, blur, opacity } });
      return "ok";
    },
    setBorder(width, color) {
      if (!Number.isFinite(width) || width < 0 || !isHexColor(color)) {
        return "refuse";
      }
      commit({ ...composition, border: { width, color } });
      return "ok";
    },
    setRadius(value) {
      if (!Number.isFinite(value) || value < 0) {
        return "refuse";
      }
      commit({ ...composition, radius: value });
      return "ok";
    },
    render: () =>
      renderComposition(composition, screenshotSize, {
        defaultSolid: options.defaultSolid,
        store: options.store,
        createCanvas,
      }),
    async exportPng(now) {
      if (composition.screenshot === null) {
        return "refuse";
      }
      const canvas = await renderComposition(composition, screenshotSize, {
        defaultSolid: options.defaultSolid,
        store: options.store,
        createCanvas,
      });
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
