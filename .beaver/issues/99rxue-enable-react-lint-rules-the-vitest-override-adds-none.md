---
id: 99rxue
title: Enable React lint rules; the vitest override adds none
state: todo
priority: medium
labels:
    - maintenance
depends_on:
    - yju1dp
    - f1vkwy
created: 2026-08-26T16:32:53Z
updated: 2026-08-26T17:40:35Z
---

## Finding

`vite.config.ts:11` sets `lint.plugins: ["typescript"]`, which **replaces** oxlint's default plugin set — the config's own comment at `:24` confirms replace semantics ("`plugins` in an override replaces the base list, so repeat it").

`vp lint --print-config` resolves to exactly 84 rules: 57 eslint-core plus 27 `typescript/`. Not one `react/`, `react-hooks/`, `jsx-a11y/`, `import/`, `promise/`, or `unicorn/` rule. Confirmed per-file, not just repo-wide — `routes/index.tsx` and `session.test.ts` each resolve to the same 84.

`routes/index.tsx` has 22 `useState`/`useEffect`/`useCallback` call sites and 8 dependency arrays (`:58, 209, 278, 736, 1028, 1103, 1106, 1188`). `rules-of-hooks` and `exhaustive-deps` are unguarded.

To be fair to the current code: every one was checked and none is violated today. Hooks all precede the early returns at `:60` and `:738`, and every `format`/`parse` prop passed to `KnobRow` is a stable module-level function, so the `[format, value]` dep at `:1028` is sound. The gap is unguarded, not yet violated — which is the cheap moment to close it.

Related: the `**/*.test.ts` override at `vite.config.ts:22-28` that adds `"vitest"` adds **zero** rules in practice — a test file resolves to the same 84. It is a no-op; delete it or make it work.

## Repair

Add `"react"` (and `"jsx-a11y"`, given the drag-drop and file-picker UI) to `lint.plugins`, repeating them in the test override. Fix or remove the vitest override.

## Acceptance

- `vp lint --print-config` shows react and react-hooks rules resolving for `routes/index.tsx`.
- The vitest override either adds rules or is gone.
- `vp lint` passes, or each new finding is fixed.
- The four checks pass.

## Decision (settled 2026-08-26) — measured, not estimated

**Set `lint.plugins` to `["typescript", "unicorn", "oxc", "react", "jsx-a11y"]`** in `vite.config.ts`, and the same list plus `"vitest"` in the `**/*.test.ts` override.

This was run against the current tree before filing:

| Config | Rules resolved | `vp lint` |
|---|---|---|
| today — `["typescript"]` | 84 (57 eslint + 27 typescript) | passes |
| proposed | **165** (57 eslint + 27 typescript + 35 jsx_a11y + 19 react + 14 oxc + 13 unicorn) | **passes, zero findings** |

So this is a zero-finding change today. It closes the gap without a cleanup tail.

**Note what the current config actually costs.** `plugins` replaces rather than extends, and oxlint enables `unicorn` and `oxc` by default — so `["typescript"]` silently dropped 27 rules that were on before anyone wrote that line. Restoring them is part of this fix, not scope creep.

**`react-hooks/rules-of-hooks` is not available.** oxlint's react plugin resolves `react/exhaustive-deps` but no `rules-of-hooks`. Enable what exists, and say plainly in the closing note that rules-of-hooks stays unguarded — do not claim coverage the config does not deliver. The 22 hook call sites were checked by hand during the audit and none violates it today.

**The vitest override: delete it.** Measured with `"vitest"` in the list, a test file still resolves 165 rules and zero carry a `vitest/` prefix — the plugin ships only opt-in rules, so listing it adds nothing. Either name the specific vitest rules to turn on, or delete the override block entirely. Deleting is preferred; an override that does nothing is worse than no override, because it reads as coverage.

## Acceptance additions

- `vp lint --print-config` resolves 165 rules for `apps/web/src/routes/index.tsx`, including `react/exhaustive-deps`.
- The same list resolves for a `.test.ts` file.
- `vp lint` passes with no rule allowed or downgraded to add it.

## Order

Runs late — after `yju1dp` and `f1vkwy`. Enabling `react/exhaustive-deps` mid-refactor would flag intermediate states of code those issues are rewriting.
