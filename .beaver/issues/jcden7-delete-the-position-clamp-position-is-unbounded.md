---
id: jcden7
title: Delete the Position clamp; Position is unbounded
state: todo
priority: medium
labels:
    - maintenance
depends_on:
    - dwzqq1
created: 2026-08-26T16:31:27Z
updated: 2026-08-26T17:40:35Z
---

## Decision (settled 2026-08-26)

**Position is unbounded. The Frame clips.** This is what the settled spec `y7ac9r` already says. The clamp arrived later, in the UI, without that decision being revisited — so the code is what drifted, not the spec. Delete the clamp rather than promote it into the session.

A Screenshot may now sit partly outside the Frame; the draw clips it at the Frame edge. That is a deliberate capability, not a defect: it is how a bleed composition is made.

## Finding

`clampPosition` lives at `chrome.ts:141` (`drag.ts` after `dwzqq1`) and is applied by the UI at four independent call sites:

1. `routes/index.tsx:356-365` — during a pointer drag
2. `routes/index.tsx:782-783` — after an aspect-preset write (`setSize`, then re-read position, then `setPosition` — a two-step write with the result discarded)
3. `routes/index.tsx:1114` — `PositionRow.commitX`
4. `routes/index.tsx:1125` — `PositionRow.commitY`

`session.setPosition` (`session.ts:612-618`) already validates only `Number.isFinite`, and `session.setSize` (`:580`) already leaves position alone. So the session is already correct for the unbounded rule and needs no change: this issue is a deletion.

## Repair

- Delete `clampPosition` and its two tests (`chrome.test.ts:205`, `:212`).
- Delete the import at `routes/index.tsx:15` and unwrap all four call sites into plain writes.
- `routes/index.tsx:782-783` collapses to a single `session.setSize(width, height)` call.
- Leave the generic three-argument `clamp` at `routes/index.tsx:761` alone. It is unrelated — it positions the `KnobRow` slider thumb (`:1052`) and is a display detail, not a domain rule. `ikjavi` deletes it when the shadcn `Slider` lands.
- Record the rule in the Composition invariants section of `docs/ARCHITECTURE.md`: Position is unbounded, the Frame clips, and no caller clamps.
- Write a note on `y7ac9r` saying the code now matches it.

## Acceptance

- `clampPosition` does not exist.
- A session test asserts that `setPosition` accepts a Position outside the Frame and stores it verbatim, and that `setSize` to a smaller Frame leaves Position unchanged.
- A render test asserts that a Screenshot positioned past the Frame edge is clipped, not moved — the Frame's outermost pixel column still paints background beyond the Screenshot's clipped edge.
- `routes/index.tsx:782-783` is a single `setSize` call.
- `docs/ARCHITECTURE.md` records the invariant and `y7ac9r` carries the note.
- The four checks pass.
