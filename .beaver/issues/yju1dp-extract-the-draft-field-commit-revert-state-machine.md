---
id: yju1dp
title: Extract the draft-field commit/revert state machine
state: todo
priority: medium
labels:
    - maintenance
depends_on:
    - mqab43
    - msmb41
created: 2026-08-26T16:31:27Z
updated: 2026-08-26T17:40:35Z
---

## Finding

"Controlled text draft, re-sync when the stored value changes, parse on blur and Enter, revert to the formatted value on refuse" is hand-written four times in `apps/web/src/routes/index.tsx`:

| Copy | Lines |
|---|---|
| `KnobRow` | 1024-1050 |
| `PositionRow` (two fields) | 1098-1142 |
| `BorderColorRow` | 1184-1206 |
| `BackgroundInspector` hex | 512, 533-548 |

`onHexKeyDown` at 542-548 and 1200-1206 are byte-identical. The `useEffect(() => setDraft(format(value)), [value])` re-sync appears four times; the commit body appears five.

They have already drifted: the `BackgroundInspector` copy has **no re-sync effect** (a latent staleness bug), and `PositionRow` clamps in `commitX`/`commitY` while `KnobRow.commit` does not clamp at all. This is the entire input contract of the Inspector, spread across 700 lines with nothing marking the copies as related.

## Repair

One `useDraft(value, format, parse, onWrite)` hook returning `{ draft, setDraft, onBlur, onKeyDown }`. All four sites become a call plus JSX.

## Acceptance

- One implementation of the draft/commit/revert rule.
- The commit rule is tested directly: given `(draft, storedValue, parse, format)` it returns either the written value or the reverted draft, covering `"abc"`, `"-1"`, `"12"`, and the `0.25 <-> 25` opacity round-trip.
- The missing re-sync in the background hex field is fixed.
- The four checks pass.

## Decisions (settled 2026-08-26)

**Two pieces, not one.** The page is not a test seam, so a hook alone cannot satisfy "the commit rule is tested directly":

1. **`commitDraft` in `parse.ts`** — pure, node-tested. Given `(draft, storedValue, parse, format)` it returns `{ write: number } | { revert: string }`. This is the rule, and it is what the acceptance criterion tests.
2. **`useDraft(value, format, parse, onWrite)` in `hooks/use-draft.ts`** — returns `{ draft, setDraft, onBlur, onKeyDown }`. It owns the `useState`, the re-sync `useEffect`, and the Enter/blur wiring, and calls `commitDraft` for the decision. `src/hooks/` is the path `components.json` already aliases as `@/hooks`.

**All four sites take the hook, uniformly.** `KnobRow` (1024-1050), both `PositionRow` fields (1098-1142), `BorderColorRow` (1184-1206), and the `BackgroundInspector` hex field (512, 533-548).

**The two drifts are fixed by uniformity, not by special cases:**
- The `BackgroundInspector` copy has no re-sync effect. The hook always re-syncs, so that latent staleness bug closes by construction.
- `PositionRow` clamps in `commitX`/`commitY` while `KnobRow.commit` does not. **`jcden7` deletes that clamp** — Position is unbounded — so by the time this runs there is nothing left to reconcile. Do not add clamping to the hook.

**`onHexKeyDown` (542-548 and 1200-1206, byte-identical) disappears** into the hook's `onKeyDown`.

## Acceptance additions

- `commitDraft` lives in `parse.ts` and its tests run in the default node environment, covering `"abc"`, `"-1"`, `"12"`, and the `0.25 <-> 25` opacity round-trip.
- Exactly one `useEffect` re-syncs a draft, and it is inside the hook.
- The background hex field re-syncs when the stored value changes.

## Follow-on

`4x0vj8` and `ikjavi` (shadcn `Input` and `Slider`) swap the rendered component underneath this hook. They must not touch the commit wiring — which is the reason to land the hook first.

## Order

Runs after `mqab43` and `msmb41`.
