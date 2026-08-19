---
id: 3toux4
title: First-ship Studio chrome
state: todo
labels:
    - spec
depends_on:
    - 1tsn6n
    - 2lbxwq
    - odl00i
    - 96wun6
    - su06zm
    - 4iz55l
    - adfte6
created: 2026-08-19T12:34:54Z
updated: 2026-08-19T12:34:54Z
---

# First-ship Studio chrome

## Problem Statement

A developer has a Screenshot and a two-minute sitting. They need a surface that shows the Composition, lets them place and replace the Screenshot, set a Background, tweak placement and Effects, and Export — without a graphics editor, an account, or a second page.

## Solution

The Studio is the site. Preview on the left is the Composition bitmap. One Inspector on the right is live even when Empty. They place a Screenshot (picker, drop, or paste), sit it on a Catalog solid, a Catalog gradient, a custom solid, or an uploaded image, drag or type Position, and Export a PNG. Chrome follows the OS light/dark scheme. Refresh returns them to Empty; uploaded Background images remain.

## User Stories

1. As a developer, I want to open the Studio and see Empty Preview on the Catalog default solid with a live Inspector, so that the frame is already a finished Background.
2. As a developer, I want to place a Screenshot from Choose a file, a click on the empty Preview, a file drop, or `Ctrl`/`Cmd`+`V`, so that I can start from whatever I already have.
3. As a developer, I want Replace, drop, and paste to swap the Screenshot and keep placement and Effects, so that I can try another capture without resetting the sitting.
4. As a developer, I want a refused place or a failed Export to show one line on the Preview, so that a bad file does not look like it vanished.
5. As a developer, I want to set the Background from solid chips, gradient chips, a hex field, a native color input, or an uploaded image, so that a brand color or a custom backdrop is one click.
6. As a developer, I want a refused Background upload to say whether the file, the quota, or storage failed, so that I know what to do next.
7. As a developer, I want sliders and numbers for Padding, Scale, and Effects, and drag plus X/Y for Position, so that the sitting is feel or a known value.
8. As a developer, I want Export visible and disabled while Empty, and a browser save of the session PNG when a Screenshot is present, so that the sitting’s end is always in view.
9. As a developer, I want Studio chrome to follow the OS light or dark scheme without a toggle, so that the tool matches the desktop I already chose.

## Implementation Decisions

The Studio app hosts this surface. One in-memory session is created when the Studio loads, with the Catalog default solid and the existing uploaded-Background store. The Studio does not paint until that session exists. There is no loading surface. Composition, draw, and Export stay the session’s contract, except the narrow upload change below. The page wires chrome to that session. Native range, number, color, and file inputs. Existing light and dark tokens (`background`, `foreground`, `card`, `card-foreground`, `border`, `muted-foreground`, `primary`, `primary-foreground`, `ring`, `radius`). Type is `system-ui`. No new library.

### Session — narrow change

`uploadBackground` no longer collapses failures to `"refuse"`. The session also exposes whether storage is usable, so Add can stay disabled when it is not.

```ts
type UploadRefuse = "undecodable" | "quota" | "unavailable"

type StudioSession = {
  readonly storage: "ok" | "unavailable"
  uploadBackground(
    file: Blob,
    filename: string,
  ): Promise<UploadedBackground | UploadRefuse>
  // all other members unchanged
}
```

`storage` is `"unavailable"` when `createSession` could not list the store, and after an upload or remove that sees the store unavailable. `"quota"` does not flip `storage`. Decode failure is `"undecodable"` and does not write the store.

### Chrome rules — the new seam

The page is not a test seam. These functions are.

```ts
type Refuse = "refuse"

function parseHex(raw: string): HexColor | Refuse
// RRGGBB or #RRGGBB → # plus the six digits, case kept.
// #RGB, empty, junk → refuse.

function parseInteger(raw: string): number | Refuse
function parseScale(raw: string): number | Refuse
// rounds to two decimals; ≤ 0 → refuse
function parseOpacityPercent(raw: string): number | Refuse
// 0–100 integer

function matchingSolid(
  color: HexColor,
  solids: readonly HexColor[],
): HexColor | null
// case-insensitive

function matchingGradient(
  value: GradientBackground,
  gradients: readonly GradientBackground[],
): GradientBackground | null
// angle + stops

function positionFromDrag(input: {
  origin: { x: number; y: number }
  start: { x: number; y: number }
  current: { x: number; y: number }
  previewWidth: number
  compositionWidth: number
}): { x: number; y: number }
// preview CSS px → Composition CSS px, snapped to integers

function schemeClass(
  prefers: "dark" | "light" | "no-preference",
): "dark" | null
```

Number parse: trim whitespace; optional leading `+`; decimal point is `.` only. Integers refuse `12px`, comma decimals, and any non-integer. Session-illegal values refuse (`parseInteger` result `< 0` for Padding / Offset / Blur / Width / Radius; `parseScale` ≤ 0; `parseOpacityPercent` outside `0–100`).

### Document

Tab title `Better Screenshots`. No header, no wordmark. A blocking script in the document shell reads `prefers-color-scheme` and sets or removes class `dark` on `html` before first paint (`schemeClass`). The same media query stays live for the sitting. Nothing stored.

### Layout

The Studio fills the viewport. Preview column left, Inspector right at `20rem`. Page padding `1.5rem`, column gap `1.5rem`. Inspector uses `card` / `border` and scrolls on its own if the knobs overflow. Studio `min-width` is `48rem`; narrower may scroll sideways. No stacked phone layout.

### Preview

The session `render` canvas keeps its 3840×2160 bitmap and is CSS-sized to contain in the space under the Export strip, 16:9, never cropped. Page `background` shows around it. 1px `border` on the bitmap. Strip + bitmap are top-aligned in the column.

### Empty Studio and place

Overlay centered on the Preview. No scrim. No dashed frame at rest.

- Headline: Drop a screenshot
- Hint: or paste (Ctrl/Cmd+V)
- Button: Choose a file

Click the overlay or the empty Preview opens the same one-file `image/*` picker as the button. Occupied: overlay gone. Replace, drop, and paste still replace. Click on the Screenshot is drag, not pick. Click on occupied Background is a no-op.

### Drag

Primary pointer only. Hit the axis-aligned `placement.drawn` rect mapped into Preview CSS pixels (the Screenshot, not the shadow, not empty Background). `grab` / `grabbing`. `setPointerCapture` so the drag continues off the Preview. Each move calls `positionFromDrag` and `setPosition`; the X/Y fields follow live. A click with no movement writes nothing. A touch drag writes Position and does not scroll the page.

### Drop

A file drop anywhere in the window places a Screenshot and is not navigation. The Preview shows a `ring` while a file is dragged over the window. The Inspector is not a drop target and does not take the file as a Background. Non-file drops are ignored. Overlay copy does not change during the drag. Several files: the session’s first decodable wins.

### Preview line

One line on the Preview (under the overlay when Empty; under the bitmap when occupied). Last event wins. A successful place, a successful Export, or the next attempt of either clears or replaces it.

- Picker, drop, undecodable, or 0×0 → That file isn't an image.
- Paste with no image → No image on the clipboard.
- Occupied `exportPng` `"refuse"` → Couldn't export that image.

Focused text field: text paste is not a place and writes no line. Empty never shows the Export line — Export is disabled there.

### Export strip

Above the Preview, outside the bitmap. No bar. As wide as the Preview column, right-aligned. Order: Replace, then Export. On Empty, Replace is gone; disabled Export stays in that trailing slot.

- Replace: ghost / secondary. Opens the same one-file `image/*` picker.
- Export: label `Export`, filled / primary.

Disabled when Empty or while `exportPng` is in flight. Still readable (`muted-foreground`), default cursor, not a pointer, not opacity-only. Label stays `Export`. No spinner. A disabled click is a no-op and writes no line.

Enabled click: `exportPng(now)` and the browser saves that PNG. No toast.

### Inspector

Always visible, including on Empty. Always open. No folds. No reset. No unit suffixes. No native spinners. No arrow-key nudge in fields. Sections in order: Background, Placement, Effects. Heading Placement is chrome only.

### Background

Groups labeled Solid, Gradient, Image. No tabs, no popover, no hero swatch.

**Catalog.** One row of solid chips, one row of gradient chips, Catalog order. Fill only — solids the hex, gradients the gradient. No name labels. `title` is the Catalog name. Square chips, `1.75rem`. Click writes that value immediately. Current match gets a 2px `ring` with a 2px offset. Solid match is `matchingSolid`. Gradient match is `matchingGradient`. Clicking a selected chip is a no-op.

**Custom solid.** Hex field and native color input, always visible, kept in sync when current is a solid. `parseHex` on blur and Enter, not per keystroke. Invalid or incomplete: restore to the current solid or to empty. Native commits immediately (`#RRGGBB` only). A hex that equals a Catalog solid selects that chip; otherwise no solid chip is selected.

**Not a solid.** Hex empty, placeholder `#RRGGBB`. Native is not current: it shows the last solid this sitting, else `#000000`. Editing either control writes a solid and replaces the gradient or image.

**Images.** Newest first. Each row is a thumbnail, the filename, and an X. Click applies `{ type: "image", id }`. Add is a one-file `image/*` picker on the list. A successful upload is then applied (`uploadBackground`, then `setBackground`). X is visible and disabled on the current image. No confirm.

**Refused upload.** Inline under the list, cleared by the next Add or a successful upload.

- `undecodable` → That file isn't an image.
- `quota` → Not enough storage for that image.
- `unavailable` → Can't store images in this browser.

Add is disabled while `storage` is `"unavailable"`.

### Placement and Effects

One row per knob: label, slider, number. Slider writes every input. Number and hex commit on blur and Enter (`parseInteger` / `parseScale` / `parseOpacityPercent` / `parseHex`). Number may pass the slider except Opacity (the slider is the full `0–100`). When the stored value is outside the track, the thumb sits at the near end; the first move writes the thumb.

**Placement**

- Padding: slider `0–400` step `1` + integer number. Default `120`.
- Scale: slider `0.25–2` step `0.05` + number. Display two decimals (`1.00`). Default `1`.
- Position: one row, label Position, integer fields X and Y. No sliders.

**Effects**

- Shadow: Offset `0–64` step `1`; Blur `0–80` step `1`; Opacity `0–100` step `1` (store `value / 100`). Defaults `16` / `32` / `25`.
- Border: Width `0–24` step `1`; Color always visible (hex + native, same commit/restore as Background), even at width `0`. Default width `0`, color `#FFFFFF`.
- Radius: slider `0–64` step `1` + integer number. Default `16`.

### Catalog

Default solid: Zinc 200 `#E4E4E7`. Not a gradient. Passed to `createSession`. Catalog, custom hex, and Export do not follow chrome.

Solids, in order:

- Zinc 100 `#F4F4F5`
- Zinc 200 `#E4E4E7`
- Slate `#CBD5E1`
- Charcoal `#27272A`
- Black `#09090B`
- Sky `#BAE6FD`
- Teal `#99F6E4`
- Rose `#FECDD3`

Gradients, in order (two stops at `0` and `1`):

- Zinc fade — 180° `#F4F4F5` → `#D4D4D8`
- Slate dusk — 160° `#CBD5E1` → `#64748B`
- Sky wash — 135° `#BAE6FD` → `#E0E7FF`
- Teal mist — 150° `#99F6E4` → `#BAE6FD`
- Night — 180° `#27272A` → `#09090B`
- Rose mist — 140° `#FECDD3` → `#E0E7FF`

### Light and dark

`schemeClass` only. `dark` → class `dark` on `html`. `light` or `no-preference` → no class. An OS change mid-sitting flips chrome. No toggle. No third state. No persist.

## Dependencies

None.

## Testing Decisions

**Seams.** The chrome-rules functions above. The session only for the narrow `uploadBackground` / `storage` change. Do not mount the page. Do not re-test place, draw, Export, or field ranges the session already covers.

**Good tests.** Input → parsed value, match, Position, or class. Refuse cases. Do not snapshot layout, tokens, or bitmaps. Do not assert on DOM structure.

**Worked examples**

- `parseHex("aabbcc")` → `"#aabbcc"`
- `parseHex("#AaBbCc")` → `"#AaBbCc"`
- `parseHex("#abc")` → `"refuse"`
- `parseHex("")` → `"refuse"`
- `parseHex("#aabbccff")` → `"refuse"`
- `parseInteger(" 80 ")` → `80`
- `parseInteger("+80")` → `80`
- `parseInteger("80px")` → `"refuse"`
- `parseInteger("80.0")` → `"refuse"`
- `parseInteger("80,5")` → `"refuse"`
- `parseScale("1")` → `1`
- `parseScale("1.255")` → `1.26`
- `parseScale("0")` → `"refuse"`
- `parseScale("1,25")` → `"refuse"`
- `parseOpacityPercent("25")` → `25`
- `parseOpacityPercent("101")` → `"refuse"`
- `parseOpacityPercent("25.5")` → `"refuse"`
- `matchingSolid("#e4e4e7", Catalog solids)` → `"#E4E4E7"`
- `matchingSolid("#FFFFFF", Catalog solids)` → `null`
- `matchingGradient` of Zinc fade against the Catalog → Zinc fade; the same stops at `160°` → `null`
- `positionFromDrag({ origin: {0,0}, start: {0,0}, current: {10,0}, previewWidth: 960, compositionWidth: 1920 })` → `{ x: 20, y: 0 }`
- `positionFromDrag({ origin: {0,0}, start: {0,0}, current: {10.4,-3.2}, previewWidth: 960, compositionWidth: 1920 })` → `{ x: 21, y: -6 }`
- `schemeClass("dark")` → `"dark"`
- `schemeClass("light")` → `null`
- `schemeClass("no-preference")` → `null`

**Prior art.** The session tests: one command, then the visible result. Same shape here.

## Out of Scope

- Composition fields, draw, paint order, and Export encoding (the session spec).
- Hosting, deploy, and a marketing page.
- Keyboard map other than paste.
- Undo, history, Clear Screenshot, scale handles, a first-run surface, several Inspector panels.
- Custom gradient authoring; persisted “my colors”.
- Aspect-ratio and social-size presets.
- Device frames, crop, rotate, perspective, text, annotations, collage.
- An in-app light/dark toggle; a persisted chrome scheme.
- A stacked phone layout.

## Further Notes

The session spec is the contract for `createSession`, placement math, paint, and `exportPng`. This spec writes those commands; it does not redefine them. Catalog names exist only as chip `title`s — the Composition stores values, not ids.
