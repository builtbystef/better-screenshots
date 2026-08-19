import { expect, test } from "vite-plus/test";
import { createSession, type UploadedBackground, type UploadedBackgroundStore } from "./session";

const defaultSolid = { type: "solid" as const, color: "#112233" };

function emptyStore(): UploadedBackgroundStore {
  return {
    list: async () => [],
    put: async () => "ok",
    get: async () => undefined,
    remove: async () => "ok",
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
