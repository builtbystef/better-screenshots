---
id: ozv21y
title: Persist uploaded Backgrounds in IndexedDB
state: done
assignee: agent
priority: high
depends_on:
    - hbbrwg
    - 5ccqr2
parent: erb9py
created: 2026-08-19T06:07:57Z
updated: 2026-08-19T08:41:56Z
---

## What to build

Uploaded Background images survive a browser refresh because the production store is IndexedDB: one object store, the Blob on the record. The session already treats a second `createSession` as a refresh; this slice is that store. `navigator.storage.persist()` is not used. There is no count cap and no per-file size limit.

## Acceptance criteria

- [ ] Two `createSession` calls against this store see the same uploads: after an upload in the first, the second lists that record’s `id`, `filename`, intrinsic size, `byteLength`, and Blob.
- [ ] After `removeBackground` in one session, a new session against this store does not list that record.
- [ ] Quota and unavailable from this store still surface as `"refuse"` on upload and remove, same as the store double.

## Notes

**agent** — 2026-08-19T08:41:56Z

# Done

Production `UploadedBackgroundStore` is `createIndexedDbStore` (`apps/web/src/indexed-db-store.ts`). Tests still target `createSession` / `StudioSession` (`apps/web/src/indexed-db-store.test.ts`), now with this store instead of a double.

Two `createSession` calls against the same store see the same upload: `id`, `filename`, intrinsic size, `byteLength`, and Blob bytes. `removeBackground` drops the record for a later session. Quota (`QuotaExceededError`) and unavailable (missing IndexedDB, or any other write error) surface as `"refuse"` on upload and remove.

# Decisions

- Seam is `createSession` / `StudioSession` with `createIndexedDbStore`. No assertions on object-store names or private helpers.
- One IndexedDB database (`better-screenshots`), one object store (`uploaded-backgrounds`), keyPath `id`, the Blob on the record. `navigator.storage.persist()` is not used. No count cap, no per-file size limit.
- Tests run in the default `node` environment (not jsdom): jsdom's Blob does not survive `structuredClone`, so fake-indexeddb would return an empty object. Node's Blob clones. Decode still uses the hbbrwg polyfill (`@napi-rs/canvas` `loadImage`).
- `fake-indexeddb@6.2.5` is a catalog-pinned test-only dep of `apps/web`. Each test installs a fresh `IDBFactory` on `globalThis.indexedDB`.
- Quota and write-unavailable are induced by stubbing the IDB write to throw; missing `indexedDB` is the unavailable-at-create path.
- `get` is implemented on the port (render will need it) but is not asserted in this slice.
