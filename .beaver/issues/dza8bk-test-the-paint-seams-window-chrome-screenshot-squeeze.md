---
id: dza8bk
title: 'Test the paint seams: window chrome, screenshot squeeze, diagonal gradients'
state: todo
priority: medium
labels:
    - maintenance
depends_on:
    - p6557v
created: 2026-08-26T17:32:13Z
updated: 2026-08-26T17:40:35Z
---

## Finding

Split out of `aofakr`. Three seams in the draw path that the suite cannot fail. By the time this runs, `p6557v` has moved the paint functions into `paint.ts` and exported `derivePlacement`/`browserWindowHeight`/`gradientLine` from `placement.ts`, so these are direct calls plus a small number of pixel assertions — not twenty tests paying for a full session render.

**Browser-window chrome.** `ape56b` specifies traffic lights, an address pill, and the URL in system-ui, with exact colours. The two window tests assert one pixel each — the bar colour at `(960, 122)`, above the pill. `#303134`, `#E8EAED`, `#FF5F57`, `#FEBC2E`, `#28C840` appear in no test file, and no test renders a non-empty URL, so `ctx.fillText` is dead to the suite.
*Assert:* the first traffic-light centre is `#FF5F57`; a pill-interior pixel matches per theme; `setUrl("example.com")` changes pixels inside the pill.

**Screenshot squeeze under the window.** The painter sets `shotH = drawn.height - chromeH` (`screenshotHeight = drawn.height - barHeight` after the `tl2tr4` rename). Leaving it as `drawn.height` overflows the clip and crops the bottom, and both window tests still pass.
*Assert:* a fixture with a distinct bottom stripe lands just above `drawn.y + drawn.height`.

**`gradientLine` angles.** Only 0 and 90 degrees are tested; all six Catalog gradients are at 180/160/135/150/140. The combined-length term collapses at both tested angles, so the formula that stops diagonal gradients banding is never evaluated.
*Assert:* `gradientLine` directly, in the node environment, at each angle the Catalog actually ships.

## Acceptance

- Each of the three seams has a test that fails when the behaviour is broken.
- The `gradientLine` tests run in the default node environment with no jsdom pragma.
- The traffic-light and pill colours appear as named constants shared with `paint.ts`, not as literals restated in the test.
- The four checks pass.
