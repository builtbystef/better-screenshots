---
id: dm1i0g
title: Which approach should draw the composition and write the Export?
state: done
assignee: agent
priority: high
labels:
    - roadmap:pfdjl3
    - session:grill
depends_on:
    - p4urad
    - bdkac8
parent: pfdjl3
created: 2026-08-18T23:15:31Z
updated: 2026-08-19T00:57:08Z
---

Grill session, limited to picking the drawing path. The comparison is closed in p4urad. The first-ship cut (bdkac8) is a blocker because text, annotations, and device frames change the weight of DOM versus Canvas 2D versus SVG.

Settle with the user:

- DOM + a snapshot library, Canvas 2D, or SVG — one path for both preview and Export, or a split (preview in one, Export in another).
- If DOM: which snapshot library family (html2canvas rebuild is not viable for shadow; html-to-image / foreignObject is the remaining DOM path).
- If Canvas or SVG: accept no CSS spread-radius on shadows, and a two-pass draw so a rounded clip does not cut the drop shadow.
- Whether preview-versus-Export match must be pixel-identical (same bitmap) or only "honest enough".

Do not design the composition data shape, the studio chrome, or the Export filename / pixel-size contract. Those wait.

Pointers: p4urad note (the comparison, with citations); bdkac8; `docs/GLOSSARY.md` (Composition, Effect, Export).

## Notes

**agent** — 2026-08-19T00:57:08Z

# Question

Which approach should draw the Composition and write the Export?

# Answer

Canvas 2D, one path. Preview is the same bitmap `toBlob` writes. Not DOM, not SVG, not a split.

# Cut

**Path.** One Canvas 2D backing store for preview and Export. Pixel-identical by construction. How large that bitmap is waits for the Export-contract node (`cx9cwz`).

**Shadow.** Offset, blur, color. No spread-radius. Which of those are user-facing waits for the Effect-params node (`eivufq`).

**Draw.** Two-pass: draw the shadow unclipped, then clip and draw the Screenshot. A single `drawImage` is subject to both the shadow attributes and the clipping region; clip-then-draw eats the drop shadow.

**Out.** html2canvas, html-to-image / `foreignObject`, a live-SVG preview, a vector SVG Export.

# Reason

First ship is one Screenshot plus shadow, border, and rounded corners — not text, annotations, or device frames. Canvas 2D matches preview to Export without a library; user `File` → `createImageBitmap` → `drawImage` stays origin-clean. html2canvas does not paint `box-shadow`. html-to-image rasters a clone, not the live preview. SVG still goes through canvas and must inline `blob:` hrefs first.

# ADR

`docs/adr/0001-canvas-2d-draw-path.md`
