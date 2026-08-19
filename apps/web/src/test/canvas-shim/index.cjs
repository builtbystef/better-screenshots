"use strict";

const napi = require("@napi-rs/canvas");

function createCanvas(width, height) {
  const canvas = napi.createCanvas(width, height);
  const origToBuffer = canvas.toBuffer.bind(canvas);
  canvas.toBuffer = function toBuffer(typeOrCb, maybeType, _options) {
    if (typeof typeOrCb === "function") {
      try {
        const mime = typeof maybeType === "string" ? maybeType : "image/png";
        typeOrCb(null, origToBuffer(mime));
      } catch (error) {
        typeOrCb(error);
      }
      return undefined;
    }
    return origToBuffer(typeOrCb);
  };
  return canvas;
}

module.exports = {
  createCanvas,
  Image: napi.Image,
  loadImage: napi.loadImage,
};
