// @vitest-environment jsdom

import { expect, test } from "vite-plus/test";
import {
  BROWSER_WINDOW_THEME,
  BROWSER_WINDOW_TRAFFIC_LIGHTS,
  paintBrowserWindow,
  paintScreenshot,
} from "./paint";
import type { Placement } from "./placement";
import {
  createSession,
  type Composition,
  type UploadedBackground,
  type UploadedBackgroundStore,
} from "./session";
import { defaultSolid, isUploaded, pngBlob } from "./test/helpers";
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
      if (index !== -1) records.splice(index, 1);
      return "ok";
    },
  };
}

test("setSize writes a render canvas of the Frame at 2x", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });
  expect(session.setSize(1080, 1080)).toBe("ok");

  const canvas = await session.render();

  expect(canvas.width).toBe(2160);
  expect(canvas.height).toBe(2160);
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

function opaquePixel(color: string): [number, number, number, number] {
  return [
    Number.parseInt(color.slice(1, 3), 16),
    Number.parseInt(color.slice(3, 5), 16),
    Number.parseInt(color.slice(5, 7), 16),
    255,
  ];
}

function paintBrowserWindowFixture(scheme: "light" | "dark", url = ""): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 200;
  const ctx = canvas.getContext("2d");
  if (ctx === null) {
    throw new Error("expected a 2d context");
  }
  paintBrowserWindow(ctx, { x: 0, y: 0, width: 400, height: 100 }, scheme, url);
  return canvas;
}

test.each(["light", "dark"] as const)(
  "a %s Browser window paints its first traffic light and address pill",
  (scheme) => {
    const canvas = paintBrowserWindowFixture(scheme);

    expect(pixelAt(canvas, 12.32, 11)).toEqual(opaquePixel(BROWSER_WINDOW_TRAFFIC_LIGHTS[0]));
    expect(pixelAt(canvas, 200, 11)).toEqual(opaquePixel(BROWSER_WINDOW_THEME[scheme].pill));
  },
);

test("a Browser window paints a non-empty URL inside the address pill", () => {
  const empty = paintBrowserWindowFixture("light");
  const withUrl = paintBrowserWindowFixture("light", "example.com");
  const emptyContext = empty.getContext("2d");
  const urlContext = withUrl.getContext("2d");
  if (emptyContext === null || urlContext === null) {
    throw new Error("expected 2d contexts");
  }

  const emptyPill = emptyContext.getImageData(96, 10, 220, 24).data;
  const urlPill = urlContext.getImageData(96, 10, 220, 24).data;

  expect(urlPill).not.toEqual(emptyPill);
});

test("a Browser window squeezes the Screenshot so its bottom stripe remains visible", async () => {
  const canvas = document.createElement("canvas");
  canvas.width = 280;
  canvas.height = 280;
  const ctx = canvas.getContext("2d");
  if (ctx === null) {
    throw new Error("expected a 2d context");
  }
  const screenshot = pngBlob(100, 100, (source) => {
    source.fillStyle = "#0000FF";
    source.fillRect(0, 0, 100, 100);
    source.fillStyle = "#FF0000";
    source.fillRect(0, 98, 100, 2);
  });
  const drawn = { x: 20, y: 20, width: 100, height: 100 };
  const placement: Placement = {
    inner: drawn,
    fitted: { width: drawn.width, height: drawn.height },
    drawn,
  };
  const composition: Composition = {
    width: 140,
    height: 140,
    background: defaultSolid,
    screenshot,
    padding: 0,
    scale: 1,
    position: { x: 0, y: 0 },
    shadow: { offset: 0, blur: 0, opacity: 0 },
    border: { width: 0, color: "#FFFFFF" },
    radius: 0,
    browserWindow: "light" as const,
    url: "",
  };

  await paintScreenshot(ctx, composition, placement, screenshot, () =>
    document.createElement("canvas"),
  );

  expect(pixelAt(canvas, 70, 119)).toEqual([255, 0, 0, 255]);
});

test("a Screenshot positioned past the Frame edge is clipped, not moved", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });
  expect(session.setSize(100, 100)).toBe("ok");
  expect(session.setPadding(0)).toBe("ok");
  expect(session.setPosition(75, 0)).toBe("ok");
  expect(session.setRadius(0)).toBe("ok");
  expect(session.setShadow({ offset: 0, blur: 0, opacity: 0 })).toBe("ok");
  expect(
    await session.placeScreenshot([
      pngBlob(100, 100, (ctx) => {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, 100, 100);
      }),
    ]),
  ).toBe("ok");

  const canvas = await session.render();

  expect(pixelAt(canvas, 0, 50)).toEqual([0x11, 0x22, 0x33, 255]);
  expect(pixelAt(canvas, 60, 50)).toEqual([0x11, 0x22, 0x33, 255]);
  expect(pixelAt(canvas, 99, 50)).toEqual([255, 255, 255, 255]);
});

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
  expect(session.setBorder({ width: 8, color: "#FF0000" })).toBe("ok");
  expect(session.setShadow({ offset: 0, blur: 0, opacity: 0 })).toBe("ok");

  const canvas = await session.render();

  expect(pixelAt(canvas, 36, 540)).toEqual([255, 0, 0, 255]);
  expect(pixelAt(canvas, 28, 540)).toEqual([0x11, 0x22, 0x33, 255]);
});

test("Screenshot alpha composites over the Background", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });
  expect(await session.placeScreenshot([pngBlob(800, 600)])).toBe("ok");
  expect(session.setShadow({ offset: 0, blur: 0, opacity: 0 })).toBe("ok");
  expect(session.setBorder({ width: 0, color: "#FF0000" })).toBe("ok");

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
  expect(session.setBorder({ width: 0, color: "#FF0000" })).toBe("ok");
  expect(session.setShadow({ offset: 0, blur: 32, opacity: 1 })).toBe("ok");

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
  expect(session.setBorder({ width: 0, color: "#FF0000" })).toBe("ok");
  expect(session.setShadow({ offset: 16, blur: 0, opacity: 1 })).toBe("ok");

  const canvas = await session.render();

  expect(pixelAt(canvas, 1528, 540)).toEqual([0, 0, 0, 255]);
  expect(pixelAt(canvas, 960, 540)).toEqual([255, 255, 255, 255]);
  expect(session.setShadow({ offset: 0, blur: 0, opacity: 1 })).toBe("ok");
  const none = await session.render();
  expect(pixelAt(none, 1528, 540)).toEqual([0x11, 0x22, 0x33, 255]);
});

test("a Light Browser window paints its bar above the Screenshot", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });
  expect(
    await session.placeScreenshot([
      pngBlob(800, 600, (ctx) => {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, 800, 600);
      }),
    ]),
  ).toBe("ok");
  expect(session.setBrowserWindow("light")).toBe("ok");
  expect(session.setRadius(0)).toBe("ok");
  expect(session.setShadow({ offset: 0, blur: 0, opacity: 0 })).toBe("ok");
  expect(session.setBorder({ width: 0, color: "#FF0000" })).toBe("ok");

  const canvas = await session.render();

  expect(pixelAt(canvas, 960, 122)).toEqual([0xf1, 0xf3, 0xf4, 255]);
  expect(pixelAt(canvas, 960, 400)).toEqual([255, 255, 255, 255]);
});

test("a Dark Browser window paints its bar above the Screenshot", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });
  expect(
    await session.placeScreenshot([
      pngBlob(800, 600, (ctx) => {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, 800, 600);
      }),
    ]),
  ).toBe("ok");
  expect(session.setBrowserWindow("dark")).toBe("ok");
  expect(session.setRadius(0)).toBe("ok");
  expect(session.setShadow({ offset: 0, blur: 0, opacity: 0 })).toBe("ok");
  expect(session.setBorder({ width: 0, color: "#FF0000" })).toBe("ok");

  const canvas = await session.render();

  expect(pixelAt(canvas, 960, 122)).toEqual([0x20, 0x21, 0x24, 255]);
  expect(pixelAt(canvas, 960, 400)).toEqual([255, 255, 255, 255]);
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
  expect(session.setBorder({ width: 8, color: "#FF0000" })).toBe("ok");
  expect(session.setShadow({ offset: 0, blur: 0, opacity: 0 })).toBe("ok");

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
  expect(session.setBorder({ width: 0, color: "#FF0000" })).toBe("ok");
  expect(session.setShadow({ offset: 0, blur: 0, opacity: 0 })).toBe("ok");

  const canvas = await session.render();

  expect(pixelAt(canvas, 396, 540)).toEqual([0x11, 0x22, 0x33, 255]);
  expect(pixelAt(canvas, 410, 540)).toEqual([255, 255, 255, 255]);
});

test("effects do not apply when the Screenshot is absent", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });
  session.setShadow({ offset: 16, blur: 0, opacity: 1 });
  session.setBorder({ width: 8, color: "#FFFFFF" });
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

test("exportPng refuses when PNG encoding fails", async () => {
  const canvas = document.createElement("canvas");
  canvas.toBlob = (callback) => callback(null);
  const session = await createSession({
    defaultSolid,
    store: emptyStore(),
    createCanvas: () => canvas,
  });
  expect(await session.placeScreenshot([pngBlob(800, 600)])).toBe("ok");

  expect(await session.exportPng(new Date(2026, 7, 19, 14, 5, 3))).toBe("refuse");
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
    browserWindow: "none",
    url: "",
  });
});
