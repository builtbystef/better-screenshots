---
id: 0abxd5
title: Does the Canvas 2D draw live in the app, or in its own package?
state: done
assignee: agent
priority: medium
labels:
    - roadmap:pfdjl3
    - session:grill
depends_on:
    - dm1i0g
parent: pfdjl3
created: 2026-08-19T00:57:26Z
updated: 2026-08-19T04:51:14Z
---

Grill session, limited to where the draw lives. dm1i0g settled the path: one Canvas 2D bitmap, two-pass, no library. 3q46jo settled landing as `apps/web` only — extra packages are not required to boot the stack.

Settle with the user:

- The draw function lives in `apps/web`, or in a `packages/*` package the Studio imports.
- If a package: whether first landing includes it, or the Studio starts with the draw in-app and a later extract is allowed.

Do not design the Composition data shape, the Export contract, or the Studio chrome.

Pointers: dm1i0g note and `docs/adr/0001-canvas-2d-draw-path.md`; 3q46jo note (layout: `apps/web` only at landing); `docs/ARCHITECTURE.md`.

## Notes

**agent** — 2026-08-19T04:51:14Z

# Question

Does the Canvas 2D draw live in the app, or in its own package?

# Answer

In `apps/web`. Not a `packages/*` package at first landing. A later extract is allowed when a second consumer exists.

# Cut

**Home.** `apps/web`. The Studio imports the draw as app code, not as a workspace package.

**First landing.** No `packages/*` for the draw. Matches 3q46jo (`apps/web` only).

**Later extract.** Allowed, not scheduled. Trigger is a second consumer (CLI, worker, another surface). Not "extract for a cleaner test seam" during first ship.

# Reason

One consumer, browser-only. Landing already refused extra packages as a boot requirement. A workspace package is a public API, a library tsconfig, and a workspace dependency for a function only the Studio calls.

# Not this node

Composition data shape (y7ac9r). Export contract (cx9cwz). Studio chrome. The file path inside `apps/web`.
