---
id: 5ccqr2
title: Upload and remove Background images across a refresh
state: done
assignee: agent
priority: high
depends_on:
    - hbbrwg
    - efoqxv
parent: erb9py
created: 2026-08-19T06:07:54Z
updated: 2026-08-19T08:26:17Z
---

## What to build

The user uploads Background images and removes ones they are not using. An upload decodes, then persists; it does not change the Composition’s Background. A second session on the same store is a refresh: the uploads are still there, the Composition is not. Removing the image that is the current Background is refused.

## Acceptance criteria

- [ ] `uploadBackground` of a decodable non-`0×0` image returns a record with a unique `id`, the given `filename`, `addedAt` at the write, the image’s intrinsic `width` and `height`, `byteLength` from the Blob, and that Blob. `composition.background` is unchanged.
- [ ] Two uploads of the same bytes are two records.
- [ ] An undecodable Blob or a `0×0` image returns `"refuse"` and stores nothing.
- [ ] When the store `put` returns `"quota"` or `"unavailable"`, the upload returns `"refuse"`, stores nothing, and leaves already-stored records in place.
- [ ] When `createSession` saw an unavailable store, `uploadBackground` returns `"refuse"`.
- [ ] `removeBackground` of an id that is not the current image Background removes that record. A later `createSession` on the same store does not list it.
- [ ] `removeBackground` returns `"refuse"` when `composition.background` is `{ type: "image", id }` for that id, or when the store is unavailable. The record stays.
- [ ] A second `createSession` on the same store lists the uploads this session wrote, and has a fresh default Composition.

## Notes

**agent** — 2026-08-19T08:26:15Z

# Done

`uploadBackground` and `removeBackground` on the `createSession` / `StudioSession` seam (`apps/web/src/session.ts`). Tests target that seam only (`apps/web/src/session.test.ts`). A store double is the refresh: a second `createSession` on the same store lists this session's uploads and opens a fresh default Composition.

An upload decodes (`createImageBitmap`), then persists. The record has a unique `id` (`crypto.randomUUID()`), the given `filename`, `addedAt` at the write, intrinsic size, `byteLength` from the Blob, and that Blob. `composition.background` is unchanged. Two uploads of the same bytes are two records.

Refuse and store nothing when: not decodable or `0×0`; `put` returns `"quota"` or `"unavailable"` (already-stored records stay); `createSession` saw an unavailable store.

`removeBackground` of an unused id drops the record from this session and from a later session on the same store. Refuse (record stays) when that id is the current image Background, when `createSession` saw an unavailable store, or when `remove` returns `"unavailable"`.

# Decisions

- Seam is the one the spec named: `createSession` / `StudioSession`. No IndexedDB assertions.
- A list that was `"unavailable"` at create makes later upload and remove refuse without calling the store.
- IndexedDB (ozv21y) and render/export (4e4zrp) stay on those issues.
