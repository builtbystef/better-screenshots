---
id: q460vv
title: Export the session PNG from the Preview strip
state: todo
priority: high
depends_on:
    - hp3l6u
parent: 3toux4
created: 2026-08-19T19:38:36Z
updated: 2026-08-19T19:38:36Z
---

## What to build

Replace and Export sit in the gap above the Preview. On Empty, Export is visible and disabled. When a Screenshot is present, Replace swaps it without resetting the sitting, and Export saves the session PNG. A failed Export is the same Preview line as a refused place.

## Acceptance criteria

- [ ] The strip sits above the Preview, outside the bitmap. No bar. As wide as the Preview column, right-aligned. Order: Replace, then Export. Strip and bitmap stay top-aligned in the column.
- [ ] On Empty, Replace is gone; disabled Export stays in that trailing slot.
- [ ] Replace is ghost / secondary. It opens the same one-file `image/*` picker as Choose a file. A successful replace keeps Padding, Scale, Position, and Effects.
- [ ] Export label is `Export`, filled / primary.
- [ ] Export is disabled when Empty or while `exportPng` is in flight. Still readable (`muted-foreground`), default cursor, not a pointer, not opacity-only. Label stays `Export`. No spinner. A disabled click is a no-op and writes no line.
- [ ] Enabled click calls `exportPng(now)` and the browser saves that PNG. No toast.
- [ ] Occupied `exportPng` `"refuse"` writes `Couldn't export that image.` on the same Preview line as a refused place. Last event wins across place and Export. A successful place, a successful Export, or the next attempt of either clears or replaces it. Empty never shows the Export line.
