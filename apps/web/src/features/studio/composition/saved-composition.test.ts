import { expect, test } from "vite-plus/test";
import {
  applySavedComposition,
  parseSavedComposition,
  serializeSavedComposition,
  type SavedComposition,
} from "@/features/studio/composition/saved-composition";
import { createSession } from "@/features/studio/composition/session";
import {
  defaultComposition,
  defaultSolid,
  emptyStore,
  imageBlob,
  isUploaded,
} from "@/test/helpers";

const savedDefault: SavedComposition = (() => {
  const { screenshot: _screenshot, ...rest } = defaultComposition;
  return rest;
})();

test("a serialized Composition parses back without its Screenshot", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });
  expect(session.setSize(1080, 1350)).toBe("ok");
  expect(session.setBackground({ type: "solid", color: "#AbCdEf" })).toBe("ok");
  expect(session.setShadow({ blur: 48 })).toBe("ok");
  expect(session.setBrowserWindow("dark")).toBe("ok");
  expect(session.setUrl("example.com")).toBe("ok");
  expect(await session.placeScreenshot([imageBlob(800, 600)])).toBe("ok");

  const parsed = parseSavedComposition(serializeSavedComposition(session.composition));

  const { screenshot: _screenshot, ...withoutScreenshot } = session.composition;
  expect(parsed).toEqual(withoutScreenshot);
});

test("a gradient and an image Background survive the round trip", () => {
  const gradient = {
    ...savedDefault,
    background: {
      type: "gradient",
      angle: 135,
      stops: [
        { offset: 0, color: "#BAE6FD" },
        { offset: 1, color: "#E0E7FF" },
      ],
    },
  } satisfies SavedComposition;
  const image = { ...savedDefault, background: { type: "image", id: "abc" } } as const;

  expect(
    parseSavedComposition(serializeSavedComposition({ ...gradient, screenshot: null })),
  ).toEqual(gradient);
  expect(parseSavedComposition(serializeSavedComposition({ ...image, screenshot: null }))).toEqual(
    image,
  );
});

test.each([
  ["not JSON at all", "{"],
  ["a non-object", '"composition"'],
  ["another version", JSON.stringify({ v: 2 })],
  [
    "a missing field",
    serializeSavedComposition({ ...savedDefault, screenshot: null }).replace('"padding":120,', ""),
  ],
  ["a string where a number belongs", JSON.stringify({ v: 1, ...savedDefault, padding: "120" })],
  [
    "a malformed gradient stop",
    JSON.stringify({
      v: 1,
      ...savedDefault,
      background: { type: "gradient", angle: 90, stops: [{ offset: 0 }] },
    }),
  ],
  [
    "a border colour that is not hex",
    JSON.stringify({ v: 1, ...savedDefault, border: { width: 0, color: "red" } }),
  ],
  ["an unknown Browser window", JSON.stringify({ v: 1, ...savedDefault, browserWindow: "sepia" })],
])("parseSavedComposition refuses %s", (_name, raw) => {
  expect(parseSavedComposition(raw)).toBe("refuse");
});

test("applySavedComposition writes every field through the Session writers", async () => {
  const saved: SavedComposition = {
    width: 1080,
    height: 1920,
    background: { type: "solid", color: "#09090B" },
    padding: 64,
    scale: 1.25,
    position: { x: -40, y: 12 },
    shadow: { offset: 8, blur: 24, opacity: 0.5 },
    border: { width: 4, color: "#FF0000" },
    radius: 24,
    browserWindow: "light",
    url: "example.com",
  };
  const session = await createSession({ defaultSolid, store: emptyStore() });

  applySavedComposition(session, saved);

  expect(session.composition).toEqual({ ...saved, screenshot: null });
});

test("a field a writer refuses stays on its default", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });

  applySavedComposition(session, { ...savedDefault, padding: -1, scale: 1.5 });

  expect(session.composition.padding).toBe(defaultComposition.padding);
  expect(session.composition.scale).toBe(1.5);
});

test("an image Background is only restored while its Uploaded background exists", async () => {
  const session = await createSession({ defaultSolid, store: emptyStore() });
  const uploaded = await session.uploadBackground(imageBlob(40, 40), "bg.png");
  if (!isUploaded(uploaded)) {
    throw new Error("expected an upload");
  }

  applySavedComposition(session, {
    ...savedDefault,
    background: { type: "image", id: uploaded.id },
  });
  expect(session.composition.background).toEqual({ type: "image", id: uploaded.id });

  const fresh = await createSession({ defaultSolid, store: emptyStore() });
  applySavedComposition(fresh, { ...savedDefault, background: { type: "image", id: "gone" } });
  expect(fresh.composition.background).toEqual(defaultSolid);
});
