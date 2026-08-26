---
id: f1vkwy
title: Name the data clumps and take patches instead of positional arguments
state: todo
priority: low
labels:
    - maintenance
depends_on:
    - p6557v
    - msmb41
created: 2026-08-26T16:34:00Z
updated: 2026-08-26T17:40:35Z
---

## Finding

Four field groups travel together throughout the code with no type, and the setters that write them are positional.

**No named types.** `{ x, y }` is written inline in `Composition.position` (`session.ts:26`), `gradientLine`'s return, `positionFromDrag`'s three inputs and output, `clampPosition`, `dragRef`, and `hitsDrawn`. `{ width, height }` is **Frame** in the glossary — "the stored width and height of a Composition" — yet `Size` (`session.ts:61`) is not exported, so `clampPosition`, `PositionRow`'s prop, and `PlacementInspector` each restate it; `routes/index.tsx:906` rebuilds `{ width: session.composition.width, height: session.composition.height }` from a Composition that already has both. Same for `shadow: { offset, blur, opacity }` and `border: { width, color }`.

**Positional setters force callers to reconstruct the tuple.** `routes/index.tsx:920-936`:

```ts
session.setShadow(next.offset ?? shadow.offset, next.blur ?? shadow.blur, next.opacity ?? shadow.opacity)
session.setBorder(next.width ?? border.width, next.color ?? border.color)
```

To change one field the caller reads the other two back out and passes them in. Adding a fourth shadow field edits both sides; dropping a `??` silently resets a sibling. `session.test.ts:328-336` has to encode refusal cases as bare `[number, number, number]` tuples.

**`HexColor` enforces nothing.** `session.ts:1` is `export type HexColor = string`, so `routes/index.tsx:550-552` and `:1229` pass a raw DOM value straight through and it typechecks. Meanwhile `parseHex` (`chrome.ts:64`) returns the strictly narrower `` `#${string}` ``, which is silently widened. Two disagreeing representations of one domain value, with `isHexColor` re-validating at runtime because the compiler cannot.

**`Refuse` is a pass-through.** `export type Refuse = "refuse"` never appears alone — all 11 uses are `"ok" | Refuse`, which is longer than `"ok" | "refuse"`. Substituting the literal produces no type error and shortens every signature.

## Repair

Export `Point`, `Frame`, `Shadow`, `Border`. Make `setShadow(patch: Partial<Shadow>)` and `setBorder(patch: Partial<Border>)` merge and validate internally. Either delete `HexColor` or narrow it to `` `#${string}` `` and make `parseHex`/`isHexColor` its only constructors. Delete `Refuse`.

## Acceptance

`Frame` exists as a type and `PlacementInspector` stops rebuilding it. Shadow and border writes pass one object. The four checks pass.

## Decisions (settled 2026-08-26)

The Repair section offers three either/ors. All are settled:

- **Export `Point`, `Frame`, `Shadow`, and `Border` from `session.ts`.** `Frame` is the glossary term for `{width, height}` — use that name, not `Size`. `PlacementInspector` stops rebuilding it, and `routes/index.tsx:906` passes `session.composition` through instead of reconstructing.
- **`setShadow(patch: Partial<Shadow>)` and `setBorder(patch: Partial<Border>)`** merge against the current value and validate internally. The caller passes only what changed; the `?? shadow.offset` reconstruction at `routes/index.tsx:920-936` disappears. `session.test.ts:328-336` stops encoding refusal cases as bare `[number, number, number]` tuples and passes objects.
- **Narrow `HexColor` to `` `#${string}` ``**, and make `parseHex` and `isHexColor` its only constructors. Do not delete it — the narrowing is the point. `routes/index.tsx:550-552` and `:1229` currently pass a raw DOM value straight through and it typechecks; after this they must go through `parseHex`, and the compiler enforces what `isHexColor` re-checks at runtime today.
- **Delete `Refuse`.** All 11 uses are `"ok" | Refuse`, which is longer than `"ok" | "refuse"`. It never appears alone.

**Do not widen the patch idea to the other setters.** `setPadding`, `setScale`, `setSize`, and `setPosition` take their own domain values and are not clumps. This issue names four types and changes two setters.

## Acceptance additions

- `Point`, `Frame`, `Shadow`, `Border` are exported and used at every site that previously restated their shape.
- A raw `string` cannot reach `setBorder`'s colour field or `setBackground`'s solid without passing `parseHex`; verify by compiling, not by reading.
- `Refuse` does not exist.

## Order

Runs after `p6557v` (the modules must be split before their types move) and `msmb41` (both edit the same setters and the same call sites).
