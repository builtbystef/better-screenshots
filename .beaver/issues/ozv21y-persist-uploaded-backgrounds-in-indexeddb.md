---
id: ozv21y
title: Persist uploaded Backgrounds in IndexedDB
state: todo
priority: high
depends_on:
    - hbbrwg
    - 5ccqr2
parent: erb9py
created: 2026-08-19T06:07:57Z
updated: 2026-08-19T06:07:57Z
---

## What to build

Uploaded Background images survive a browser refresh because the production store is IndexedDB: one object store, the Blob on the record. The session already treats a second `createSession` as a refresh; this slice is that store. `navigator.storage.persist()` is not used. There is no count cap and no per-file size limit.

## Acceptance criteria

- [ ] Two `createSession` calls against this store see the same uploads: after an upload in the first, the second lists that record’s `id`, `filename`, intrinsic size, `byteLength`, and Blob.
- [ ] After `removeBackground` in one session, a new session against this store does not list that record.
- [ ] Quota and unavailable from this store still surface as `"refuse"` on upload and remove, same as the store double.
