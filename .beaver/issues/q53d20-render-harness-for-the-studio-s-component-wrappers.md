---
id: q53d20
title: Render harness for the Studio's component wrappers
state: todo
priority: low
labels:
    - maintenance
parent: u5l5hp
created: 2026-08-27T03:54:44Z
updated: 2026-08-27T03:54:44Z
---

Nothing in the suite renders React. `session`, `parse`, `paint`, `drag` and `indexed-db-store` are covered, but every control in `routes/index.tsx` is verified only by reading it.

That gap costs the `u5l5hp` slices directly. Each one swaps a hand-rolled control for a vendored component whose prop forwarding is unverified: `4x0vj8` had to prove by hand that Base UI's `Input` still delivers `onChange`, `onBlur` and `onKeyDown` to `useDraft`, and that `Button` stays inert when disabled. `ywo131` (ToggleGroup), `ikjavi` (Slider) and `r169wm` (Card) each carry the same risk, and no test would catch a regression.

## Work

- Decide where the harness lives and widen `docs/CODING_STANDARDS.md`. The standard currently permits `@vitest-environment jsdom` only for `paint`, `drag`, `scheme`, `indexed-db-store`, or a route. A test that mounts `components/ui` wrappers does not qualify today; either the list grows or the harness lives in a route test.
- No new dependency is needed. `react-dom/client` plus `act` from `react` mount and flush; `jsdom` is already a devDependency. React 19 delegates events at the root container, so a `blur` assertion must dispatch `focusout` with `bubbles: true` — a non-bubbling `blur` never reaches React.
- Cover the bindings the migration can break: draft commits on blur and on Enter, `ArrowUp`/`ArrowDown` suppressed, a disabled control writing nothing.

## Acceptance

- A committed test mounts the Studio's fields and asserts commit-on-blur and commit-on-Enter through the rendered element.
- `docs/CODING_STANDARDS.md` and the harness agree on where a jsdom test may live.
- The four checks pass.
