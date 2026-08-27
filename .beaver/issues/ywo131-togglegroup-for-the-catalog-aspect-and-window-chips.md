---
id: ywo131
title: ToggleGroup for the Catalog, aspect, and window chips
state: done
assignee: claude
priority: medium
labels:
    - maintenance
depends_on:
    - sy3fen
    - 1o9amb
parent: u5l5hp
created: 2026-08-26T17:33:46Z
updated: 2026-08-27T04:57:18Z
---

The Studio has four chip groups, all hand-rolled as `<button>` lists with a `selected` boolean driving a class ternary: the Catalog solids, the Catalog gradients, the aspect presets, and the Browser window schemes (`windowSchemes` at `routes/index.tsx:813`).

Each is a single-select group. `ToggleGroup` with `type="single"` is what they are.

## Work

- Add `ToggleGroup` / `ToggleGroupItem` and replace all four groups.
- Delete `chipClass` (`routes/index.tsx:489`) and `textChipClass` (`:765`).
- The selected value comes from the Catalog matchers `1o9amb` moved into `catalog.ts` — `catalogSolidFor`, `catalogGradientFor`, `aspectPresetFor`. They return the Catalog entry, and selection compares `entry.name`. Do not reintroduce a reference-identity comparison; that was the bug `1o9amb` closed.
- The gradient chips render their swatch through `gradientCss` (`:484`). Keep that; it is the item's content, not its selection logic.

## Acceptance

- All four groups render as `ToggleGroup`, single-select, keyboard navigable.
- `chipClass` and `textChipClass` are gone.
- Selection compares by Catalog entry name, never by object identity.
- All existing tests pass unchanged.
- The four checks pass.

## Notes

**claude** — 2026-08-27T04:29:04Z

Landed: all four chip groups now render as ToggleGroup. `shadcn add toggle-group` vendored `toggle.tsx` and `toggle-group.tsx` into `components/ui`, unmodified. The Catalog solids, the Catalog gradients, the aspect presets and the Browser window schemes are each one `ToggleGroup` of `ToggleGroupItem`s. `chipClass` and `textChipClass` are gone; a single `chipItem` cva with a `swatch` and a `text` variant, plus the `chipGroup` layout string, replaces both, and neither carries a selection ternary.

**There is no `type="single"` prop.** The base-nova registry builds on Base UI, not Radix. `ToggleGroup` is single-select already — `multiple` defaults to false — and its value is an array of the pressed items' values. Single-select is the default here, not an opt-in, so the group takes `value={[name]}` and gets `[]` back when the pressed item is clicked again.

**Selection by name, without a name-to-entry lookup.** Each group is controlled by an array holding the selected Catalog entry's name: `catalogSolidFor`, `catalogGradientFor` and `aspectPresetFor` return the entry, `entry.name` is the item value, and Base UI compares those strings. Nothing compares object references. The write stays on the item, as `onPressedChange`, so the entry itself is still in the closure and no lookup is needed to get from a name back to a Catalog entry. `onPressedChange` fires with the next pressed state, so re-clicking the selected chip passes `false` and writes nothing — the same early return the old `onClick` had, and the group cannot fall empty, because the stored value it renders from never changes.

The Browser window group keys on the `BrowserWindow` domain value (`none` / `light` / `dark`), not on the label; that list is not Catalog data and the value is its own identity.

**Selection styling is now CSS, not a boolean.** The old ternary becomes the `data-pressed:` and `not-data-pressed:` variants that Base UI's `data-pressed` attribute drives. Verified in the built stylesheet: `.data-pressed\:ring-2[data-pressed]` and `.not-data-pressed\:hover\:ring-2:not([data-pressed]):hover`. One visible consequence of taking the vendored styling as-is: a pressed text chip picks up base-nova's `aria-pressed:bg-muted` instead of the old `bg-background font-medium`. Kept, as the spec calls this a markup and styling migration.

**Seam: no new test, same reasoning as `4x0vj8` and `ikjavi`.** The suite still cannot render React, and `q53d20` owns that harness. The criteria were verified with a throwaway jsdom probe (`react-dom/client` plus `act`, no new dependency) that mounted a real `ToggleGroup` over the aspect presets; it was run and then deleted:

- Exactly one item carries `data-pressed`, and its `aria-pressed` is `true`.
- Clicking an unpressed item writes once and moves the pressed state to it.
- Clicking the pressed item writes nothing and keeps the selection.
- Roving focus is live: tabindex across the seven items is `[0, -1, -1, -1, -1, -1, -1]`, and an `ArrowRight` on the focused item moves focus to the next one. Base UI applies that focus in a `queueMicrotask`, so an assertion has to await a microtask — a synchronous `act` block sees the old `activeElement`.

Pointer-level behaviour beyond the click path was not exercised; it is the library's own.

No dependency changed: `@base-ui/react` and `class-variance-authority` were already the runtime of the vendored components, so `package.json` and the lockfile are untouched. All 100 existing tests pass unchanged. Format, lint, typecheck, test and the app build pass.

**claude** — 2026-08-27T04:57:18Z

q53d20 (render harness) was deleted on 2026-08-27. Render-testing the components/ui wrappers is not wanted for this project: they are vendored registry source whose behaviour is the library's, and the seams worth asserting are covered without rendering React. The standing rule is now in docs/CODING_STANDARDS.md under Module boundaries — verify a wrapper's prop forwarding with a throwaway probe when a slice needs it, and delete the probe with the slice. References to q53d20 above are historical; there is no follow-on issue.
