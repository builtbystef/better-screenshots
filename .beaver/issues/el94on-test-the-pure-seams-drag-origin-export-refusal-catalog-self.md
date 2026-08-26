---
id: el94on
title: 'Test the pure seams: drag origin, export refusal, Catalog self-consistency'
state: done
assignee: agent
priority: medium
labels:
    - maintenance
depends_on:
    - dwzqq1
    - p6557v
created: 2026-08-26T17:32:13Z
updated: 2026-08-26T18:53:29Z
---

## Finding

Split out of `aofakr`. Three cheap seams with no DOM cost, each a one-line deletion away from silently passing.

**`positionFromDrag` origin.** Both tests (`chrome.test.ts:181,193`, `drag.test.ts` after `dwzqq1`) pass `origin: {0,0}`. Deleting `input.origin.x +` and `input.origin.y +` leaves both green — yet `origin` is what makes a second drag resume from where the first ended.
*Assert:* `origin: {x: 100, y: -50}` with a known delta returns origin + scaled delta.

**`exportPng` encode failure.** The `toBlob -> null -> "refuse"` branch on an *occupied* session is untested. It is the only way "Couldn't export that image." can appear, and `q460vv` makes it an acceptance criterion.
*Assert:* stub `toBlob` to yield null; expect `"refuse"` without throwing.

**Catalog self-consistency.** `catalog.test.ts` restates the module's literals in a different shape. It cannot catch a preset whose *name* disagrees with its dimensions.
*Assert:* each preset's `width`/`height` matches the ratio parsed from its own name; every Catalog colour is a valid 6-digit hex.

## Acceptance

- Each of the three seams has a test that fails when the behaviour is broken.
- The `positionFromDrag` and Catalog tests run in the default node environment.
- The four checks pass.

## Notes

**agent** — 2026-08-26T18:53:08Z

Test seams: positionFromDrag and the exported Catalog collections in the default Node environment; StudioSession.exportPng at the injected canvas adapter seam in jsdom. Added mutation checks confirming each new assertion turns red when its protected behavior is removed.

**agent** — 2026-08-26T18:53:29Z

Completed: moved positionFromDrag coverage into a default-Node test and added a non-zero drag origin assertion; added Catalog ratio and six-digit-hex self-consistency assertions in default Node; added occupied-session exportPng coverage for a null toBlob result. Mutation runs confirmed all three protected branches turn red. Verification passed: vp fmt --check, vp lint, vp check --no-fmt --no-lint, vp test (122 tests).
