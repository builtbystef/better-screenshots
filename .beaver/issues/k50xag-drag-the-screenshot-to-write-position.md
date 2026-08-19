---
id: k50xag
title: Drag the Screenshot to write Position
state: todo
priority: medium
depends_on:
    - hp3l6u
parent: 3toux4
created: 2026-08-19T19:38:36Z
updated: 2026-08-19T19:38:36Z
---

## What to build

The developer drags the Screenshot on the Preview to write Position. The stored Position updates live. A click with no movement writes nothing.

## Acceptance criteria

- [ ] `positionFromDrag({ origin: { x: 0, y: 0 }, start: { x: 0, y: 0 }, current: { x: 10, y: 0 }, previewWidth: 960, compositionWidth: 1920 })` → `{ x: 20, y: 0 }`.
- [ ] `positionFromDrag({ origin: { x: 0, y: 0 }, start: { x: 0, y: 0 }, current: { x: 10.4, y: -3.2 }, previewWidth: 960, compositionWidth: 1920 })` → `{ x: 21, y: -6 }`.
- [ ] Primary pointer only. Hit the axis-aligned `placement.drawn` rect mapped into Preview CSS pixels (the Screenshot, not the shadow, not empty Background).
- [ ] Cursor is `grab` at rest on the Screenshot and `grabbing` during the drag. `setPointerCapture` so the drag continues off the Preview.
- [ ] Each move calls `positionFromDrag` and `setPosition`. A click with no movement writes nothing.
- [ ] A touch drag writes Position and does not scroll the page.
