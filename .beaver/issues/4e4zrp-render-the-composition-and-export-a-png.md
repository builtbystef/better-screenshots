---
id: 4e4zrp
title: Render the Composition and Export a PNG
state: done
assignee: agent
priority: high
depends_on:
    - hbbrwg
    - efoqxv
    - 3ycq6b
    - 5ccqr2
parent: erb9py
created: 2026-08-19T06:07:57Z
updated: 2026-08-19T08:59:38Z
---

## What to build

The user sees one Canvas 2D bitmap at frame × 2 and Exports that same bitmap as a PNG. Preview and Export share the bitmap. There is no Screenshot: Export writes no file. A missing image Background paints the session’s default solid and does not rewrite the Composition. Draw uses the Background value on the Composition; it never looks up a Catalog.

## Acceptance criteria

- [ ] `render` returns a canvas of width `composition.width × 2` and height `composition.height × 2`. On the default frame that is `3840×2160`. Every CSS-pixel length is multiplied by 2 when painting. Smoothing is on, at the highest quality the engine offers.
- [ ] Paint order: Background fills the frame; if a Screenshot is present, shadow of the outer rounded rect, then the border ring, then the Screenshot clipped to the inner rounded rect. Screenshot alpha composites over the Background. The frame clips everything. Effects do not apply when the Screenshot is absent.
- [ ] Shadow is `rgb(0,0,0)` at the stored opacity, offset `+x` and `+y`, blur as given. Offset `0` and blur `0` is no shadow. A glow (offset `0`, blur `> 0`) is allowed. Offset, blur, border width, and radius do not change with Scale. Zeros are off; there are no on/off flags. No extra clamp on radius or border.
- [ ] Drawn `{ x: 400, y: 120, width: 1120, height: 840 }`, border width `8`, radius `16` → outer rect `{ x: 392, y: 112, width: 1136, height: 856 }`, outer radius `24`. Width `0` → outer equals drawn.
- [ ] Gradient `0deg` on the default frame → start `(960, 1080)`, end `(960, 0)`. Gradient `90deg` → start `(0, 540)`, end `(1920, 540)`. Stops apply at their offsets as given.
- [ ] Image Background `1000×2000` on the default frame is cover-center: drawn size `1920×3840`, top-left `{ x: 0, y: -1380 }`. That crop is not a stored field.
- [ ] A missing or unavailable image id fills with the session’s default solid and does not rewrite `composition.background`.
- [ ] `exportPng` returns `"refuse"` when `screenshot` is null.
- [ ] `exportPng` at local `2026-08-19 14:05:03` returns filename `better-screenshots-2026-08-19T140503.png` and `image/png` from the same bitmap `render` produces (no quality argument). Two Exports in the same second may share a name.

## Notes

**agent** — 2026-08-19T08:59:38Z

# Done

`render` and `exportPng` on the `createSession` / `StudioSession` seam (`apps/web/src/session.ts`). Tests target that seam only (`apps/web/src/session.test.ts`).

`render` returns a Canvas 2D bitmap at frame × 2 (default 3840×2160). Every CSS-pixel length is multiplied by 2. Smoothing is on at `high`. Paint order: Background fills the frame; if a Screenshot is present, shadow of the outer rounded rect, then the border ring, then the Screenshot clipped to the inner rounded rect. Screenshot alpha composites over the Background. The frame clips everything. Effects do not apply when the Screenshot is absent.

Shadow is `rgb(0,0,0)` at the stored opacity, offset `+x` `+y`, blur as given. Offset 0 and blur 0 is no shadow. A glow (offset 0, blur > 0) is painted. Offset, blur, border width, and radius do not change with Scale. Zeros are off. No extra clamp on radius or border.

Image Backgrounds load through `store.get`. Missing or unavailable ids fill the session's default solid and do not rewrite `composition.background`. Cover-center crop is computed at paint time. Gradients use the spec's CSS line (0deg start `(960, 1080)` end `(960, 0)`; 90deg start `(0, 540)` end `(1920, 540)`). Draw uses the Background value on the Composition; it never looks up a Catalog.

`exportPng` returns `"refuse"` when `screenshot` is null. Otherwise it encodes `image/png` from the same `render` bitmap (no quality argument). Filename from `now` in local time: `better-screenshots-YYYY-MM-DDTHHMMSS.png`. Two Exports in the same second may share a name.

# Decisions

- Seam is the one the spec named: `createSession` / `StudioSession`. Tests sample pixels and Export blob type / size / filename. No full-bitmap snapshots, no canvas call-order assertions, no private helpers.
- Production draw is Canvas 2D + `createImageBitmap`. No Node fallback. No production draw library.
- Shadow is two-pass on an offscreen canvas (`destination-out` punches the shape) so a transparent Screenshot still composites over the Background, and a rounded clip does not cut the drop shadow (ADR 0001).
- Tests run under `environment: "jsdom"`. A test-only `canvas` shim (`apps/web/src/test/canvas-shim`) wraps `@napi-rs/canvas` with callback `toBuffer` so jsdom `getContext` / `toBlob` work. `globalSetup` (`apps/web/src/test/ensure-canvas-shim.ts`) symlinks that shim next to jsdom before the suite loads. Matches the hbbrwg verdict.

# Reviewer

`vp test` creates `node_modules/.pnpm/jsdom@30.0.1/node_modules/canvas` as a symlink. It is not in git. A later `pnpm install` may drop it; the next `vp test` puts it back.
