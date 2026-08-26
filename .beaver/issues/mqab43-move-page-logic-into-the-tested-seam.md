---
id: mqab43
title: Move page logic into the tested seam
state: todo
priority: high
labels:
    - maintenance
depends_on:
    - dwzqq1
created: 2026-08-26T16:30:30Z
updated: 2026-08-26T17:40:35Z
---

## Finding

`apps/web/src/routes/index.tsx` is 1,234 lines with zero tests, and pure rules have accreted inside it next to identical twins that live in the tested seam. Five audit dimensions landed on this independently.

Untested logic in the page, with its tested sibling:

- `routes/index.tsx:131` `hitsDrawn` — the drag hit-test (`bounds.left + canvas.clientLeft + drawn.x * scale`). Sibling `positionFromDrag` is at `chrome.ts:127` with tests at `chrome.test.ts:181,193`. A dropped `clientLeft`, an inverted scale, or a `>`/`>=` slip makes the Screenshot grabbable in the wrong region — visible to a user, invisible to CI. `.beaver/issues/k50xag` states it as an acceptance criterion that nothing verifies.
- `routes/index.tsx:106` `filesFrom` — including the `DataTransfer.items` fallback (lines 113-123) that *is* the real paste path when `data.files` is empty. A bug here shows as "No image on the clipboard." on a good paste.
- `routes/index.tsx:748` `parseNonNegativeInteger` — structurally identical to `chrome.ts:87` `parseOpacityPercent` (tested twice). Five callers, no test.
- `routes/index.tsx:761` `clamp` — duplicates the clamping already in `chrome.ts:141`.
- `routes/index.tsx:753,757` `formatInteger` / `formatScale`.

The convention "the page is not a test seam" is sound only if the page holds no logic. It currently holds a lot, so the convention has quietly become "not tested at all".

## Repair

Move these into `chrome.ts` beside their siblings and test them there. `hitsDrawn` needs restating over a plain `{left, top, clientWidth, clientLeft}` input so it does not need a DOM.

## Acceptance

- `hitsDrawn`, `filesFrom`, and `parseNonNegativeInteger` live in a tested module and have tests.
- `hitsDrawn` tests assert a point just inside each of the four `drawn` edges hits and just outside misses, at a preview scale other than 1.
- `filesFrom` tests cover: non-empty `files` wins; empty `files` plus image `items` yields the file; `kind: "string"` and null `getAsFile()` are skipped; nothing yields `[]`.
- The four checks pass.

## Decisions (settled 2026-08-26)

**Where each function lands.** By the time this runs, `dwzqq1` has split `chrome.ts` into `messages.ts`, `parse.ts`, and `drag.ts`, so these modules already exist:

| Moving | To | Environment |
|---|---|---|
| `hitsDrawn` (`:131`) | `drag.ts` | restated over a plain input, see below |
| `filesFrom` (`:106`) | `drag.ts` | jsdom |
| `parseNonNegativeInteger` (`:748`) | `parse.ts` | node |
| `formatInteger` (`:753`), `formatScale` (`:757`) | `parse.ts` | node |

**`hitsDrawn` takes a plain rect, not a DOM node.** Restate it over `{left, top, clientWidth, clientLeft}` plus the drawn rect and the point, so it tests in the default node environment. The page reads those four fields off the canvas and passes them in. This is the difference between a test that needs jsdom and one that does not.

**Correction to the finding above.** The line about `clamp` at `routes/index.tsx:761` duplicating `chrome.ts:141` is wrong on both halves: `chrome.ts:141` is `clampPosition`, a different signature, and `jcden7` deletes it outright because Position is unbounded. The generic three-argument `clamp` stays in the page — it positions the `KnobRow` slider thumb (`:1052`), which is a display detail, and `ikjavi` deletes it when the shadcn `Slider` lands. **Do not move `clamp`.**

**`parseNonNegativeInteger` and `parseOpacityPercent` stay separate.** They are structurally identical but they parse different domain values with different bounds. Merging them into one generic parser is a decision this issue does not make; if the duplication still reads badly once both sit in `parse.ts`, file a follow-up.

## Acceptance additions

- No moved function needs a DOM that did not need one before, and `hitsDrawn` needs none at all.
- `parse.test.ts` still carries no `@vitest-environment` pragma after these arrive.
- Flip the `parse.ts` and `drag.ts` rows in `docs/ARCHITECTURE.md` to list the moved functions.

## Order

Runs after `dwzqq1`. `msmb41` and `yju1dp` both rewrite the same JSX and run after this.
