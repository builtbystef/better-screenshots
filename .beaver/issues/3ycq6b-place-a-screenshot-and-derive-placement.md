---
id: 3ycq6b
title: Place a Screenshot and derive placement
state: done
assignee: agent
priority: high
depends_on:
    - hbbrwg
    - efoqxv
parent: erb9py
created: 2026-08-19T06:07:54Z
updated: 2026-08-19T07:33:27Z
---

## What to build

The user places one Screenshot. The session walks the given Blobs and keeps the first decodable image whose intrinsic size is not `0×0`. A successful place replaces the current Screenshot and keeps Padding, Scale, Position, and Effects. An empty list or nothing decodable is refused and the Composition does not change. After a successful place, `placement` is derived from the current Composition and that Screenshot’s intrinsic size.

## Acceptance criteria

- [ ] `placeScreenshot` of one decodable image returns `"ok"` and sets `screenshot` to that Blob.
- [ ] A second successful place swaps the Screenshot and leaves Padding, Scale, Position, shadow, border, and radius unchanged.
- [ ] An empty list, an undecodable Blob, a `0×0` image, or a list whose only images are those, returns `"refuse"` and leaves the Composition unchanged.
- [ ] Given several Blobs, the first decodable non-`0×0` image is the one placed; earlier bad sources are skipped.
- [ ] Default frame 1920×1080, padding 120, no Screenshot → `placement` is null. After placing an `800×600` Screenshot at scale 1 and Position `0, 0`: `inner` is `{ x: 120, y: 120, width: 1680, height: 840 }`, `fitted` is `{ width: 1120, height: 840 }`, `drawn` is `{ x: 400, y: 120, width: 1120, height: 840 }`.
- [ ] `setPadding(10000)` then the same Screenshot: effective padding is `539.5`, `inner` is `{ x: 539.5, y: 539.5, width: 841, height: 1 }`, stored `padding` stays `10000`.
- [ ] Same default inner, Screenshot `800×600`, `setScale(2)`, Position `0, 0`: `drawn` is `{ x: -160, y: -300, width: 2240, height: 1680 }`.
- [ ] Same default inner and Screenshot, scale 1, `setPosition(100, -50)`: `drawn` is `{ x: 500, y: 70, width: 1120, height: 840 }`.

## Notes

**agent** — 2026-08-19T07:16:57Z

Blocked on hbbrwg (in-progress, needs-review). placeScreenshot must walk Blobs and keep the first decodable non-0×0 image; that decode path is the hbbrwg verdict (jsdom + @napi-rs/canvas under vp test) and is not approved yet. efoqxv is done. Stopping until hbbrwg is closed.

**agent** — 2026-08-19T07:33:27Z

# Done

`placeScreenshot` walks the given Blobs on the `createSession` / `StudioSession` seam (`apps/web/src/session.ts`). Tests target that seam only (`apps/web/src/session.test.ts`).

A successful place stores that Blob as `screenshot` and keeps Padding, Scale, Position, and Effects. An empty list, an undecodable Blob, a 0×0 image, or a list of only those, returns `"refuse"` and leaves the Composition unchanged. Several sources: the first decodable non-0×0 image is placed; earlier bad sources are skipped.

`placement` is null while `screenshot` is null. After a successful place it is a getter from the stored intrinsic size and the current Composition (worked examples: default 800×600, padding 10000 clamp, scale 2, Position 100,-50). Stored padding is not rewritten by the inner-rect clamp.

# Decisions

- Decode is `createImageBitmap` in production. No Node fallback in app code.
- Tests run under `environment: "jsdom"` with a test-only `createImageBitmap` polyfill (`@napi-rs/canvas` `loadImage`). Matches the hbbrwg verdict. No production draw library.
- `jsdom@30.0.1` and `@napi-rs/canvas@1.0.6` are catalog-pinned test-only deps of `apps/web`.
- No `canvas` shim in this slice: place only needs decode, not `getContext` / `toBlob`. Render/export (4e4zrp) still needs that shim.
- 0×0 fixture is an SVG with width/height 0. A 0×0 PNG IHDR does not decode.

# Reviewer

This sandbox could not `pnpm add` against the original store path. The lockfile was updated with `--lockfile-only`. A normal `pnpm install` pulls the two new test deps.
