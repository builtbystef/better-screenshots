import { IDBFactory, IDBObjectStore } from "fake-indexeddb";
import { expect, test } from "vite-plus/test";
import { createIndexedDbStore } from "./indexed-db-store";
import { createSession } from "./session";
import { defaultSolid, isUploaded, pngBlob } from "./test/helpers";

function indexedDbStore() {
  globalThis.indexedDB = new IDBFactory();
  return createIndexedDbStore();
}

async function blobBytes(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer());
}

test("two createSession calls against the IndexedDB store see the same upload", async () => {
  const store = indexedDbStore();
  const first = await createSession({ defaultSolid, store });
  const file = pngBlob(100, 80);
  const uploaded = await first.uploadBackground(file, "wall.png");
  expect(isUploaded(uploaded)).toBe(true);
  if (!isUploaded(uploaded)) {
    return;
  }

  const second = await createSession({ defaultSolid, store });
  expect(second.uploadedBackgrounds).toHaveLength(1);
  const listed = second.uploadedBackgrounds[0];
  expect(listed?.id).toBe(uploaded.id);
  expect(listed?.filename).toBe("wall.png");
  expect(listed?.width).toBe(100);
  expect(listed?.height).toBe(80);
  expect(listed?.byteLength).toBe(file.size);
  expect(listed && (await blobBytes(listed.blob))).toEqual(await blobBytes(file));
});

test("a new session against the IndexedDB store does not list a removed Background", async () => {
  const store = indexedDbStore();
  const first = await createSession({ defaultSolid, store });
  const uploaded = await first.uploadBackground(pngBlob(100, 80), "wall.png");
  expect(isUploaded(uploaded)).toBe(true);
  if (!isUploaded(uploaded)) {
    return;
  }

  expect(await first.removeBackground(uploaded.id)).toBe("ok");

  const second = await createSession({ defaultSolid, store });
  expect(second.uploadedBackgrounds).toEqual([]);
});

test("upload and remove refuse when IndexedDB is unavailable", async () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "indexedDB");
  Object.defineProperty(globalThis, "indexedDB", { configurable: true, value: undefined });
  try {
    const session = await createSession({ defaultSolid, store: createIndexedDbStore() });
    expect(session.uploadedBackgrounds).toEqual([]);
    expect(await session.uploadBackground(pngBlob(100, 80), "wall.png")).toBe("unavailable");
    expect(await session.removeBackground("missing")).toBe("refuse");
  } finally {
    if (previous === undefined) {
      Reflect.deleteProperty(globalThis, "indexedDB");
    } else {
      Object.defineProperty(globalThis, "indexedDB", previous);
    }
  }
});

function objectStoreMethod(name: "put" | "delete") {
  const descriptor = Object.getOwnPropertyDescriptor(IDBObjectStore.prototype, name);
  if (descriptor === undefined) {
    throw new Error(`expected IDBObjectStore.prototype.${name}`);
  }
  return descriptor;
}

function stubObjectStoreMethod(name: "put" | "delete", error: DOMException) {
  Object.defineProperty(IDBObjectStore.prototype, name, {
    configurable: true,
    writable: true,
    value: () => {
      throw error;
    },
  });
}

test("upload refuses when the IndexedDB store hits quota or is unavailable", async () => {
  const store = indexedDbStore();
  const session = await createSession({ defaultSolid, store });
  const original = objectStoreMethod("put");
  try {
    stubObjectStoreMethod(
      "put",
      new DOMException("The quota has been exceeded.", "QuotaExceededError"),
    );
    expect(await session.uploadBackground(pngBlob(100, 80), "one.png")).toBe("quota");
    expect(session.uploadedBackgrounds).toEqual([]);

    stubObjectStoreMethod(
      "put",
      new DOMException("The database is not available.", "UnknownError"),
    );
    expect(await session.uploadBackground(pngBlob(50, 40), "two.png")).toBe("unavailable");
    expect(session.uploadedBackgrounds).toEqual([]);
  } finally {
    Object.defineProperty(IDBObjectStore.prototype, "put", original);
  }
});

test("remove refuses when the IndexedDB store is unavailable", async () => {
  const store = indexedDbStore();
  const session = await createSession({ defaultSolid, store });
  const uploaded = await session.uploadBackground(pngBlob(100, 80), "wall.png");
  expect(isUploaded(uploaded)).toBe(true);
  if (!isUploaded(uploaded)) {
    return;
  }
  const original = objectStoreMethod("delete");
  stubObjectStoreMethod(
    "delete",
    new DOMException("The database is not available.", "UnknownError"),
  );
  try {
    expect(await session.removeBackground(uploaded.id)).toBe("refuse");
    expect(session.uploadedBackgrounds).toEqual([uploaded]);
  } finally {
    Object.defineProperty(IDBObjectStore.prototype, "delete", original);
  }
});
