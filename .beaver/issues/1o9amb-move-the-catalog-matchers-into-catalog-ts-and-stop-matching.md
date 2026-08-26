---
id: 1o9amb
title: Move the Catalog matchers into catalog.ts and stop matching by reference identity
state: todo
priority: high
labels:
    - maintenance
depends_on:
    - 4cagyi
created: 2026-08-26T16:35:13Z
updated: 2026-08-26T17:41:14Z
---

## Finding

`matchingSolid` (`chrome.ts:92`), `matchingGradient` (`:116`), and `matchingAspectPreset` (`:108`) each take the collection to search as a parameter. There is exactly one Catalog in the system — module-level frozen data in `catalog.ts` — so the parameter buys nothing and charges every caller a derivation:

```ts
// routes/index.tsx:41-42 — exists solely to feed them
const catalogSolidColors = catalogSolids.map((entry) => entry.color);
const catalogGradientValues = catalogGradients.map((entry) => entry.value);
```

The same two lines are repeated verbatim at `chrome.test.ts:110` and `:129`. The bodies are one `.find()` each — the parameter list is as complex as the body.

**The projection is also load-bearing in a way nothing states.** `matchingGradient` returns an element *of the array it was handed*, and `routes/index.tsx:638` then tests `selectedGradient === entry.value` — reference identity, not equality. It works only because `.map()` preserves the same object references. Freezing, cloning, or making `value` a getter in `catalog.ts` breaks every chip highlight with no type error and no test failure. Same pattern at `:790` (`selected === preset`) and `:588`.

These functions also never touch anything from `chrome.ts` — they operate purely on `catalog.ts` data, which is textbook feature envy.

## Repair

Move all three into `catalog.ts` as `catalogSolidFor(color)`, `catalogGradientFor(value)`, `aspectPresetFor(width, height)`, closing over the catalog arrays. `routes/index.tsx:41-42` and both test derivations disappear. Have them return the catalog **entry** (or its name) and compare by name rather than identity, so the selection contract stops depending on `.map()` preserving references.

## Acceptance

The matchers take no collection parameter. Chip selection does not depend on reference identity. The four checks pass.

## Decisions (settled 2026-08-26)

- **Return the Catalog entry, not the value.** `catalogSolidFor(color)`, `catalogGradientFor(value)`, and `aspectPresetFor(width, height)` each return the entry or `undefined`.
- **Selection compares `entry.name`.** `routes/index.tsx:638`, `:790`, and `:588` currently compare by object reference, which works only because `.map()` preserves references. Comparing by name is what stops a future `Object.freeze`, a clone, or a getter from silently breaking every chip highlight with no type error and no test failure.
- The three matchers move into `catalog.ts` and close over the module-level arrays. They take no collection parameter.

## Follow-on

`ywo131` (the shadcn `ToggleGroup` sub-issue) depends on this contract — it wires selection to the value these return. Do not reintroduce identity comparison there.

## Order

Runs after `4cagyi` and before `dwzqq1`, so the chrome.ts split has three fewer functions to place.
