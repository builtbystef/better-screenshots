---
id: 9vtbbf
title: Set Background from Catalog chips and a custom solid
state: done
assignee: agent
priority: high
depends_on:
    - 866rvo
parent: 3toux4
created: 2026-08-19T19:38:34Z
updated: 2026-08-19T20:21:32Z
---

## What to build

The Inspector Background section sets a solid or a gradient. Catalog chips write immediately. A hex field and a native color input write a custom solid. The Preview shows the new Background, including on Empty.

## Acceptance criteria

- [ ] Groups labeled Solid and Gradient. No tabs, no popover, no hero swatch.
- [ ] One row of solid chips, one row of gradient chips, Catalog order. Fill only — solids the hex, gradients the gradient. No name labels. `title` is the Catalog name. Square chips, `1.75rem`. Click writes that value immediately. Clicking a selected chip is a no-op.
- [ ] Current match gets a 2px `ring` with a 2px offset. Solid match is `matchingSolid`. Gradient match is `matchingGradient`.
- [ ] `matchingSolid("#e4e4e7", Catalog solids)` → `"#E4E4E7"`. `matchingSolid("#FFFFFF", Catalog solids)` → `null`.
- [ ] `matchingGradient` of Zinc fade against the Catalog → Zinc fade. The same stops at `160°` → `null`.
- [ ] Catalog solids, in order: Zinc 100 `#F4F4F5`; Zinc 200 `#E4E4E7`; Slate `#CBD5E1`; Charcoal `#27272A`; Black `#09090B`; Sky `#BAE6FD`; Teal `#99F6E4`; Rose `#FECDD3`.
- [ ] Catalog gradients, in order, two stops at `0` and `1`: Zinc fade — 180° `#F4F4F5` → `#D4D4D8`; Slate dusk — 160° `#CBD5E1` → `#64748B`; Sky wash — 135° `#BAE6FD` → `#E0E7FF`; Teal mist — 150° `#99F6E4` → `#BAE6FD`; Night — 180° `#27272A` → `#09090B`; Rose mist — 140° `#FECDD3` → `#E0E7FF`.
- [ ] `parseHex("aabbcc")` → `"#aabbcc"`. `parseHex("#AaBbCc")` → `"#AaBbCc"`. `parseHex("#abc")` → `"refuse"`. `parseHex("")` → `"refuse"`. `parseHex("#aabbccff")` → `"refuse"`.
- [ ] Hex field and native color input are always visible and kept in sync when current is a solid. `parseHex` on blur and Enter, not per keystroke. Invalid or incomplete: restore to the current solid or to empty. Native commits immediately (`#RRGGBB` only). A hex that equals a Catalog solid selects that chip; otherwise no solid chip is selected.
- [ ] Not a solid: hex empty, placeholder `#RRGGBB`. Native is not current: it shows the last solid this sitting, else `#000000`. Editing either control writes a solid and replaces the gradient or image.

## Notes

**agent** — 2026-08-19T20:21:31Z

Inspector Background now sets a Catalog solid, a Catalog gradient, or a custom solid. Preview re-renders, including on Empty.

Seams (chrome.ts): parseHex, matchingSolid, matchingGradient. Worked examples from the spec are tests. Catalog lives in catalog.ts — eight solids and six two-stop gradients in spec order; default remains Zinc 200 #E4E4E7.

UI: groups labeled Solid and Gradient. Square 1.75rem chips, fill only, title is the Catalog name. Selected match is a 2px ring with a 2px offset via matchingSolid / matchingGradient. Click writes immediately; a selected chip is a no-op. Hex field commits on blur and Enter; invalid or incomplete restores to the current solid or to empty. Native color commits immediately. Not a solid: hex empty with placeholder #RRGGBB; native shows the last solid this sitting, else #000000. Editing either writes a solid and replaces a gradient.

Chips have a 1px border so Zinc 100 stays visible on the card. Page is not a test seam. Image upload stays su8i9j.
