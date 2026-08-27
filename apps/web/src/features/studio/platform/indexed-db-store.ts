import type {
  UploadedBackground,
  UploadedBackgroundStore,
} from "@/features/studio/composition/session";

const DB_NAME = "better-screenshots";
const DB_VERSION = 1;
const STORE_NAME = "uploaded-backgrounds";

export function createIndexedDbStore(
  factory: IDBFactory = globalThis.indexedDB,
): UploadedBackgroundStore {
  return {
    async list() {
      try {
        const db = await openDatabase(factory);
        try {
          return await run(db, "readonly", (store) => store.getAll());
        } finally {
          db.close();
        }
      } catch {
        return "unavailable";
      }
    },
    async put(record: UploadedBackground) {
      try {
        const db = await openDatabase(factory);
        try {
          await run(db, "readwrite", (store) => store.put(record));
          return "ok";
        } finally {
          db.close();
        }
      } catch (error) {
        return isQuotaExceeded(error) ? "quota" : "unavailable";
      }
    },
    async get(id: string) {
      try {
        const db = await openDatabase(factory);
        try {
          return await run(db, "readonly", (store) => store.get(id));
        } finally {
          db.close();
        }
      } catch {
        return "unavailable";
      }
    },
    async remove(id: string) {
      try {
        const db = await openDatabase(factory);
        try {
          await run(db, "readwrite", (store) => store.delete(id));
          return "ok";
        } finally {
          db.close();
        }
      } catch {
        return "unavailable";
      }
    },
  };
}

function isQuotaExceeded(error: unknown): boolean {
  return error instanceof DOMException && error.name === "QuotaExceededError";
}

function openDatabase(factory: IDBFactory): Promise<IDBDatabase> {
  if (factory === undefined) {
    return Promise.reject(new Error("unavailable"));
  }
  return new Promise((resolve, reject) => {
    let request: IDBOpenDBRequest;
    try {
      request = factory.open(DB_NAME, DB_VERSION);
    } catch (error) {
      reject(error);
      return;
    }
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      reject(request.error ?? new Error("unavailable"));
    };
    request.onblocked = () => {
      reject(new Error("unavailable"));
    };
  });
}

function run<T>(
  db: IDBDatabase,
  mode: IDBTransactionMode,
  execute: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    let request: IDBRequest<T>;
    try {
      request = execute(tx.objectStore(STORE_NAME));
    } catch (error) {
      reject(error);
      return;
    }
    let result: T;
    request.onsuccess = () => {
      result = request.result;
    };
    request.onerror = () => {
      reject(request.error ?? new Error("unavailable"));
    };
    tx.oncomplete = () => {
      resolve(result);
    };
    tx.onabort = () => {
      reject(tx.error ?? request.error ?? new Error("unavailable"));
    };
    tx.onerror = () => {
      reject(tx.error ?? new Error("unavailable"));
    };
  });
}
