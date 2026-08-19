---
id: cx9cwz
title: What is the first-ship Export contract?
state: done
assignee: agent
priority: high
labels:
    - roadmap:pfdjl3
    - session:grill
depends_on:
    - bdkac8
parent: pfdjl3
created: 2026-08-19T00:44:15Z
updated: 2026-08-19T02:36:23Z
---

Grill session, limited to the Export file contract. The first-ship sitting (bdkac8) ends in an Export. The draw path (dm1i0g) is a separate node; PNG is available on every path.

Settle with the user:

- Format (PNG, and whether JPEG / WebP are offered).
- Pixel size of the Export, and whether 1x / 2x (or another scale) is a user choice, a fixed 2x, or devicePixelRatio.
- Filename rule.
- Whether aspect-ratio or social-size presets are in the first ship (in or out — the preset list waits if they are in).

Do not pick the draw path. Do not design the Studio chrome around the Export button.

Pointers: bdkac8 note; p4urad note (formats and 1x/2x are extra work on every raster path); `docs/GLOSSARY.md` (Export, Composition).

## Notes

**agent** — 2026-08-19T02:36:23Z

# Question

What is the first-ship Export contract?

# Answer

One PNG download, frame × 2, named `better-screenshots-YYYY-MM-DDTHHMMSS.png`. No JPEG / WebP. No scale control. No aspect-ratio or social-size presets. No file when the Screenshot is absent.

# Cut

**Format.** `image/png` only. No JPEG, no WebP, no quality argument.

**Pixels.** Bitmap width and height are the Composition frame × 2, both axes. Default frame → 3840×2160. Scale is a constant of the Export step, not a Composition field and not a user choice. Not `devicePixelRatio`. Preview is this same bitmap (`dm1i0g`).

**Filename.** `better-screenshots-YYYY-MM-DDTHHMMSS.png` — browser local time, 24-hour, zero-padded, no timezone suffix, no dimensions in the name. Two Exports in the same second may collide; the browser download suffix is enough.

**Presets.** Out of the first ship. Frame stays the stored default (1920×1080). Aspect-ratio and social-size lists stay on the Frontier.

**Empty Studio.** No Screenshot handle → no file is written. How the Studio shows that is chrome.

# Reason

Screenshots are UI: text and sharp edges. JPEG / WebP smear that, need a quality knob, and are not guaranteed (`toBlob` falls back to PNG). A fixed 2× is crisp on retina without a size control the sitting does not have; 3840×2160 stays under typical canvas limits (iOS 4096). `devicePixelRatio` would make the file depend on the machine. A timestamped name matches several Exports in one visit without a fixed `composition.png` collision. Presets are a catalog; they wait. A Background-only rectangle is not the sitting.

# Glossary

**Export** is now the PNG file written from a Composition.

# Not this node

The Export button, keyboard shortcut, or other Studio chrome. The draw path (already Canvas 2D). Effect knobs (`eivufq`). Where the draw function lives (`0abxd5`).
