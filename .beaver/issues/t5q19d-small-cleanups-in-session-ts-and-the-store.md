---
id: t5q19d
title: Small cleanups in session.ts and the store
state: todo
priority: low
labels:
    - maintenance
depends_on:
    - p6557v
    - v4l2o5
created: 2026-08-26T16:34:42Z
updated: 2026-08-26T17:40:35Z
---

## Finding

Narrowed from the original eleven-item list. Each item below has a settled repair — none is left as "fix or decline". The items that moved: `pathRoundedRect` went to `p6557v` (it is a `paint.ts` concern), the three test-harness items to `v4l2o5`, and the store factory and `onblocked` to `aofakr`.

**Two variables for one fact, read inconsistently.** `session.ts:461-462` has `storeUnavailable` (a const captured from the *initial* `list()`) and `storage` (mutable, downgraded on later failures at `:559` and `:574`). `uploadBackground` guards on `storage` (`:538`); `removeBackground` guards on the stale `storeUnavailable` (`:567`). After a failed put flips `storage`, `removeBackground` still calls into the dead store. No test crosses these two.
*Repair:* delete `storeUnavailable`. One mutable `storage` is the fact; both guards read it. Add a test that a failed put followed by a remove refuses without touching the store.

**An unreachable guard, kept alive by a cast.** `session.ts:588` checks `value !== "none" && value !== "light" && value !== "dark"` where `value: BrowserWindow` is exactly that union — it narrows to `never`. The only thing exercising it is `session.test.ts:245`: `setBrowserWindow("chrome" as "none")`, a cast written to defeat the checker.
*Repair:* delete the guard and delete that test. Note the contrast: every other validator guards `NaN`/`Infinity`/negatives, which *are* inhabitants of `number`. Those are real and must stay — do not sweep them along with this one.

**A test shim leaking into production.** `if (typeof bitmap.close === "function")` appears verbatim at `session.ts:67`, `:188`, and `:400`. `ImageBitmap.close` is mandatory in the DOM spec; the guard exists only because the test polyfill returns a `@napi-rs/canvas` `Image`, which has no `close()`.
*Repair:* delete all three. `v4l2o5` gives the polyfill a no-op `close()`, so this depends on it.

**Unused script.** `apps/web/package.json:10` `"typecheck": "tsc --noEmit"` is invoked by nothing — not CI, not the root `ci` script, not `AGENTS.md`. It is a slower duplicate of `vp check`, which also covers both `vite.config.ts` files, and it can drift from what CI enforces.
*Repair:* delete it.

## Acceptance

- `storeUnavailable` is gone and both guards read `storage`, with a test crossing them.
- The `setBrowserWindow` `never` guard and its cast test are gone; the numeric validators are untouched.
- No `typeof bitmap.close === "function"` remains.
- The `typecheck` script is gone.
- The four checks pass.
