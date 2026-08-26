---
id: sy3fen
title: Land the shadcn base and reconcile the CSS tokens
state: done
assignee: agent
priority: medium
labels:
    - maintenance
depends_on:
    - yju1dp
    - f1vkwy
    - 99rxue
parent: u5l5hp
created: 2026-08-26T17:33:20Z
updated: 2026-08-26T19:47:32Z
---

Land the shadcn base so the later sub-issues are pure component swaps.

## Work

- Verify `components.json` resolves: `style: "base-nova"`, css `src/styles.css`, baseColor `neutral`, cssVariables true, aliases `@/components`, `@/components/ui`, `@/lib`, `@/lib/utils`, `@/hooks`. Create `src/components/ui/` and confirm the `@/*` alias imports work at build and at test time — today `git grep 'from "@/'` in `apps/web/src` returns nothing, so the alias has never been exercised.
- Fix `styles.css:22`: `--color-destructive-foreground` maps to `var(--destructive-foreground)`, which is never defined. Only `--destructive` exists. Define the variable or drop the mapping — a component that consumes it currently renders with an invalid value.
- Reconcile the token set with what shadcn actually uses. `--color-popover*`, `--color-secondary`, `--color-destructive*`, and `--color-accent-foreground` are unused today but become live once components land — keep them. `--color-chart-1..5` and all eight `--color-sidebar*` have no consumer and no planned one: delete them. Keep `--radius-lg/2xl/3xl/4xl` only if a landed component references them.
- `styles.css:2` imports `tw-animate-css` and no `animate-*` class is used. Keep the import only if a component this spec lands needs it; otherwise remove the import and the dependency.
- Record the reason for `@base-ui/react`, `class-variance-authority`, `clsx`, and `tailwind-merge` where `docs/CODING_STANDARDS.md` asks for it. `lucide-react` already has a consumer at `routes/index.tsx:2`.
- Adopt `cn` in the seven class ternaries in `routes/index.tsx` that assemble long Tailwind strings. This is the only markup change in this sub-issue.

If the `shadcn` CLI cannot run under the sandbox, vendor the component source from the registry by hand and say so in the closing note. Do not add a component library dependency to work around it.

## Acceptance

- `@/*` imports resolve in `vp check`, `vp test`, and `vp build`.
- `--color-destructive-foreground` resolves to a defined value, or is gone.
- No CSS token in `styles.css` is without a consumer or a named component that will consume it.
- Every production dependency has a stated reason.
- All 101 existing tests still pass unchanged.
- The four checks pass.

## Notes

**agent** — 2026-08-26T19:47:32Z

# Done

Landed the shadcn base so later sub-issues can swap components.

## Work

- `components.json` already matched the required style, CSS path, baseColor, cssVariables, and aliases. Created `apps/web/src/components/ui/` (`.gitkeep` only). Did not run the shadcn CLI and did not vendor component source — this slice does not add Button/Input/Label/etc.
- Exercised `@/*`: `routes/index.tsx` and `lib/utils.test.ts` import `cn` from `@/lib/utils`. Root `vite.config.ts` now has `resolve.tsconfigPaths: true` so Vitest resolves the alias (apps/web already had it for build). Confirmed in `vp check`, `vp test`, and `vp build`.
- Defined `--destructive-foreground` in `:root` and `.dark` (`oklch(0.985 0 0)`), so `--color-destructive-foreground` resolves.
- Deleted `--color-chart-1..5`, all eight `--color-sidebar*`, and `--radius-lg/2xl/3xl/4xl` (no landed component references those radii). Kept `--radius-sm/md/xl` (`rounded-sm/md/xl` on the page). Kept `--color-popover*`, `--color-secondary*`, `--color-destructive*`, and `--color-accent-foreground` for Button / ToggleGroup (and the issue's named keep-list).
- Removed `tw-animate-css` import and dependency — no component this spec lands uses `animate-*`.
- Recorded production-dependency reasons in `docs/CODING_STANDARDS.md`.
- Adopted `cn` in the seven class ternaries (`chipClass`, `textChipClass`, export button, color swatch, image thumb, remove control, add label) and the Preview well's conditional suffixes. Helpers themselves stay for later issues.

## Tests

Added `lib/utils.test.ts` (alias + `cn` merge). Existing tests unchanged: 131 prior + 1 new = 132. Four checks pass.

## Reviewer

No shadcn primitives were added. Token keep-list for unused-today colors is the parent spec's named set plus Button/ToggleGroup consumers.
