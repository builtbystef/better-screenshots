---
id: dhjf03
title: Write the first-ship spec for Composition, draw, and Export?
state: done
assignee: agent
priority: high
labels:
    - roadmap:pfdjl3
    - session:spec
depends_on:
    - bdkac8
    - dm1i0g
    - w0i92g
    - y7ac9r
    - cx9cwz
    - eivufq
    - dt8gtk
    - qjw6h1
    - vfgwur
    - 0abxd5
parent: pfdjl3
created: 2026-08-19T04:51:42Z
updated: 2026-08-19T05:44:24Z
---

Spec session for the settled first-ship product area. An implementer of Composition, draw, Export, and persistence needs these answers together. Studio chrome, visual identity, hosting, and the rest of the keyboard map stay on the Frontier — not this spec.

Read the notes (and the ADR) of only this area, interview to close remaining gaps inside it, confirm with the user, then invoke `create-specification`. Publish the spec issue with a blocking edge back to each node it covers.

Area nodes:

- bdkac8 — first-ship cut
- dm1i0g — Canvas 2D path (`docs/adr/0001-canvas-2d-draw-path.md`)
- 0abxd5 — draw lives in `apps/web`
- y7ac9r — Composition data shape
- eivufq — Effect parameters
- cx9cwz — Export contract
- w0i92g — uploaded Background persistence
- dt8gtk — Catalog capabilities (not the actual colors)
- qjw6h1 — paste in
- vfgwur — undo out

Do not reopen the stack landing (3q46jo) or the path comparison (p4urad). Do not design Studio chrome.

## Notes

**agent** — 2026-08-19T05:44:24Z

# Question

Write the first-ship spec for Composition, draw, and Export?

# Answer

Yes. Spec issue `erb9py`. One Studio session is the seam. Chrome, Catalog colors, hosting, and the rest of the keyboard map stay out.

# Reason

The area's nodes were closed. Remaining gaps (paint order, missing image Background, multi-file sources, no clear, smooth scaling) were settled with the user. The draft was approved and published with blocking edges back to the area nodes.
