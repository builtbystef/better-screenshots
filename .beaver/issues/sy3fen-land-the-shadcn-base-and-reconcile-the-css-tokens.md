---
id: sy3fen
title: Land the shadcn base and reconcile the CSS tokens
state: done
assignee: claude
priority: medium
labels:
    - maintenance
depends_on:
    - yju1dp
    - f1vkwy
    - 99rxue
parent: u5l5hp
created: 2026-08-26T17:33:20Z
updated: 2026-08-27T03:36:53Z
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

**claude** — 2026-08-27T03:36:27Z

Base landed. `shadcn init --base base --preset nova` ran under the sandbox — the CLI reached the registry, so nothing was vendored by hand.

**Seam (AFK selection).** The only unit with observable behaviour here is `cn` at `@/lib/utils`. `apps/web/src/lib/utils.test.ts` tests it (conflict resolution and falsy-branch dropping) and imports it through `@/lib/utils`, which is what exercises the alias at test time. The token reconciliation and the `cn` adoption in the markup have no test seam; the four checks and `vp build` cover them.

**What landed.**
- `apps/web/components.json` — `style: base-nova`, css `src/styles.css`, baseColor `neutral`, cssVariables true, aliases `@/components`, `@/components/ui`, `@/lib`, `@/lib/utils`, `@/hooks`. Written by the CLI, unedited.
- `apps/web/src/lib/utils.ts` — `cn`, plus `apps/web/src/lib/utils.test.ts`.
- `apps/web/src/routes/index.tsx` imports `cn` from `@/lib/utils`, so the alias resolves at build time too.
- `resolve.tsconfigPaths: true` added to the **root** `vite.config.ts`. `apps/web/vite.config.ts` already had it, but `vp test` runs from the repo root and resolved `@/lib/utils` against the root config, where the option was absent — the import failed with "Cannot find package '@/lib/utils'". This was the real work behind the "@/* resolves in check, test, and build" criterion.
- `cn` adopted at the seven class ternaries (`chipClass`, `textChipClass`, the export control, the colour swatch, the thumbnail button, the thumbnail remove, the Add label) and at the `studio-well` string concatenation, which assembled a conditional class string the same way. Each site now states its shared classes once. Verified byte-for-byte: a throwaway script compared all 15 rendered class sets against the strings they replaced — every set is identical, so no visual change.

**Token set.** `--color-destructive-foreground` never came back; the mismatch the body named is gone. Removed what `shadcn init` re-added with no consumer and no named consumer: `--color-chart-1..5`, all eight `--color-sidebar*`, `--font-sans`/`--font-heading` and the `html { @apply font-sans }` rule. Removed `--radius-lg/2xl/3xl/4xl` — only `rounded-sm`, `rounded-md` and `rounded-xl` appear in `src`, so only those three mappings stay. Kept `--color-popover*`, `--color-secondary`, `--color-destructive` and `--color-accent-foreground` per the body: unused today, live once components land.

**Dependency decisions.** Kept `clsx` and `tailwind-merge` (they back `cn`, which now has callers) and `@base-ui/react` and `class-variance-authority` (spec u5l5hp settled that these stay as the base-nova runtime; they arrive with the first component). The reason is recorded in `apps/web/package.json` under the `"// shadcn"` key, next to the existing `"// @tanstack"` note, so it travels with the code rather than only with this issue — that is what protects them from a second removal pass like 9083999.

Dropped three things `shadcn init` added that no criterion asks for: `tw-animate-css` (the body says remove the import and the dependency unless a landed component needs it — none lands), `@fontsource-variable/geist` (the app deliberately uses `system-ui`), and `shadcn` itself, which the CLI wrote into **dependencies** to back an `@import "shadcn/tailwind.css"`. That import supplies the `data-open`/`data-checked`/`data-*` custom variants the base-nova components use; with no component landed it emits nothing, and a 300-package CLI in production dependencies is not something this sub-issue can justify. `shadcn add` re-adds both when the first component needs them. Noted on 4x0vj8.

`src/components/ui/` is not created: git does not track an empty directory, and `shadcn add` creates it. The `@/*` alias is proven through `@/lib/utils`, and `@/components/ui` resolves through the same `@/* -> ./src/*` mapping.

**Checks.** `vp fmt --check`, `vp lint`, `vp check --no-fmt --no-lint`, `vp test` and `vp run -r build` all pass. The suite is 100 tests: 98 pre-existing, all passing and untouched (no existing test file is in the diff), plus the 2 new `cn` tests. The body's "101 existing tests" is stale — commits 1e7f766 and e92508f trimmed the suite after this issue was written.
