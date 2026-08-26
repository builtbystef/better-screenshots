"use strict";

const napi = require("@napi-rs/canvas") as typeof import("@napi-rs/canvas");

type BufferCallback = (error: unknown, buffer?: Buffer) => void;
type ShimToBuffer = (
  typeOrCallback?: string | BufferCallback,
  maybeType?: string,
  options?: unknown,
) => Buffer | undefined;

function createCanvas(width: number, height: number) {
  const canvas = napi.createCanvas(width, height);
  const originalToBuffer = canvas.toBuffer.bind(canvas) as (mime?: string) => Buffer;
  const shimCanvas = canvas as unknown as { toBuffer: ShimToBuffer };
  shimCanvas.toBuffer = function toBuffer(typeOrCallback, maybeType, _options) {
    if (typeof typeOrCallback === "function") {
      try {
        const mime = typeof maybeType === "string" ? maybeType : "image/png";
        typeOrCallback(null, originalToBuffer(mime));
      } catch (error) {
        typeOrCallback(error);
      }
      return undefined;
    }
    return originalToBuffer(typeOrCallback);
  };
  return canvas;
}

module.exports = {
  createCanvas,
  Image: napi.Image,
  loadImage: napi.loadImage,
};
