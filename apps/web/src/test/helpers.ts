import { createCanvas, loadImage } from "@napi-rs/canvas";
import type {
  Composition,
  Frame,
  SolidBackground,
  UploadRefuse,
  UploadedBackground,
  UploadedBackgroundStore,
} from "../session";

const imageSizes = new WeakMap<Blob, Frame>();

if (typeof globalThis.createImageBitmap !== "function") {
  globalThis.createImageBitmap = (async (image: ImageBitmapSource) => {
    if (!(image instanceof Blob)) throw new TypeError("expected Blob");
    const size = imageSizes.get(image);
    if (size !== undefined) return { ...size, close() {} } as ImageBitmap;

    return Object.assign(await loadImage(await image.arrayBuffer()), { close() {} });
  }) as unknown as typeof createImageBitmap;
}

export function imageBlob(width: number, height: number): Blob {
  const blob = new Blob([new Uint8Array([width, height])], { type: "image/png" });
  imageSizes.set(blob, { width, height });
  return blob;
}

export function pngBlob(
  width: number,
  height: number,
  paint?: (ctx: ReturnType<ReturnType<typeof createCanvas>["getContext"]>) => void,
): Blob {
  const canvas = createCanvas(width, height);
  if (paint !== undefined) paint(canvas.getContext("2d"));
  return new Blob([Uint8Array.from(canvas.toBuffer("image/png"))], { type: "image/png" });
}

export const defaultSolid = { type: "solid", color: "#112233" } satisfies SolidBackground;

export const defaultComposition: Composition = {
  width: 1920,
  height: 1080,
  background: defaultSolid,
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

export function isUploaded(
  result: UploadedBackground | UploadRefuse,
): result is UploadedBackground {
  return typeof result !== "string";
}

export function emptyStore(): UploadedBackgroundStore {
  return {
    list: async () => [],
    put: async () => "ok",
    get: async () => undefined,
    remove: async () => "ok",
  };
}

export function memoryStore(): UploadedBackgroundStore {
  const records: UploadedBackground[] = [];
  return {
    list: async () => [...records],
    put: async (record) => {
      records.push(record);
      return "ok";
    },
    get: async (id) => records.find((record) => record.id === id),
    remove: async (id) => {
      const index = records.findIndex((record) => record.id === id);
      if (index !== -1) records.splice(index, 1);
      return "ok";
    },
  };
}

export function pixelAt(canvas: HTMLCanvasElement, cssX: number, cssY: number): number[] {
  const ctx = canvas.getContext("2d");
  if (ctx === null) {
    throw new Error("expected a 2d context");
  }
  return [...ctx.getImageData(Math.round(cssX * 2), Math.round(cssY * 2), 1, 1).data];
}
