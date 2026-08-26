import { createCanvas, loadImage } from "@napi-rs/canvas";
import type { UploadRefuse, UploadedBackground } from "../session";

const imageSizes = new WeakMap<Blob, { width: number; height: number }>();

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

export const defaultSolid = { type: "solid" as const, color: "#112233" };

export function isUploaded(
  result: UploadedBackground | UploadRefuse,
): result is UploadedBackground {
  return typeof result !== "string";
}
