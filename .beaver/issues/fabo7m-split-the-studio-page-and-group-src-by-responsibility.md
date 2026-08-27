---
id: fabo7m
title: Split the Studio page and group src by responsibility
state: done
assignee: claude
priority: medium
labels:
    - maintenance
created: 2026-08-27T05:23:28Z
updated: 2026-08-27T05:37:58Z
---

`apps/web/src/routes/index.tsx` is 1039 lines holding five concerns: the route boot, the Studio shell, Preview, the five Inspector sections, and the shared rows and style constants. `src/` is otherwise flat, so the layering rule in `docs/ARCHITECTURE.md` — DOM access only in `paint`, `drag`, `scheme`, `indexed-db-store`, and the route tree — is visible only in prose.

No functionality changes.

## Scope

1. Move the UI out of `routes/index.tsx` into `src/studio/` (a sibling of `routes/`, so `routeTree.gen.ts` does not pick it up): `studio.tsx` shell, `preview/` with the drop/paste, pointer-drag, and canvas effects extracted as hooks, and `inspector/` with one file per section plus the shared rows, `chips.ts`, and `gradient-css.ts`. `routes/index.tsx` keeps only the route and the Session boot.
2. Group the flat modules: `src/composition/` for the Node-only modules (`session`, `placement`, `catalog`, `messages`, `parse`) and `src/platform/` for the DOM seam (`paint`, `drag`, `scheme`, `indexed-db-store`). Named `platform/` rather than `browser/` because Browser window is a glossary term.
3. Use the `@/` alias for every internal import; the tree is now deep enough that relative paths hurt.

Update the module map, dependency arrows, and DOM-access list in `docs/ARCHITECTURE.md`, and the module-boundary rule in `docs/CODING_STANDARDS.md`, which both name `routes/index.tsx` explicitly.

## Verification

The route has no tests, so this rests on `vp fmt --check`, `vp lint`, `vp check`, `vp test`, and exercising drop, paste, drag, export, and each Inspector control by hand in `pnpm dev`.

## Notes

**claude** — 2026-08-27T05:37:58Z

Landed. Verified with vp fmt --check, vp lint, vp check, vp test (101 passing), and vp run -r build. The route has no standing tests, so the render path was checked with a throwaway jsdom probe that mounted Studio and asserted the five sections, every labelled control, the Export disabled state, an Inspector write reaching the Session, and useFileDrop's window listeners toggling the drop ring. The probe was deleted per the coding standard on throwaway probes. The dev server could not be reached from a browser because the sandbox isolates the network per command, so a human pass over pointer-drag and Export in pnpm dev is still worth doing.
