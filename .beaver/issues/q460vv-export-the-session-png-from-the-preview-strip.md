---
id: q460vv
title: Export the session PNG from the Preview strip
state: done
assignee: agent
priority: high
depends_on:
    - hp3l6u
parent: 3toux4
created: 2026-08-19T19:38:36Z
updated: 2026-08-19T20:35:31Z
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

## Notes

**agent** — 2026-08-19T20:35:31Z

Export strip above the Preview bitmap: Replace (ghost, occupied only) then Export (filled primary). No bar; row is the Preview column width, right-aligned. Strip + bitmap stay top-aligned.

On Empty, Replace is gone and Export stays disabled in that trailing slot. Disabled: muted-foreground, default cursor, not opacity-only. Label stays Export. No spinner. A disabled click is a no-op.

Replace and Choose a file share one image/* picker. Successful replace is placeScreenshot, which keeps Padding, Scale, Position, and Effects.

Enabled Export calls exportPng(now) and saves the PNG via a download anchor. No toast. In-flight disables Export.

exportLine is the chrome seam: ok → no line; refuse → Couldn't export that image. Same Preview line as place; last event wins. Next attempt of either clears then replaces. Empty never calls export, so it never shows the Export line.

Page is not a test seam. Tests cover exportLine.
