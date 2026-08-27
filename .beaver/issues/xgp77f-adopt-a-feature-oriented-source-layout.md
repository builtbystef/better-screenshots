---
id: xgp77f
title: Adopt a feature-oriented source layout
state: done
assignee: claude
priority: medium
labels:
    - maintenance
created: 2026-08-27T05:48:27Z
updated: 2026-08-27T05:54:33Z
---

Reorganise `apps/web/src` from the current type-first layout into a feature-oriented one, so that the Studio's domain code sits together and `routes/` holds routing only.

Target:

- `features/studio/` owns the Studio: `composition/` (pure Composition rules), `platform/` (its DOM seams), `components/` (shell, Preview, Inspector), `hooks/` (the four Preview DOM hooks), `studio-page.tsx` (the Session boot), `index.ts` (public surface).
- `routes/index.tsx` becomes a composition point: it declares the route and renders `StudioPage`. It boots nothing.
- `lib/` keeps the app-wide shared modules: `utils.ts` and `scheme.ts`.
- `components/ui/` and `hooks/use-draft.ts` stay where they are: they are leaves that know nothing about the Studio.

Dependency direction: `routes -> features -> shared components/lib`, never back.

No behaviour change. Every move keeps its file contents; only import specifiers and the two component names at the route seam change.

## Notes

**claude** — 2026-08-27T05:54:33Z

Landed. Files moved with no content edits beyond import specifiers; the only source changes are the route seam (routes/index.tsx now declares the route and renders StudioPage), the new features/studio/studio-page.tsx holding the Session boot, the new features/studio/index.ts barrel, and Studio renamed to StudioShell.

Verified: vp fmt --check, vp lint, vp check, vp test (101 passing), vp run -r build with prerendering all pass. A throwaway jsdom probe mounted Route.options.component against a real fake-indexeddb factory and asserted the boot reaches StudioShell: the five Inspector headings, the h1, the Preview canvas, and the Export button all render. Probe deleted per CODING_STANDARDS.

Not done: a manual pass over pointer-drag and the PNG download in pnpm dev. The sandbox gives each command its own network namespace, so a dev server started here is not reachable from a browser.
