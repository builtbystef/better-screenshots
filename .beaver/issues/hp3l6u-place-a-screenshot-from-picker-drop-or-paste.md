---
id: hp3l6u
title: Place a Screenshot from picker, drop, or paste
state: todo
priority: high
depends_on:
    - 866rvo
parent: 3toux4
created: 2026-08-19T19:38:34Z
updated: 2026-08-19T19:38:34Z
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
