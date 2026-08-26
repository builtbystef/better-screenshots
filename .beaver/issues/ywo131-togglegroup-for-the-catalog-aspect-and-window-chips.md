---
id: ywo131
title: ToggleGroup for the Catalog, aspect, and window chips
state: todo
priority: medium
labels:
    - maintenance
depends_on:
    - sy3fen
    - 1o9amb
parent: u5l5hp
created: 2026-08-26T17:33:46Z
updated: 2026-08-26T17:40:35Z
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
