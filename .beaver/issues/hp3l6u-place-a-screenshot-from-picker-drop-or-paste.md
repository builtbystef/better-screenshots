---
id: hp3l6u
title: Place a Screenshot from picker, drop, or paste
state: done
assignee: agent
priority: high
depends_on:
    - 866rvo
parent: 3toux4
created: 2026-08-19T19:38:34Z
updated: 2026-08-19T20:13:12Z
---

## What to build

On Empty Studio the Preview offers a place: drop, paste, or Choose a file. A successful place shows the Screenshot on the Composition. Occupied, drop and paste still replace and keep placement and Effects. A refused place is one line on the Preview, not silence.

## Acceptance criteria

- [ ] Empty overlay is centered on the Preview. No scrim. No dashed frame at rest. Headline: Drop a screenshot. Hint: or paste (Ctrl/Cmd+V). Button: Choose a file.
- [ ] Choose a file, a click on the overlay, and a click on the empty Preview open the same one-file `image/*` picker.
- [ ] Occupied: the overlay is gone. Drop and paste still replace the Screenshot and keep Padding, Scale, Position, and Effects. A click on the occupied Background is a no-op. A click on the Screenshot does not open the picker.
- [ ] A file drop anywhere in the window places a Screenshot and is not navigation. The Preview shows a `ring` while a file is dragged over the window. The Inspector is not a drop target and does not take the file as a Background. Non-file drops are ignored. Overlay copy does not change during the drag. Several files: the session’s first decodable wins.
- [ ] One line on the Preview (under the overlay when Empty; under the bitmap when occupied). Last place event wins. A successful place, or the next place attempt, clears or replaces it.
- [ ] Picker, drop, undecodable, or `0×0` → `That file isn't an image.`
- [ ] Paste with no image → `No image on the clipboard.`
- [ ] Focused text field: text paste is not a place and writes no line.

## Notes

**agent** — 2026-08-19T20:13:11Z

Empty Preview overlay: Drop a screenshot / or paste (Ctrl/Cmd+V) / Choose a file. Centered, no scrim, no dashed frame. The overlay is a label over one hidden image/* file input, so Choose a file, overlay click, and empty Preview click open the same picker.

Occupied: overlay unmounts. Drop and paste still call placeScreenshot (session already keeps Padding, Scale, Position, Effects). Occupied clicks do not open the picker.

Window drag/drop: file types show the Preview ring; a file drop anywhere preventDefaults and places. Non-file drops are ignored. Inspector has no drop handler. Several files go to placeScreenshot; first decodable wins.

Preview line under the overlay/bitmap. placeLine is the chrome seam: picker/drop/paste refuse → That file isn't an image.; paste empty → No image on the clipboard.; success or empty picker/drop → no line. Next attempt clears then replaces. isTextFieldTarget: text paste in a focused text/number/textarea is not a place and writes no line.

Page is not a test seam. Tests cover placeLine, isFileDrag, isTextFieldTarget.
