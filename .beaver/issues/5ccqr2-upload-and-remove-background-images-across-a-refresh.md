---
id: 5ccqr2
title: Upload and remove Background images across a refresh
state: todo
priority: high
depends_on:
    - hbbrwg
    - efoqxv
parent: erb9py
created: 2026-08-19T06:07:54Z
updated: 2026-08-19T06:07:54Z
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
