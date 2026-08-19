---
id: erb9py
title: First-ship Composition, draw, and Export
state: todo
labels:
    - spec
depends_on:
    - bdkac8
    - dm1i0g
    - 0abxd5
    - y7ac9r
    - eivufq
    - cx9cwz
    - w0i92g
    - dt8gtk
    - qjw6h1
    - vfgwur
created: 2026-08-19T05:44:11Z
updated: 2026-08-19T05:44:11Z
---

# First-ship Composition, draw, and Export

## Problem Statement

A developer has a Screenshot and needs a polished image for a launch post or landing page. They do not want a graphics editor, an account, or a backend. They want to drop the Screenshot on a Background, tweak a few treatments, and leave with a file.

## Solution

The Studio is a single sitting: place one Screenshot (picker, drop, or paste), sit it on a solid, a gradient, or a Background image they uploaded, adjust Padding, Scale, Position, shadow, border, and rounded corners, and Export one PNG. They can do that again in the same visit. Refresh drops the Composition; uploaded Background images remain.

## User Stories

1. As a developer, I want to place one Screenshot from a file picker, a drop, or `Ctrl`/`Cmd`+`V`, so that I can start from whatever I already have.
2. As a developer, I want a new Screenshot to replace the current one and keep Padding, Scale, Position, and Effects, so that I can try another capture without resetting the sitting.
3. As a developer, I want a missing, empty, or undecodable source to leave the Composition unchanged, so that a bad paste or drop does not wreck the sitting.
4. As a developer, I want the empty Studio to start on the Catalog default solid, so that the frame is a finished Background before I place anything.
5. As a developer, I want to set the Background to a Catalog solid, a Catalog gradient, or any `#RRGGBB` solid, so that I can match a simple brand color without authoring a gradient.
6. As a developer, I want to upload a Background image and have it survive a refresh, so that a custom backdrop is not re-chosen every visit.
7. As a developer, I want to remove an uploaded Background I am not using, so that a bad or huge upload is not stuck.
8. As a developer, I want to adjust Padding, Scale, Position, shadow, border, and rounded corners live, so that the sitting is two minutes and has no undo.
9. As a developer, I want the preview to be the same bitmap as the Export, so that I am not surprised by the file.
10. As a developer, I want one PNG Export at frame × 2 with a timestamped name, so that I can save several sittings in one visit.
11. As a developer, I want Export to write no file when there is no Screenshot, so that a Background-only rectangle is not the sitting.

## Implementation Decisions

The Studio holds one in-memory **session**. That session is the only public seam. IndexedDB sits behind it. The Catalog is a finite list of Background values the picker writes; draw never looks one up. This spec does not name Catalog colors. The session is created with the Catalog default solid.

Draw lives in the Studio app, not a workspace package. Preview and Export share one Canvas 2D bitmap. No new library.

### Types

```ts
type HexColor = string
// Exactly "#" plus 6 hex digits. A–F case is kept as given. Not "#RGB", not alpha.

type SolidBackground = { type: "solid"; color: HexColor }

type GradientStop = { offset: number; color: HexColor }
// offset in [0, 1]

type GradientBackground = {
  type: "gradient"
  angle: number // CSS degrees; 0 is up, 90 is right; finite
  stops: GradientStop[] // two or more
}

type ImageBackground = { type: "image"; id: string } // non-empty

type Background = SolidBackground | GradientBackground | ImageBackground

type Composition = {
  width: number // CSS px, > 0
  height: number // CSS px, > 0
  background: Background
  screenshot: Blob | null
  padding: number // CSS px, ≥ 0
  scale: number // unitless, > 0
  position: { x: number; y: number } // CSS px from the frame center
  shadow: { offset: number; blur: number; opacity: number }
  border: { width: number; color: HexColor }
  radius: number // CSS px, ≥ 0
}

type UploadedBackground = {
  id: string
  filename: string
  addedAt: Date
  width: number
  height: number
  byteLength: number
  blob: Blob
}

type Rect = { x: number; y: number; width: number; height: number }
// x, y are the top-left of the frame, CSS px, +x right, +y down.

type Placement = {
  inner: Rect
  fitted: { width: number; height: number }
  drawn: Rect
}

type Refuse = "refuse"
```

### Store port (constructor only)

Tests do not target this. It exists so a second session is a refresh.

```ts
type UploadedBackgroundStore = {
  list(): Promise<UploadedBackground[] | "unavailable">
  put(record: UploadedBackground): Promise<"ok" | "quota" | "unavailable">
  get(id: string): Promise<UploadedBackground | undefined | "unavailable">
  remove(id: string): Promise<"ok" | "unavailable">
}
```

### Session

```ts
type StudioSession = {
  readonly composition: Composition
  readonly uploadedBackgrounds: readonly UploadedBackground[]
  readonly placement: Placement | null

  placeScreenshot(sources: readonly Blob[]): Promise<"ok" | Refuse>
  setBackground(background: Background): "ok" | Refuse
  uploadBackground(file: Blob, filename: string): Promise<UploadedBackground | Refuse>
  removeBackground(id: string): Promise<"ok" | Refuse>
  setPadding(value: number): "ok" | Refuse
  setScale(value: number): "ok" | Refuse
  setPosition(x: number, y: number): "ok" | Refuse
  setShadow(offset: number, blur: number, opacity: number): "ok" | Refuse
  setBorder(width: number, color: HexColor): "ok" | Refuse
  setRadius(value: number): "ok" | Refuse
  render(): Promise<HTMLCanvasElement>
  exportPng(now: Date): Promise<{ blob: Blob; filename: string } | Refuse>
}

function createSession(options: {
  defaultSolid: SolidBackground
  store: UploadedBackgroundStore
}): Promise<StudioSession>
```

`createSession` reads the store. Unavailable → `uploadedBackgrounds` is empty; later uploads refuse. The Composition is always a fresh default, never restored.

**Default Composition:** `width` 1920, `height` 1080, `background` the given default solid, `screenshot` null, `padding` 120, `scale` 1, `position` `{ x: 0, y: 0 }`, `shadow` `{ offset: 16, blur: 32, opacity: 0.25 }`, `border` `{ width: 0, color: "#FFFFFF" }`, `radius` 16. First ship has no frame-size command.

`placement` is null when `screenshot` is null. After a successful place it is derived from the current Composition and that Screenshot’s intrinsic size.

### Sources

Picker, drop, and paste collect image `Blob`s and call `placeScreenshot`. Text is never a source. `placeScreenshot` walks `sources` and takes the first decodable image whose intrinsic size is not `0×0`. A successful place swaps the Screenshot handle and keeps Padding, Scale, Position, and Effects. There is no clear. Empty list or nothing decodable → `"refuse"`, Composition unchanged.

### Background commands

`setBackground` writes a value. Solid: any `#RRGGBB`. Gradient: catalog-shaped values only (two or more stops, offsets in `[0, 1]`, finite angle, each color `#RRGGBB`). Image: a non-empty id; the record need not exist yet.

`uploadBackground` decodes, then persists. It does not change `composition.background`. Record: unique `id`, given `filename`, `addedAt` at the write, intrinsic `width` / `height`, `byteLength` from the Blob, the original Blob. Duplicates are two records. Refuse and store nothing when: not decodable or `0×0`; store returns `"quota"` or `"unavailable"`. Quota leaves what is already stored.

`removeBackground` returns `"refuse"` when `composition.background` is `{ type: "image", id }` for that id, or when the store is unavailable. Otherwise the record is gone. No live tab sync: each session reads the store on create, after its own upload, and after its own remove.

### Field commands

Refuse and leave the Composition unchanged when the value is out of range. Stored Padding is not rewritten by the inner-rect clamp.

- `setPadding`: refuse `< 0` or non-finite.
- `setScale`: refuse `≤ 0` or non-finite.
- `setPosition`: refuse non-finite.
- `setShadow`: refuse `offset < 0`, `blur < 0`, `opacity` outside `[0, 1]`, or non-finite. Color is not a field; it is black.
- `setBorder`: refuse `width < 0`, non-finite width, or a color that is not `#RRGGBB`. Style is solid.
- `setRadius`: refuse `< 0` or non-finite.

Zeros are off. There are no on/off flags. Offset, blur, width, and radius do not change with Scale.

### Placement (CSS pixels of the frame)

Origin of Position is the frame center. Rects below use the top-left of the frame.

Effective padding `p = min(padding, (min(width, height) − 1) / 2)`.

- `inner` = frame inset by `p` on all four sides. At least `1×1`.
- `fitted` = intrinsic Screenshot size contained in `inner`, aspect kept: `k = min(inner.width / sw, inner.height / sh)`, fitted = `(sw · k, sh · k)`.
- Drawn size = fitted × Scale. Drawn center = `(width / 2 + position.x, height / 2 + position.y)`. `drawn` is that size, top-left at center minus half the drawn size.

An image Background is cover, cropped from the center: `k = max(width / iw, height / ih)`, the image is drawn at `(iw · k, ih · k)` centered on the frame. That crop is not a stored field.

### Paint

`render` returns a canvas whose width and height are `composition.width × 2` and `composition.height × 2`. Every CSS-pixel length is multiplied by 2 when painting. Preview displays this canvas. Smoothing is on, at the highest quality the engine offers. Screenshot alpha composites over the Background.

Paint order:

1. Background fills the frame. Missing or unavailable image id: fill with the session’s default solid; do not rewrite `composition.background`.
2. If a Screenshot is present: shadow of the **outer** rounded rect (the drawn rect outset by border width; outer radius = radius + width; width `0` → outer = drawn). Shadow: color `rgb(0,0,0)` at `opacity`, offset applied as `+x` and `+y`, blur as given. Offset `0` and blur `0` is no shadow. A glow (offset `0`, blur `> 0`) is allowed.
3. If a Screenshot is present and border width `> 0`: the ring between the outer path and the inner path (the drawn rect, radius as given). The border does not cover Screenshot pixels.
4. If a Screenshot is present: clip to the inner rounded rect and draw the Screenshot.

The frame clips everything. No extra clamp on radius or border. Effects do not apply when the Screenshot is absent.

Linear gradient line (CSS, through the frame center):

- `θ` in radians = `angle · π / 180`
- length = `|width · sin(θ)| + |height · cos(θ)|`
- direction `(dx, dy) = (sin(θ), −cos(θ))`
- start = center − direction · length / 2 (0%)
- end = center + direction · length / 2 (100%)

Stops are applied at their offsets as given.

### Export

`exportPng` returns `"refuse"` when `screenshot` is null. Otherwise it writes `image/png` from the same bitmap `render` produces (no quality argument). Filename, from `now` in local time, zero-padded, no timezone, no dimensions: `better-screenshots-YYYY-MM-DDTHHMMSS.png`. Two Exports in the same second may share a name; the browser’s download suffix is enough.

## Dependencies

None.

## Testing Decisions

**Seam:** `createSession` / `StudioSession` only. A test double of `UploadedBackgroundStore` is how a second session sees a refresh. Do not assert on IndexedDB, canvas call order, or private helpers.

**Good tests:** commands and their visible results — Composition fields, `uploadedBackgrounds`, `placement`, canvas width/height, Export blob type / size / filename, and `"refuse"`. Do not snapshot full bitmaps. Do not re-implement placement in the test; use the worked examples.

**Worked examples** (default frame 1920×1080, padding 120 unless said):

- Inner at default padding → `{ x: 120, y: 120, width: 1680, height: 840 }`.
- Padding `10000` → effective `539.5`, inner `{ x: 539.5, y: 539.5, width: 841, height: 1 }`. Stored padding stays `10000`.
- Screenshot `800×600` in that default inner → fitted `1120×840`.
- Scale `1`, Position `0,0` → drawn `{ x: 400, y: 120, width: 1120, height: 840 }`.
- Scale `2`, Position `0,0` → drawn `{ x: -160, y: -300, width: 2240, height: 1680 }`.
- Scale `1`, Position `100, -50` → drawn `{ x: 500, y: 70, width: 1120, height: 840 }`.
- Cover-center, image `1000×2000` on the default frame → drawn size `1920×3840`, top-left `{ x: 0, y: -1380 }`.
- Gradient `0deg` on the default frame → start `(960, 1080)`, end `(960, 0)`.
- Gradient `90deg` on the default frame → start `(0, 540)`, end `(1920, 540)`.
- Drawn `{ x: 400, y: 120, width: 1120, height: 840 }`, border width `8`, radius `16` → outer `{ x: 392, y: 112, width: 1136, height: 856 }`, outer radius `24`.
- `exportPng` at local `2026-08-19 14:05:03` → filename `better-screenshots-2026-08-19T140503.png`, canvas `3840×2160`.

**Prior art:** none. There is no app tree yet.

## Out of Scope

- Studio chrome (panels, sliders, drag, empty-state copy, Export button).
- Visual identity and the actual Catalog hexes and gradients.
- Hosting and deploy.
- Keyboard map other than paste.
- Undo, history, redo.
- Restoring a Composition; named drafts.
- Clear Screenshot.
- Custom gradient authoring; persisted “my colors”.
- Aspect-ratio and social-size presets; a frame-size control.
- Device frames, crop, rotate, perspective, text, annotations, collage.
- Huge-upload and memory failure modes.
- JPEG / WebP; a scale control; `devicePixelRatio`.
- Extracting draw into a workspace package.
- Landing the app stack (separate node).

## Further Notes

Canvas 2D, one bitmap, two-pass shadow, no spread: `docs/adr/0001-canvas-2d-draw-path.md`.

The real store is IndexedDB, one object store, Blob on the record. `navigator.storage.persist()` is not used. A count cap and a per-file size limit are not used.
