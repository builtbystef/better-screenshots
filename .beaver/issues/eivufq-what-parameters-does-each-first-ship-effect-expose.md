---
id: eivufq
title: What parameters does each first-ship Effect expose?
state: done
assignee: agent
priority: high
labels:
    - roadmap:pfdjl3
    - session:grill
depends_on:
    - bdkac8
    - dm1i0g
parent: pfdjl3
created: 2026-08-19T00:44:21Z
updated: 2026-08-19T02:43:15Z
---

Grill session, limited to the knobs on the three first-ship Effects. bdkac8 settled the set: shadow, border, rounded corners — nothing else. The draw path (dm1i0g) is a blocker because Canvas 2D and SVG have no CSS spread-radius on shadows.

Settle with the user:

- Shadow: which of offset, blur, color, and (if the draw path allows) spread are user-facing; which are fixed defaults.
- Border: width, color, and whether style (solid only vs more) is in.
- Rounded corners: one radius for all corners, or per-corner; unit.

Do not add Effects. Do not design the Studio sliders.

Pointers: bdkac8 note; dm1i0g; p4urad note (canvas/SVG shadow has no spread); `docs/GLOSSARY.md` (Effect).

## Notes

**agent** — 2026-08-19T02:43:15Z

# Question

What parameters does each first-ship Effect expose?

# Answer

Shadow: offset, blur, opacity (color is black). Border: width and color (solid only). Rounded corners: one radius, all four, CSS pixels. Defaults look finished. Border sits outside the Screenshot. Zeros are off. No extra flags.

# Cut

**Shadow.** User-facing: offset, blur, opacity. Color is fixed black. Offset is one number, CSS pixels of the frame, applied as `+x` and `+y` (down-right). Defaults: offset `16`, blur `32`, opacity `0.25`. Offset `0` and blur `0` is no shadow. A glow (offset `0`, blur `> 0`) is allowed. Refuse offset `< 0` (no up-left). Blur `≥ 0`. Opacity in `[0, 1]`.

**Border.** User-facing: width and color. Style is solid only. Color is `#RRGGBB`, no alpha. Defaults: width `0`, color `#FFFFFF`. Width `0` is no border. Width `≥ 0`. The border sits outside the Screenshot — it does not cover pixels. Radius is the Screenshot's corner; the outer path is that rect outset by the width (outer radius = radius + width). The shadow follows that outer path. Width `0` is the Screenshot rect.

**Rounded corners.** One radius for all four corners, CSS pixels of the frame. Default `16`. `0` is square. Radius `≥ 0`. No per-corner values.

**Shared.** No on/off flags — zeros are off. Offset, blur, width, and radius do not scale with Scale; they are frame pixels, like Padding. They apply only when a Screenshot is present (y7ac9r).

# Reason

A two-minute sitting should look lifted after a drop, so shadow and radius start on and border starts off. One down-right offset, black at an opacity, and a single radius are the polished-screenshot look; separate X/Y, a shadow color, dashed borders, and per-corner radii are a graphics editor. Outside border keeps UI pixels at the Screenshot edge. Canvas 2D has no spread (dm1i0g).

# Not this node

Studio sliders and other chrome. New Effects. Spread (already out). Where the draw function lives (`0abxd5`).
