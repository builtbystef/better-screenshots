---
id: efoqxv
title: Open a Studio session on the default Composition and write its fields
state: done
assignee: agent
priority: high
parent: erb9py
created: 2026-08-19T06:07:51Z
updated: 2026-08-19T07:15:38Z
---

## What to build

The Studio opens one in-memory session. The empty Composition is the given default solid on a 1920×1080 frame, with the first-ship field defaults. The user can set Background, Padding, Scale, Position, shadow, border, and radius. A bad value is refused and the Composition does not change. Refresh is a new session: the Composition is never restored. Uploaded Backgrounds come from the store the session is created with.

## Acceptance criteria

- [ ] `createSession` with default solid `{ type: "solid", color: "#112233" }` yields `width` 1920, `height` 1080, that Background, `screenshot` null, `padding` 120, `scale` 1, `position` `{ x: 0, y: 0 }`, `shadow` `{ offset: 16, blur: 32, opacity: 0.25 }`, `border` `{ width: 0, color: "#FFFFFF" }`, `radius` 16.
- [ ] `placement` is null while `screenshot` is null.
- [ ] When the store lists two records, `uploadedBackgrounds` is those records.
- [ ] When the store list is unavailable, `uploadedBackgrounds` is empty.
- [ ] A second `createSession` is a fresh default Composition, not the previous session’s fields.
- [ ] `setBackground` writes any solid `#RRGGBB` and keeps A–F case as given (`#aAbBcC` stays `#aAbBcC`).
- [ ] `setBackground` writes a gradient with two or more stops, each offset in `[0, 1]`, a finite angle, and each color `#RRGGBB`.
- [ ] `setBackground` writes `{ type: "image", id }` for a non-empty id even when that record is not in the store.
- [ ] `setBackground` returns `"refuse"` and leaves the Composition unchanged for a solid that is not `#RRGGBB` (including `#RGB` and any alpha form), a gradient that fails the shape above, or an empty image id.
- [ ] `setPadding(0)` writes 0. `setPadding` returns `"refuse"` for `< 0` or a non-finite value.
- [ ] `setScale(2)` writes 2. `setScale` returns `"refuse"` for `≤ 0` or a non-finite value.
- [ ] `setPosition(10, -20)` writes `{ x: 10, y: -20 }`. `setPosition` returns `"refuse"` when either value is non-finite.
- [ ] `setShadow(0, 0, 0)` writes those numbers. `setShadow` returns `"refuse"` when `offset < 0`, `blur < 0`, `opacity` is outside `[0, 1]`, or any value is non-finite.
- [ ] `setBorder(0, "#000000")` writes those values and keeps color case as given. `setBorder` returns `"refuse"` when `width < 0`, width is non-finite, or color is not `#RRGGBB`.
- [ ] `setRadius(0)` writes 0. `setRadius` returns `"refuse"` for `< 0` or a non-finite value.

## Notes

**agent** — 2026-08-19T07:15:37Z

# Done

`createSession` is the public seam in `apps/web/src/session.ts`. Tests target that seam only (`apps/web/src/session.test.ts`).

A session opens on a fresh 1920×1080 default Composition (given solid, padding 120, scale 1, position 0,0, shadow 16/32/0.25, border 0/#FFFFFF, radius 16). `placement` is null while `screenshot` is null. `uploadedBackgrounds` is the store list, or empty when the list is unavailable. A second `createSession` is a new default, never a restore.

`setBackground`, `setPadding`, `setScale`, `setPosition`, `setShadow`, `setBorder`, and `setRadius` write a valid value (`"ok"`) or return `"refuse"` and leave the Composition unchanged. Hex A–F case is kept as given. An image Background id need not exist in the store.

Place, upload/remove, render, and Export stay on the sibling issues. `StudioSession` only has the commands this slice owns.
