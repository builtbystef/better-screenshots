import { createCanvas } from "@napi-rs/canvas";
import { IDBFactory } from "fake-indexeddb";
import { expect, test } from "vite-plus/test";
import { createIndexedDbStore } from "./indexed-db-store";
import { createSession } from "./session";
import { defaultSolid, isUploaded, pngBlob } from "./test/helpers";

function indexedDbStore(factory: IDBFactory = new IDBFactory()) {
  return createIndexedDbStore(factory);
}

function createTestCanvas() {
  return createCanvas(1, 1) as unknown as HTMLCanvasElement;
}

function pixelAt(canvas: HTMLCanvasElement, x: number, y: number) {
  const context = canvas.getContext("2d");
  if (context === null) {
    throw new Error("expected a 2d context");
  }
  return [...context.getImageData(x * 2, y * 2, 1, 1).data];
}

test("two createSession calls against the IndexedDB store see the same upload", async () => {
  const store = indexedDbStore();
  const first = await createSession({ defaultSolid, store });
  const file = pngBlob(100, 80, (context) => {
    context.fillStyle = "#ff0000";
    context.fillRect(0, 0, 100, 80);
  });
  const uploaded = await first.uploadBackground(file, "wall.png");
  expect(isUploaded(uploaded)).toBe(true);
  if (!isUploaded(uploaded)) {
    return;
  }

  const second = await createSession({ defaultSolid, store, createCanvas: createTestCanvas });
  expect(second.uploadedBackgrounds).toHaveLength(1);
  const listed = second.uploadedBackgrounds[0];
  expect(listed?.id).toBe(uploaded.id);
  expect(listed?.filename).toBe("wall.png");
  expect(listed?.width).toBe(100);
  expect(listed?.height).toBe(80);
  expect(listed?.byteLength).toBe(file.size);

  expect(second.setBackground({ type: "image", id: uploaded.id })).toBe("ok");
  const canvas = await second.render();
  expect(pixelAt(canvas, 960, 540)).toEqual([0xff, 0, 0, 0xff]);
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

type FailureDelivery = "request-error" | "abort";

function requestStub<T>(result: T, error: DOMException | null = null): IDBRequest<T> {
  return {
    error,
    onerror: null,
    onsuccess: null,
    readyState: "pending",
    result,
    source: null,
    transaction: null,
  } as unknown as IDBRequest<T>;
}

function factoryWithWriteFailure(delivery: FailureDelivery, error: DOMException): IDBFactory {
  const writeRequest = requestStub<IDBValidKey>(undefined as unknown as IDBValidKey, error);
  const transaction = {
    error: delivery === "abort" ? error : null,
    onabort: null,
    oncomplete: null,
    onerror: null,
    objectStore: () => ({
      put: () => {
        queueMicrotask(() => {
          if (delivery === "request-error") {
            writeRequest.onerror?.(new Event("error"));
          } else {
            transaction.onabort?.(new Event("abort"));
          }
        });
        return writeRequest;
      },
    }),
  } as unknown as IDBTransaction;
  const database = {
    close() {},
    transaction: () => transaction,
  } as unknown as IDBDatabase;
  const openRequest = requestStub(database) as IDBOpenDBRequest;
  return {
    open: () => {
      queueMicrotask(() => openRequest.onsuccess?.(new Event("success")));
      return openRequest;
    },
  } as unknown as IDBFactory;
}

function blockedFactory(): IDBFactory {
  const openRequest = requestStub<IDBDatabase>(
    undefined as unknown as IDBDatabase,
  ) as IDBOpenDBRequest;
  return {
    open: () => {
      queueMicrotask(() =>
        openRequest.onblocked?.(new Event("blocked") as unknown as IDBVersionChangeEvent),
      );
      return openRequest;
    },
  } as unknown as IDBFactory;
}

const record = {
  id: "background-1",
  filename: "wall.png",
  addedAt: new Date("2026-08-26T00:00:00Z"),
  width: 100,
  height: 80,
  byteLength: 1,
  blob: new Blob([new Uint8Array([0])], { type: "image/png" }),
};

test("an asynchronous IndexedDB quota error refuses the write as quota", async () => {
  const quota = new DOMException("The quota has been exceeded.", "QuotaExceededError");

  expect(
    await createIndexedDbStore(factoryWithWriteFailure("request-error", quota)).put(record),
  ).toBe("quota");
  expect(await createIndexedDbStore(factoryWithWriteFailure("abort", quota)).put(record)).toBe(
    "quota",
  );
});

test("an asynchronous non-quota IndexedDB abort refuses the write as unavailable", async () => {
  const unavailable = new DOMException("The database is not available.", "UnknownError");

  expect(
    await createIndexedDbStore(factoryWithWriteFailure("abort", unavailable)).put(record),
  ).toBe("unavailable");
});

test("a blocked IndexedDB open settles as unavailable", async () => {
  expect(await createIndexedDbStore(blockedFactory()).list()).toBe("unavailable");
});

test("a corrupt stored image paints the default Background instead of transparency", async () => {
  const store = indexedDbStore();
  expect(await store.put(record)).toBe("ok");
  const session = await createSession({ defaultSolid, store, createCanvas: createTestCanvas });
  expect(session.setBackground({ type: "image", id: record.id })).toBe("ok");

  const canvas = await session.render();

  expect(pixelAt(canvas, 960, 540)).toEqual([0x11, 0x22, 0x33, 0xff]);
});
