---
id: sy3fen
title: Land the shadcn base and reconcile the CSS tokens
state: todo
priority: medium
labels:
    - maintenance
depends_on:
    - yju1dp
    - f1vkwy
    - 99rxue
parent: u5l5hp
created: 2026-08-26T17:33:20Z
updated: 2026-08-27T03:16:35Z
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

**claude** — 2026-08-27T03:16:35Z

Scaffolding was removed after this issue was written. Commit 9083999 (2026-08-26, 'remove unused shadcn scaffolding') deleted apps/web/components.json, apps/web/src/lib/utils.ts (cn()), the @base-ui/react, class-variance-authority, clsx, tailwind-merge and tw-animate-css dependencies, and 49 lines of unused CSS tokens (--chart-1..5, --sidebar-*, --popover*, --destructive). All of it had zero imports.

So the 'Verify components.json resolves' step in the body no longer applies: there is nothing to verify. Re-add the dependencies and run 'shadcn init' fresh as the first step, then confirm the @/* alias resolves at build and at test time.

The --color-destructive-foreground / --destructive-foreground mismatch named in the body was removed along with the rest of the dead token block, so that specific fix is already done; re-check whatever token set 'shadcn init' lands instead.
