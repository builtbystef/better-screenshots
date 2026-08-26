import { expect, test } from "vite-plus/test";
import {
  createSession,
  type Background,
  type Border,
  type GradientBackground,
  type UploadedBackground,
  type UploadedBackgroundStore,
} from "./session";
import { defaultSolid, imageBlob, isUploaded } from "./test/helpers";

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

test("a subscriber receives one notification for a successful write and none for a refusal", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });
  const versions: number[] = [];

  session.subscribe(() => versions.push(session.version));

  expect(session.setPadding(40)).toBe("ok");
  expect(session.setPadding(-1)).toBe("refuse");
  expect(versions).toEqual([1]);
  expect(session.version).toBe(1);
  expect(session.subscribe).toBe(session.subscribe);
});

test("unsubscribe stops session change notifications", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });
  let deliveries = 0;
  const unsubscribe = session.subscribe(() => {
    deliveries += 1;
  });

  expect(session.setPadding(40)).toBe("ok");
  unsubscribe();
  expect(session.setPadding(80)).toBe("ok");

  expect(deliveries).toBe(1);
  expect(session.version).toBe(2);
});

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
    browserWindow: "none",
    url: "",
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
    browserWindow: "none",
    url: "",
  });
});

test("setBackground writes a solid and keeps hex case", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });

  expect(session.setBackground({ type: "solid", color: "#aAbBcC" })).toBe("ok");
  expect(session.composition.background).toEqual({ type: "solid", color: "#aAbBcC" });
});

test("setBackground writes a gradient with two or more valid stops", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });
  const gradient: GradientBackground = {
    type: "gradient",
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
    expect(session.setBackground(background as Background)).toBe("refuse");
    expect(session.composition).toEqual(before);
  }
});

test("setBrowserWindow writes each Browser window value", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });

  expect(session.setBrowserWindow("light")).toBe("ok");
  expect(session.composition.browserWindow).toBe("light");
  expect(session.setBrowserWindow("dark")).toBe("ok");
  expect(session.composition.browserWindow).toBe("dark");
  expect(session.setBrowserWindow("none")).toBe("ok");
  expect(session.composition.browserWindow).toBe("none");
});

test("setUrl writes the typed text including empty", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });

  expect(session.setUrl("example.com/path")).toBe("ok");
  expect(session.composition.url).toBe("example.com/path");
  expect(session.setUrl("")).toBe("ok");
  expect(session.composition.url).toBe("");
});

test("setSize writes a Frame and refuses a value at or below 0 or non-finite", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });

  expect(session.setSize(1080, 1350)).toBe("ok");
  expect(session.composition.width).toBe(1080);
  expect(session.composition.height).toBe(1350);

  const before = structuredClone(session.composition);
  const refused: Array<[number, number]> = [
    [0, 1080],
    [1080, 0],
    [-1, 1080],
    [1080, -1],
    [Number.NaN, 1080],
    [1080, Number.POSITIVE_INFINITY],
  ];
  for (const [width, height] of refused) {
    expect(session.setSize(width, height)).toBe("refuse");
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

test("Position is unbounded and a smaller Frame leaves it unchanged", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });

  expect(session.setPosition(5000, -4000)).toBe("ok");
  expect(session.composition.position).toEqual({ x: 5000, y: -4000 });
  expect(session.setSize(100, 100)).toBe("ok");
  expect(session.composition.position).toEqual({ x: 5000, y: -4000 });

  const before = structuredClone(session.composition);
  const bad = [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY];
  for (const value of bad) {
    expect(session.setPosition(value, 0)).toBe("refuse");
    expect(session.setPosition(0, value)).toBe("refuse");
    expect(session.composition).toEqual(before);
  }
});

test("setShadow merges valid patches and refuses a patch with an invalid field", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });

  expect(session.setShadow({ offset: 0 })).toBe("ok");
  expect(session.composition.shadow).toEqual({ offset: 0, blur: 32, opacity: 0.25 });
  expect(session.setShadow({ blur: 0, opacity: 0 })).toBe("ok");
  expect(session.composition.shadow).toEqual({ offset: 0, blur: 0, opacity: 0 });

  const before = structuredClone(session.composition);
  const refused = [
    { offset: -1 },
    { blur: -1 },
    { opacity: -0.01 },
    { opacity: 1.01 },
    { offset: Number.NaN },
    { blur: Number.POSITIVE_INFINITY },
    { opacity: Number.NEGATIVE_INFINITY },
  ];
  for (const patch of refused) {
    expect(session.setShadow(patch)).toBe("refuse");
    expect(session.composition).toEqual(before);
  }
});

test("setBorder merges valid patches and refuses a patch with an invalid field", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });

  expect(session.setBorder({ width: 2 })).toBe("ok");
  expect(session.composition.border).toEqual({ width: 2, color: "#FFFFFF" });
  expect(session.setBorder({ color: "#aAbBcC" })).toBe("ok");
  expect(session.composition.border).toEqual({ width: 2, color: "#aAbBcC" });

  const before = structuredClone(session.composition);
  const refused = [
    { width: -1 },
    { width: Number.NaN },
    { width: Number.POSITIVE_INFINITY },
    { color: "#RGB" },
    { color: "#00000000" },
    { color: "000000" },
  ];
  for (const patch of refused) {
    expect(session.setBorder(patch as Partial<Border>)).toBe("refuse");
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
  const screenshot = imageBlob(800, 600);

  expect(await session.placeScreenshot([screenshot])).toBe("ok");
  expect(session.composition.screenshot).toBe(screenshot);
});

test("a second successful place swaps the Screenshot and keeps fields", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });
  expect(await session.placeScreenshot([imageBlob(800, 600)])).toBe("ok");
  session.setPadding(40);
  session.setScale(2);
  session.setPosition(10, -20);
  session.setShadow({ offset: 1, blur: 2, opacity: 0.5 });
  session.setBorder({ width: 3, color: "#aAbBcC" });
  session.setRadius(8);
  session.setBrowserWindow("dark");
  session.setUrl("example.com");
  const second = imageBlob(400, 300);

  expect(await session.placeScreenshot([second])).toBe("ok");
  expect(session.composition.screenshot).toBe(second);
  expect(session.composition.padding).toBe(40);
  expect(session.composition.scale).toBe(2);
  expect(session.composition.position).toEqual({ x: 10, y: -20 });
  expect(session.composition.shadow).toEqual({ offset: 1, blur: 2, opacity: 0.5 });
  expect(session.composition.border).toEqual({ width: 3, color: "#aAbBcC" });
  expect(session.composition.radius).toBe(8);
  expect(session.composition.browserWindow).toBe("dark");
  expect(session.composition.url).toBe("example.com");
});

test("placeScreenshot refuses an empty list, undecodable Blob, 0x0 image, or only those", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });
  const first = imageBlob(800, 600);
  expect(await session.placeScreenshot([first])).toBe("ok");
  const before = session.composition;
  const undecodable = new Blob([new Uint8Array([1, 2, 3, 4])], { type: "image/png" });
  const emptySize = imageBlob(0, 0);

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
  const emptySize = imageBlob(0, 0);
  const firstGood = imageBlob(800, 600);
  const laterGood = imageBlob(400, 300);

  expect(await session.placeScreenshot([undecodable, emptySize, firstGood, laterGood])).toBe("ok");
  expect(session.composition.screenshot).toBe(firstGood);
});

test("uploadBackground of a decodable image returns a record and does not change the Background", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });
  const before = session.composition.background;
  const file = imageBlob(100, 80);
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
  const file = imageBlob(100, 80);

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
  const emptySize = imageBlob(0, 0);

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
  const first = await session.uploadBackground(imageBlob(100, 80), "one.png");
  expect(isUploaded(first)).toBe(true);
  if (!isUploaded(first)) {
    return;
  }

  expect(await session.uploadBackground(imageBlob(50, 40), "two.png")).toBe("quota");
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

  expect(await session.uploadBackground(imageBlob(100, 80), "x.png")).toBe("unavailable");
  expect(session.uploadedBackgrounds).toEqual([]);
  expect(session.storage).toBe("unavailable");
});

test("removeBackground does not touch the store after an upload makes storage unavailable", async () => {
  let removeCalls = 0;
  const store: UploadedBackgroundStore = {
    ...emptyStore(),
    put: async () => "unavailable",
    remove: async () => {
      removeCalls += 1;
      return "ok";
    },
  };
  const session = await createSession({ defaultSolid, store });

  expect(await session.uploadBackground(imageBlob(100, 80), "wall.png")).toBe("unavailable");
  expect(await session.removeBackground("wall")).toBe("refuse");
  expect(removeCalls).toBe(0);
});

test("uploadBackground returns unavailable when createSession could not list the store", async () => {
  const store: UploadedBackgroundStore = {
    ...emptyStore(),
    list: async () => "unavailable",
  };
  const session = await createSession({ defaultSolid, store });

  expect(session.storage).toBe("unavailable");
  expect(await session.uploadBackground(imageBlob(100, 80), "wall.png")).toBe("unavailable");
  expect(session.uploadedBackgrounds).toEqual([]);
});

test("removeBackground of an unused id removes the record across a refresh", async () => {
  const store = memoryStore();
  const session = await createSession({ defaultSolid, store });
  const uploaded = await session.uploadBackground(imageBlob(100, 80), "wall.png");
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
  const uploaded = await session.uploadBackground(imageBlob(100, 80), "wall.png");
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
