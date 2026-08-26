---
id: v4l2o5
title: Share the test helpers and make the canvas shim verifiable
state: done
assignee: agent
priority: medium
labels:
    - maintenance
depends_on:
    - p6557v
created: 2026-08-26T17:31:47Z
updated: 2026-08-26T18:58:02Z
---

## Finding

Three items pulled out of `t5q19d` because they share one subject: the test harness every rendering test depends on.

**Test helpers are duplicated across files.** The `createImageBitmap` polyfill, `pngBlob`, `defaultSolid`, and `isUploaded` are byte-identical copies in `session.test.ts:12-46` and `indexed-db-store.test.ts:7-25`. The polyfill is the load-bearing shim for every rendering test; a copy that drifts silently changes what half the suite tests.

**`ensure-canvas-shim.ts:11` returns early if anything already occupies `node_modules/canvas`.** A stale symlink, or a transitively installed real `canvas`, is then used for every render test with no signal.

**The shim itself is type-unchecked.** `test/canvas-shim/index.cjs` is hand-written CommonJS that all 101 tests depend on. `allowJs` is off everywhere, so no type check sees its three untyped parameters.

## Repair

- Move the four helpers into `apps/web/src/test/helpers.ts` and import them from both test files. The directory already exists for shared setup.
- Give the polyfill a no-op `close()` while it is being moved, so `t5q19d` can delete the three `typeof bitmap.close === "function"` guards in `session.ts`.
- In `ensure-canvas-shim.ts`, resolve the existing entry and compare it with `src/test/canvas-shim`. Throw with the resolved path when it differs, instead of returning.
- Convert `index.cjs` to `.cts` so `vp check` sees it.

## Acceptance

- One definition of each helper; both test files import it.
- The polyfill exposes `close()`.
- A `node_modules/canvas` pointing anywhere else fails the run with a message naming the resolved path.
- `vp check` type-checks the shim.
- The four checks pass.

## Notes

**agent** — 2026-08-26T18:54:48Z

AFK test seam: verify shared helper behavior through apps/web/src/test/helpers.ts and canvas-shim path validation through an exported filesystem helper used by global setup; typechecking is verified by vp check.

**agent** — 2026-08-26T18:58:02Z

Completed the shared test harness: session, paint, and IndexedDB tests now import one helper module; its createImageBitmap polyfill handles synthetic and PNG blobs and exposes close(). Canvas global setup now verifies the resolved shim path and reports mismatches, with direct coverage. Converted the canvas adapter to type-checked .cts and updated its package entry. All four checks pass (124 tests).
