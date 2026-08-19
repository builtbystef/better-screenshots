---
id: 2lbxwq
title: How does the Inspector set the Background?
state: done
assignee: agent
priority: high
labels:
    - roadmap:pfdjl3
    - session:grill
depends_on:
    - 1tsn6n
    - dt8gtk
    - w0i92g
parent: pfdjl3
created: 2026-08-19T09:28:48Z
updated: 2026-08-19T09:40:32Z
---

Grill session, limited to Background controls in the Inspector — not slider chrome, empty-state copy, or Catalog colors.

1tsn6n settled the surface: one Inspector, present and live on the Empty Studio. dt8gtk settled capabilities: a handful of solids and gradients, custom `#RRGGBB` in, custom gradient out. w0i92g settled upload/remove as capabilities.

Settle with the user:

- How the user picks a Catalog solid or gradient, and how the current Catalog value is shown.
- How the custom-solid control works (hex field, native color input, or both), and how a custom hex relates to a Catalog solid of the same color.
- How the user uploads a Background image and removes one (refuse-if-in-use is already the session rule).
- How the Inspector shows an image Background vs a solid vs a gradient.

Do not pick the actual Catalog colors or the Studio theme (`4iz55l`). Do not design placement/Effect sliders or empty-state copy.

Pointers: 1tsn6n note; dt8gtk note; w0i92g note; `erb9py`; `docs/GLOSSARY.md` (Inspector, Background, Catalog, Empty Studio).

## Notes

**agent** — 2026-08-19T09:40:32Z

# Question

How does the Inspector set the Background?

# Answer

One always-visible Background section: solid chips, gradient chips, a hex field plus a native color input, and an uploads list. Click a chip or thumbnail to write. A successful upload is applied. Remove is an X, disabled while that image is current.

# Cut

**Section.** Labeled Background. Always visible, including on the Empty Studio. Groups labeled Solid, Gradient, Image. No tabs, no popover, no hero swatch. The preview is the Composition.

**Catalog.** One row of solid chips, one row of gradient chips, Catalog order. Click writes that value immediately. The current match gets a ring. Solid match is the hex, case-insensitive. Gradient match is the value (angle + stops). Clicking a selected chip is a no-op.

**Custom solid.** Hex field and native color input, always visible, kept in sync when current is a solid. Accept `RRGGBB` or `#RRGGBB`; write `#` plus six digits; keep the case they typed. No `#RGB` shorthand. Commit hex on blur and Enter, not per keystroke. Invalid or incomplete: refuse, restore to the current solid or to empty. Native commits immediately (`#RRGGBB` only). A hex that equals a Catalog solid selects that chip; otherwise no solid chip is selected.

**Not a solid.** Hex empty, placeholder `#RRGGBB`. Native is not current: it shows the last solid this sitting, else `#000000`. Editing either control writes a solid and replaces the gradient or image.

**Images.** Newest first. Each row is a thumbnail, the filename, and an X. Click applies `{ type: "image", id }`. Add is a one-file `image/*` picker on the list. A successful upload is then applied (`uploadBackground`, then `setBackground`). X is visible and disabled on the current image. No confirm. No drop target here (preview drop is Screenshot).

**Refused upload.** Inline under the list, cleared by the next Add or a successful upload. Undecodable: "That file isn't an image." Quota: "Not enough storage for that image." IndexedDB closed: "Can't store images in this browser." Add stays disabled while IndexedDB is closed.

# Reason

The sitting is two minutes and the Catalog is a handful — the values all fit, so tabs and a popover are an extra click. Background is a value, not a mode; upload is a library, not a third tab. A developer already has a hex; the native input is for when they do not. Matching is by value because the Composition stores no Catalog id. Upload-then-apply matches why they added the file; remove-while-in-use stays the session rule, taught by a disabled X rather than a silent refuse or a missing control. Preview drop is already Screenshot, so the Inspector is picker-only. Quota with no signal looks like the file vanished.

# Not this node

Catalog colors and the Studio theme (`4iz55l`). Placement and Effect chrome (`96wun6`). Empty Studio place affordance and copy (`odl00i`).
