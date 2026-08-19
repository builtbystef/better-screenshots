// @vitest-environment jsdom

import { createCanvas, loadImage } from "@napi-rs/canvas";
import { expect, test } from "vite-plus/test";
import {
  createSession,
  type UploadRefuse,
  type UploadedBackground,
  type UploadedBackgroundStore,
} from "./session";

if (typeof globalThis.createImageBitmap !== "function") {
  globalThis.createImageBitmap = (async (image: ImageBitmapSource) => {
    if (!(image instanceof Blob)) {
      throw new TypeError("test createImageBitmap polyfill accepts a Blob");
    }
    return loadImage(await image.arrayBuffer());
  }) as unknown as typeof createImageBitmap;
}

function pngBlob(
  width: number,
  height: number,
  paint?: (ctx: ReturnType<ReturnType<typeof createCanvas>["getContext"]>) => void,
): Blob {
  const canvas = createCanvas(width, height);
  if (paint !== undefined) {
    paint(canvas.getContext("2d"));
  }
  return new Blob([Uint8Array.from(canvas.toBuffer("image/png"))], { type: "image/png" });
}

const defaultSolid = { type: "solid" as const, color: "#112233" };

function isUploaded(result: UploadedBackground | UploadRefuse): result is UploadedBackground {
  return typeof result !== "string";
}

function emptyStore(): UploadedBackgroundStore {
  return {
    list: async () => [],
    put: async () => "ok",
    get: async () => undefined,
    remove: async () => "ok",
  };
}

function memoryStore(): UploadedBackgroundStore {
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
      if (index !== -1) {
        records.splice(index, 1);
      }
      return "ok";
    },
  };
}

test("createSession opens a default Composition on the given solid", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });

  expect(session.composition).toEqual({
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
  });
});

test("placement is null while screenshot is null", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });

  expect(session.composition.screenshot).toBeNull();
  expect(session.placement).toBeNull();
});

function uploaded(id: string): UploadedBackground {
  return {
    id,
    filename: `${id}.png`,
    addedAt: new Date("2026-08-19T00:00:00Z"),
    width: 100,
    height: 80,
    byteLength: 12,
    blob: new Blob([new Uint8Array(12)]),
  };
}

test("uploadedBackgrounds are the records the store lists", async () => {
  const records = [uploaded("one"), uploaded("two")];
  const store: UploadedBackgroundStore = {
    ...emptyStore(),
    list: async () => records,
  };

  const session = await createSession({ defaultSolid, store });

  expect(session.uploadedBackgrounds).toEqual(records);
});

test("uploadedBackgrounds is empty when the store list is unavailable", async () => {
  const store: UploadedBackgroundStore = {
    ...emptyStore(),
    list: async () => "unavailable",
  };

  const session = await createSession({ defaultSolid, store });

  expect(session.uploadedBackgrounds).toEqual([]);
  expect(session.storage).toBe("unavailable");
});

test("a second createSession is a fresh default Composition", async () => {
  const store = emptyStore();
  const first = await createSession({ defaultSolid, store });
  first.setPadding(0);
  first.setBackground({ type: "solid", color: "#abcdef" });

  const second = await createSession({ defaultSolid, store });

  expect(second.composition).toEqual({
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
  });
});

test("setBackground writes a solid and keeps hex case", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });

  expect(session.setBackground({ type: "solid", color: "#aAbBcC" })).toBe("ok");
  expect(session.composition.background).toEqual({ type: "solid", color: "#aAbBcC" });
});

test("setBackground writes a gradient with two or more valid stops", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });
  const gradient = {
    type: "gradient" as const,
    angle: 90,
    stops: [
      { offset: 0, color: "#000000" },
      { offset: 1, color: "#FFFFFF" },
    ],
  };

  expect(session.setBackground(gradient)).toBe("ok");
  expect(session.composition.background).toEqual(gradient);
});

test("setBackground writes an image id that is not in the store", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });

  expect(session.setBackground({ type: "image", id: "missing" })).toBe("ok");
  expect(session.composition.background).toEqual({ type: "image", id: "missing" });
});

test("setBackground refuses a bad value and leaves the Composition unchanged", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });
  const before = structuredClone(session.composition);
  const gradient = {
    type: "gradient" as const,
    angle: 45,
    stops: [
      { offset: 0, color: "#000000" },
      { offset: 1, color: "#FFFFFF" },
    ],
  };

  const refused = [
    { type: "solid" as const, color: "#RGB" },
    { type: "solid" as const, color: "#11223344" },
    { type: "solid" as const, color: "#11223" },
    { type: "solid" as const, color: "112233" },
    { type: "solid" as const, color: "#GGGGGG" },
    { ...gradient, stops: [{ offset: 0, color: "#000000" }] },
    { ...gradient, stops: [] },
    { ...gradient, angle: Number.POSITIVE_INFINITY },
    { ...gradient, angle: Number.NaN },
    {
      ...gradient,
      stops: [
        { offset: -0.1, color: "#000000" },
        { offset: 1, color: "#FFFFFF" },
      ],
    },
    {
      ...gradient,
      stops: [
        { offset: 0, color: "#000000" },
        { offset: 1.1, color: "#FFFFFF" },
      ],
    },
    {
      ...gradient,
      stops: [
        { offset: 0, color: "#RGB" },
        { offset: 1, color: "#FFFFFF" },
      ],
    },
    { type: "image" as const, id: "" },
  ];

  for (const background of refused) {
    expect(session.setBackground(background)).toBe("refuse");
    expect(session.composition).toEqual(before);
  }
});

test("setPadding writes 0 and refuses a value below 0 or non-finite", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });

  expect(session.setPadding(0)).toBe("ok");
  expect(session.composition.padding).toBe(0);

  const before = structuredClone(session.composition);
  for (const value of [-1, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
    expect(session.setPadding(value)).toBe("refuse");
    expect(session.composition).toEqual(before);
  }
});

test("setScale writes 2 and refuses a value at or below 0 or non-finite", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });

  expect(session.setScale(2)).toBe("ok");
  expect(session.composition.scale).toBe(2);

  const before = structuredClone(session.composition);
  for (const value of [0, -1, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
    expect(session.setScale(value)).toBe("refuse");
    expect(session.composition).toEqual(before);
  }
});

test("setPosition writes an offset and refuses a non-finite value", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });

  expect(session.setPosition(10, -20)).toBe("ok");
  expect(session.composition.position).toEqual({ x: 10, y: -20 });

  const before = structuredClone(session.composition);
  const bad = [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY];
  for (const value of bad) {
    expect(session.setPosition(value, 0)).toBe("refuse");
    expect(session.setPosition(0, value)).toBe("refuse");
    expect(session.composition).toEqual(before);
  }
});

test("setShadow writes zeros and refuses a value out of range or non-finite", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });

  expect(session.setShadow(0, 0, 0)).toBe("ok");
  expect(session.composition.shadow).toEqual({ offset: 0, blur: 0, opacity: 0 });

  const before = structuredClone(session.composition);
  const refused: Array<[number, number, number]> = [
    [-1, 0, 0],
    [0, -1, 0],
    [0, 0, -0.01],
    [0, 0, 1.01],
    [Number.NaN, 0, 0],
    [0, Number.POSITIVE_INFINITY, 0],
    [0, 0, Number.NEGATIVE_INFINITY],
  ];
  for (const [offset, blur, opacity] of refused) {
    expect(session.setShadow(offset, blur, opacity)).toBe("refuse");
    expect(session.composition).toEqual(before);
  }
});

test("setBorder writes zeros and keeps color case, and refuses a bad width or color", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });

  expect(session.setBorder(0, "#000000")).toBe("ok");
  expect(session.composition.border).toEqual({ width: 0, color: "#000000" });
  expect(session.setBorder(2, "#aAbBcC")).toBe("ok");
  expect(session.composition.border).toEqual({ width: 2, color: "#aAbBcC" });

  const before = structuredClone(session.composition);
  const refused: Array<[number, string]> = [
    [-1, "#000000"],
    [Number.NaN, "#000000"],
    [Number.POSITIVE_INFINITY, "#000000"],
    [1, "#RGB"],
    [1, "#00000000"],
    [1, "000000"],
  ];
  for (const [width, color] of refused) {
    expect(session.setBorder(width, color)).toBe("refuse");
    expect(session.composition).toEqual(before);
  }
});

test("setRadius writes 0 and refuses a value below 0 or non-finite", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });

  expect(session.setRadius(0)).toBe("ok");
  expect(session.composition.radius).toBe(0);

  const before = structuredClone(session.composition);
  for (const value of [-1, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
    expect(session.setRadius(value)).toBe("refuse");
    expect(session.composition).toEqual(before);
  }
});

test("placeScreenshot of one decodable image returns ok and sets that Blob", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });
  const screenshot = pngBlob(800, 600);

  expect(await session.placeScreenshot([screenshot])).toBe("ok");
  expect(session.composition.screenshot).toBe(screenshot);
});

test("a second successful place swaps the Screenshot and keeps fields", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });
  expect(await session.placeScreenshot([pngBlob(800, 600)])).toBe("ok");
  session.setPadding(40);
  session.setScale(2);
  session.setPosition(10, -20);
  session.setShadow(1, 2, 0.5);
  session.setBorder(3, "#aAbBcC");
  session.setRadius(8);
  const second = pngBlob(400, 300);

  expect(await session.placeScreenshot([second])).toBe("ok");
  expect(session.composition.screenshot).toBe(second);
  expect(session.composition.padding).toBe(40);
  expect(session.composition.scale).toBe(2);
  expect(session.composition.position).toEqual({ x: 10, y: -20 });
  expect(session.composition.shadow).toEqual({ offset: 1, blur: 2, opacity: 0.5 });
  expect(session.composition.border).toEqual({ width: 3, color: "#aAbBcC" });
  expect(session.composition.radius).toBe(8);
});

test("placeScreenshot refuses an empty list, undecodable Blob, 0x0 image, or only those", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });
  const first = pngBlob(800, 600);
  expect(await session.placeScreenshot([first])).toBe("ok");
  const before = session.composition;
  const undecodable = new Blob([new Uint8Array([1, 2, 3, 4])], { type: "image/png" });
  const emptySize = new Blob(
    ['<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0"></svg>'],
    { type: "image/svg+xml" },
  );

  expect(await session.placeScreenshot([])).toBe("refuse");
  expect(session.composition).toBe(before);
  expect(await session.placeScreenshot([undecodable])).toBe("refuse");
  expect(session.composition).toBe(before);
  expect(await session.placeScreenshot([emptySize])).toBe("refuse");
  expect(session.composition).toBe(before);
  expect(await session.placeScreenshot([undecodable, emptySize])).toBe("refuse");
  expect(session.composition).toBe(before);
});

test("placeScreenshot keeps the first decodable non-0x0 image and skips earlier bad sources", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });
  const undecodable = new Blob([new Uint8Array([1, 2, 3, 4])], { type: "image/png" });
  const emptySize = new Blob(
    ['<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0"></svg>'],
    { type: "image/svg+xml" },
  );
  const firstGood = pngBlob(800, 600);
  const laterGood = pngBlob(400, 300);

  expect(await session.placeScreenshot([undecodable, emptySize, firstGood, laterGood])).toBe("ok");
  expect(session.composition.screenshot).toBe(firstGood);
});

test("placement is derived from the default frame after placing an 800x600 Screenshot", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });
  expect(session.placement).toBeNull();

  expect(await session.placeScreenshot([pngBlob(800, 600)])).toBe("ok");

  expect(session.placement).toEqual({
    inner: { x: 120, y: 120, width: 1680, height: 840 },
    fitted: { width: 1120, height: 840 },
    drawn: { x: 400, y: 120, width: 1120, height: 840 },
  });
});

test("setPadding(10000) then an 800x600 Screenshot clamps inner and keeps stored padding", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });
  expect(session.setPadding(10000)).toBe("ok");

  expect(await session.placeScreenshot([pngBlob(800, 600)])).toBe("ok");

  expect(session.composition.padding).toBe(10000);
  expect(session.placement?.inner).toEqual({ x: 539.5, y: 539.5, width: 841, height: 1 });
});

test("placement drawn at scale 2 and Position 0, 0 uses the default inner", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });
  expect(session.setScale(2)).toBe("ok");

  expect(await session.placeScreenshot([pngBlob(800, 600)])).toBe("ok");

  expect(session.placement?.drawn).toEqual({ x: -160, y: -300, width: 2240, height: 1680 });
});

test("placement drawn at scale 1 and Position 100, -50 uses the default inner", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });
  expect(session.setPosition(100, -50)).toBe("ok");

  expect(await session.placeScreenshot([pngBlob(800, 600)])).toBe("ok");

  expect(session.placement?.drawn).toEqual({ x: 500, y: 70, width: 1120, height: 840 });
});

test("uploadBackground of a decodable image returns a record and does not change the Background", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });
  const before = session.composition.background;
  const file = pngBlob(100, 80);
  const started = Date.now();

  const result = await session.uploadBackground(file, "wall.png");

  expect(isUploaded(result)).toBe(true);
  if (!isUploaded(result)) {
    return;
  }
  expect(result.id).not.toBe("");
  expect(result.filename).toBe("wall.png");
  expect(result.addedAt).toBeInstanceOf(Date);
  expect(result.addedAt.getTime()).toBeGreaterThanOrEqual(started);
  expect(result.addedAt.getTime()).toBeLessThanOrEqual(Date.now());
  expect(result.width).toBe(100);
  expect(result.height).toBe(80);
  expect(result.byteLength).toBe(file.size);
  expect(result.blob).toBe(file);
  expect(session.composition.background).toEqual(before);
  expect(session.uploadedBackgrounds).toEqual([result]);
  expect(session.storage).toBe("ok");
});

test("two uploads of the same bytes are two records", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });
  const file = pngBlob(100, 80);

  const first = await session.uploadBackground(file, "wall.png");
  const second = await session.uploadBackground(file, "wall.png");

  expect(isUploaded(first)).toBe(true);
  expect(isUploaded(second)).toBe(true);
  if (!isUploaded(first) || !isUploaded(second)) {
    return;
  }
  expect(first.id).not.toBe(second.id);
  expect(session.uploadedBackgrounds).toEqual([first, second]);
});

test("uploadBackground of an undecodable Blob or a 0x0 image returns undecodable and stores nothing", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });
  const before = session.composition.background;
  const undecodable = new Blob([new Uint8Array([1, 2, 3, 4])], { type: "image/png" });
  const emptySize = new Blob(
    ['<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0"></svg>'],
    { type: "image/svg+xml" },
  );

  expect(await session.uploadBackground(undecodable, "bad.png")).toBe("undecodable");
  expect(await session.uploadBackground(emptySize, "empty.svg")).toBe("undecodable");
  expect(session.uploadedBackgrounds).toEqual([]);
  expect(session.composition.background).toEqual(before);
});

test("uploadBackground returns quota when put is quota and leaves stored records", async () => {
  const stored: UploadedBackground[] = [];
  const store: UploadedBackgroundStore = {
    ...emptyStore(),
    list: async () => [...stored],
    put: async (record) => {
      if (stored.length >= 1) {
        return "quota";
      }
      stored.push(record);
      return "ok";
    },
  };
  const session = await createSession({ defaultSolid, store });
  const first = await session.uploadBackground(pngBlob(100, 80), "one.png");
  expect(isUploaded(first)).toBe(true);
  if (!isUploaded(first)) {
    return;
  }

  expect(await session.uploadBackground(pngBlob(50, 40), "two.png")).toBe("quota");
  expect(session.uploadedBackgrounds).toEqual([first]);
  expect(stored).toEqual([first]);
  expect(session.storage).toBe("ok");
});

test("uploadBackground returns unavailable when put is unavailable", async () => {
  const store: UploadedBackgroundStore = {
    ...emptyStore(),
    put: async () => "unavailable",
  };
  const session = await createSession({ defaultSolid, store });

  expect(await session.uploadBackground(pngBlob(100, 80), "x.png")).toBe("unavailable");
  expect(session.uploadedBackgrounds).toEqual([]);
  expect(session.storage).toBe("unavailable");
});

test("uploadBackground returns unavailable when createSession could not list the store", async () => {
  const store: UploadedBackgroundStore = {
    ...emptyStore(),
    list: async () => "unavailable",
  };
  const session = await createSession({ defaultSolid, store });

  expect(session.storage).toBe("unavailable");
  expect(await session.uploadBackground(pngBlob(100, 80), "wall.png")).toBe("unavailable");
  expect(session.uploadedBackgrounds).toEqual([]);
});

test("removeBackground of an unused id removes the record across a refresh", async () => {
  const store = memoryStore();
  const session = await createSession({ defaultSolid, store });
  const uploaded = await session.uploadBackground(pngBlob(100, 80), "wall.png");
  expect(isUploaded(uploaded)).toBe(true);
  if (!isUploaded(uploaded)) {
    return;
  }

  expect(await session.removeBackground(uploaded.id)).toBe("ok");
  expect(session.uploadedBackgrounds).toEqual([]);

  const refreshed = await createSession({ defaultSolid, store });
  expect(refreshed.uploadedBackgrounds).toEqual([]);
});

test("removeBackground sets storage to unavailable when the store remove is unavailable", async () => {
  const store: UploadedBackgroundStore = {
    ...emptyStore(),
    list: async () => [uploaded("wall")],
    remove: async () => "unavailable",
  };
  const session = await createSession({ defaultSolid, store });

  expect(session.storage).toBe("ok");
  expect(await session.removeBackground("wall")).toBe("refuse");
  expect(session.storage).toBe("unavailable");
});

test("removeBackground refuses the current image Background or an unavailable store", async () => {
  const store = memoryStore();
  const session = await createSession({ defaultSolid, store });
  const uploaded = await session.uploadBackground(pngBlob(100, 80), "wall.png");
  expect(isUploaded(uploaded)).toBe(true);
  if (!isUploaded(uploaded)) {
    return;
  }
  expect(session.setBackground({ type: "image", id: uploaded.id })).toBe("ok");

  expect(await session.removeBackground(uploaded.id)).toBe("refuse");
  expect(session.uploadedBackgrounds).toEqual([uploaded]);

  const unavailable: UploadedBackgroundStore = {
    ...emptyStore(),
    list: async () => [uploaded],
    remove: async () => "unavailable",
  };
  const other = await createSession({ defaultSolid, store: unavailable });
  expect(await other.removeBackground(uploaded.id)).toBe("refuse");
  expect(other.uploadedBackgrounds).toEqual([uploaded]);

  const listedUnavailable: UploadedBackgroundStore = {
    ...emptyStore(),
    list: async () => "unavailable",
    remove: async () => "ok",
  };
  const listedDown = await createSession({ defaultSolid, store: listedUnavailable });
  expect(await listedDown.removeBackground(uploaded.id)).toBe("refuse");
});

function pixelAt(
  canvas: HTMLCanvasElement,
  cssX: number,
  cssY: number,
): [number, number, number, number] {
  const ctx = canvas.getContext("2d");
  if (ctx === null) {
    throw new Error("expected a 2d context");
  }
  const data = ctx.getImageData(Math.round(cssX * 2), Math.round(cssY * 2), 1, 1).data;
  return [data[0] ?? 0, data[1] ?? 0, data[2] ?? 0, data[3] ?? 0];
}

test("border width and shadow offset do not change with Scale", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });
  expect(
    await session.placeScreenshot([
      pngBlob(800, 600, (ctx) => {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, 800, 600);
      }),
    ]),
  ).toBe("ok");
  expect(session.setScale(2)).toBe("ok");
  expect(session.setPosition(200, 0)).toBe("ok");
  expect(session.setBorder(8, "#FF0000")).toBe("ok");
  expect(session.setShadow(0, 0, 0)).toBe("ok");

  const canvas = await session.render();

  expect(pixelAt(canvas, 36, 540)).toEqual([255, 0, 0, 255]);
  expect(pixelAt(canvas, 28, 540)).toEqual([0x11, 0x22, 0x33, 255]);
});

test("Screenshot alpha composites over the Background", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });
  expect(await session.placeScreenshot([pngBlob(800, 600)])).toBe("ok");
  expect(session.setShadow(0, 0, 0)).toBe("ok");
  expect(session.setBorder(0, "#FF0000")).toBe("ok");

  const canvas = await session.render();

  expect(pixelAt(canvas, 960, 540)).toEqual([0x11, 0x22, 0x33, 255]);
});

test("a glow with offset 0 and blur above 0 is painted", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });
  expect(
    await session.placeScreenshot([
      pngBlob(800, 600, (ctx) => {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, 800, 600);
      }),
    ]),
  ).toBe("ok");
  expect(session.setBorder(0, "#FF0000")).toBe("ok");
  expect(session.setShadow(0, 32, 1)).toBe("ok");

  const canvas = await session.render();
  const [r, g, b] = pixelAt(canvas, 390, 540);

  expect(r).toBeLessThan(0x11);
  expect(g).toBeLessThan(0x22);
  expect(b).toBeLessThan(0x33);
});

test("shadow is black at the stored opacity, offset +x +y, and off when offset and blur are 0", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });
  expect(
    await session.placeScreenshot([
      pngBlob(800, 600, (ctx) => {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, 800, 600);
      }),
    ]),
  ).toBe("ok");
  expect(session.setBorder(0, "#FF0000")).toBe("ok");
  expect(session.setShadow(16, 0, 1)).toBe("ok");

  const canvas = await session.render();

  expect(pixelAt(canvas, 1528, 540)).toEqual([0, 0, 0, 255]);
  expect(pixelAt(canvas, 960, 540)).toEqual([255, 255, 255, 255]);
  expect(session.setShadow(0, 0, 1)).toBe("ok");
  const none = await session.render();
  expect(pixelAt(none, 1528, 540)).toEqual([0x11, 0x22, 0x33, 255]);
});

test("a placed Screenshot paints inside the drawn rect and the border in the outer ring", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });
  expect(
    await session.placeScreenshot([
      pngBlob(800, 600, (ctx) => {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, 800, 600);
      }),
    ]),
  ).toBe("ok");
  expect(session.setBorder(8, "#FF0000")).toBe("ok");
  expect(session.setShadow(0, 0, 0)).toBe("ok");

  const canvas = await session.render();

  expect(session.placement?.drawn).toEqual({ x: 400, y: 120, width: 1120, height: 840 });
  expect(pixelAt(canvas, 960, 540)).toEqual([255, 255, 255, 255]);
  expect(pixelAt(canvas, 396, 540)).toEqual([255, 0, 0, 255]);
  expect(pixelAt(canvas, 380, 540)).toEqual([0x11, 0x22, 0x33, 255]);
  expect(pixelAt(canvas, 410, 540)).toEqual([255, 255, 255, 255]);
});

test("border width 0 makes the outer rect equal the drawn rect", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });
  expect(
    await session.placeScreenshot([
      pngBlob(800, 600, (ctx) => {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, 800, 600);
      }),
    ]),
  ).toBe("ok");
  expect(session.setBorder(0, "#FF0000")).toBe("ok");
  expect(session.setShadow(0, 0, 0)).toBe("ok");

  const canvas = await session.render();

  expect(pixelAt(canvas, 396, 540)).toEqual([0x11, 0x22, 0x33, 255]);
  expect(pixelAt(canvas, 410, 540)).toEqual([255, 255, 255, 255]);
});

test("effects do not apply when the Screenshot is absent", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });
  session.setShadow(16, 0, 1);
  session.setBorder(8, "#FFFFFF");
  session.setRadius(16);

  const canvas = await session.render();

  expect(pixelAt(canvas, 0, 0)).toEqual([0x11, 0x22, 0x33, 255]);
  expect(pixelAt(canvas, 396, 540)).toEqual([0x11, 0x22, 0x33, 255]);
  expect(pixelAt(canvas, 960, 540)).toEqual([0x11, 0x22, 0x33, 255]);
});

test("an image Background is cover-center on the default frame", async () => {
  const store = memoryStore();
  const session = await createSession({ defaultSolid, store });
  const file = pngBlob(1000, 2000, (ctx) => {
    ctx.fillStyle = "#00FF00";
    ctx.fillRect(0, 0, 1000, 600);
    ctx.fillStyle = "#FF0000";
    ctx.fillRect(0, 700, 1000, 600);
    ctx.fillStyle = "#0000FF";
    ctx.fillRect(0, 1400, 1000, 600);
  });
  const uploaded = await session.uploadBackground(file, "cover.png");
  expect(isUploaded(uploaded)).toBe(true);
  if (!isUploaded(uploaded)) {
    return;
  }
  expect(session.setBackground({ type: "image", id: uploaded.id })).toBe("ok");

  const canvas = await session.render();

  expect(pixelAt(canvas, 960, 540)).toEqual([255, 0, 0, 255]);
  expect(pixelAt(canvas, 0, 0)).toEqual([255, 0, 0, 255]);
  expect(pixelAt(canvas, 1919, 1079)).toEqual([255, 0, 0, 255]);
  expect(session.composition.background).toEqual({ type: "image", id: uploaded.id });
});

test("a 0deg gradient on the default frame runs from the bottom center to the top center", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });
  expect(
    session.setBackground({
      type: "gradient",
      angle: 0,
      stops: [
        { offset: 0, color: "#000000" },
        { offset: 1, color: "#FFFFFF" },
      ],
    }),
  ).toBe("ok");

  const canvas = await session.render();

  expect(pixelAt(canvas, 960, 1079)[0]).toBeLessThan(8);
  expect(pixelAt(canvas, 960, 0)[0]).toBeGreaterThan(247);
});

test("a 90deg gradient on the default frame runs from the left center to the right center", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });
  expect(
    session.setBackground({
      type: "gradient",
      angle: 90,
      stops: [
        { offset: 0, color: "#000000" },
        { offset: 1, color: "#FFFFFF" },
      ],
    }),
  ).toBe("ok");

  const canvas = await session.render();

  expect(pixelAt(canvas, 0, 540)[0]).toBeLessThan(8);
  expect(pixelAt(canvas, 1919, 540)[0]).toBeGreaterThan(247);
});

test("a missing or unavailable image Background fills the default solid and does not rewrite it", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });
  expect(session.setBackground({ type: "image", id: "missing" })).toBe("ok");

  const canvas = await session.render();

  expect(session.composition.background).toEqual({ type: "image", id: "missing" });
  expect(pixelAt(canvas, 0, 0)).toEqual([0x11, 0x22, 0x33, 255]);

  const unavailable: UploadedBackgroundStore = {
    ...emptyStore(),
    get: async () => "unavailable",
  };
  const down = await createSession({ defaultSolid, store: unavailable });
  expect(down.setBackground({ type: "image", id: "gone" })).toBe("ok");
  const downCanvas = await down.render();
  expect(down.composition.background).toEqual({ type: "image", id: "gone" });
  expect(pixelAt(downCanvas, 960, 540)).toEqual([0x11, 0x22, 0x33, 255]);
});

test("exportPng encodes the same bitmap render produces", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });
  expect(await session.placeScreenshot([pngBlob(800, 600)])).toBe("ok");
  const canvas = await session.render();
  const rendered = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/png");
  });

  const result = await session.exportPng(new Date(2026, 7, 19, 14, 5, 3));

  expect(result).not.toBe("refuse");
  expect(rendered).not.toBeNull();
  if (result === "refuse" || rendered === null) {
    return;
  }
  expect(new Uint8Array(await result.blob.arrayBuffer())).toEqual(
    new Uint8Array(await rendered.arrayBuffer()),
  );
});

test("exportPng writes a timestamped PNG from the rendered bitmap", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });
  expect(await session.placeScreenshot([pngBlob(800, 600)])).toBe("ok");

  const result = await session.exportPng(new Date(2026, 7, 19, 14, 5, 3));

  expect(result).not.toBe("refuse");
  if (result === "refuse") {
    return;
  }
  expect(result.filename).toBe("better-screenshots-2026-08-19T140503.png");
  expect(result.blob.type).toBe("image/png");
  expect(result.blob.size).toBeGreaterThan(0);
});

test("exportPng refuses when screenshot is null", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });

  expect(await session.exportPng(new Date(2026, 7, 19, 14, 5, 3))).toBe("refuse");
});

test("render returns a canvas of the default frame at 2x", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });

  const canvas = await session.render();

  expect(canvas.width).toBe(3840);
  expect(canvas.height).toBe(2160);
  const ctx = canvas.getContext("2d");
  expect(ctx?.imageSmoothingEnabled).toBe(true);
  expect(ctx?.imageSmoothingQuality).toBe("high");
});

test("a second createSession lists this session's uploads and a fresh default Composition", async () => {
  const store = memoryStore();
  const session = await createSession({ defaultSolid, store });
  const uploaded = await session.uploadBackground(pngBlob(100, 80), "wall.png");
  expect(isUploaded(uploaded)).toBe(true);
  if (!isUploaded(uploaded)) {
    return;
  }
  session.setPadding(0);
  session.setBackground({ type: "image", id: uploaded.id });

  const refreshed = await createSession({ defaultSolid, store });

  expect(refreshed.uploadedBackgrounds).toEqual([uploaded]);
  expect(refreshed.composition).toEqual({
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
  });
});
