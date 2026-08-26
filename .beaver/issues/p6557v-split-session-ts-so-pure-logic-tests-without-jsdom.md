---
id: p6557v
title: Split session.ts so pure logic tests without jsdom
state: todo
priority: medium
labels:
    - maintenance
depends_on:
    - 4cagyi
created: 2026-08-26T16:31:01Z
updated: 2026-08-26T17:40:35Z
---

## Finding

`apps/web/src/session.ts` is 672 lines fusing three unrelated things:

- a Composition state machine and validators (`setPadding`, `setScale`, `isUsableBackground`) — pure
- placement geometry (`derivePlacement`, `gradientLine`) — pure
- Canvas 2D painting (`paintBackground`, `paintShadow`, `paintBrowserWindow`, `paintScreenshot`) — impure, reaching `document.createElement("canvas")` at `session.ts:215` and `:480`

Because the painter is in the same module, the pure halves cannot load without a DOM. The setup burden is the evidence:

- `session.test.ts:1` needs `// @vitest-environment jsdom` to assert that `setPadding(-1)` returns `"refuse"`.
- `vite.config.ts:35` registers a `globalSetup` whose entire job is to **symlink a fake `canvas` package into `node_modules`** (`test/ensure-canvas-shim.ts:8-14`) so jsdom resolves `@napi-rs/canvas`.
- Neither `derivePlacement`, `paintBrowserWindow`, nor `gradientLine` is exported, so tests reach them only by constructing a session, placing a PNG, rendering at 2x, and reading pixels. Twenty-plus tests pay that cost to assert one formula.

## Repair

Extract `placement.ts` (`derivePlacement`, `browserWindowHeight`) and `paint.ts` (the four paint functions plus `gradientLine`), leaving `session.ts` as state plus the `StudioSession` interface. `createSession` becomes a coordinator that receives a canvas factory.

Related, fix while here: `session.ts:81-83` `chromeHeight` computes the bar height from screenshot width while `session.ts:269` recomputes it from `drawn.width`. They agree only by coincidence of the fit; one `browserWindowHeight(width)` should serve both.

## Acceptance

- Placement and validator tests run in the default node environment with no jsdom pragma and no canvas shim.
- Only the paint tests need jsdom.
- Pixel tests that guard compositing stay; tests that guard arithmetic become direct calls.
- The four checks pass.

## Decisions (settled 2026-08-26)

**Module names and contents**, per the target layout in `docs/ARCHITECTURE.md`:

- `placement.ts` — `derivePlacement`, `browserWindowHeight`, `gradientLine`. Pure, node environment, no imports.
- `paint.ts` — `paintBackground`, `paintShadow`, `paintBrowserWindow`, `paintScreenshot`, `renderComposition`. Imports `placement.ts`. The only module here permitted to touch a canvas.
- `session.ts` — state, validators, the `StudioSession` interface, and `createSession` as coordinator.

**The canvas factory has a default.** `createSession(options)` takes an optional `createCanvas?: () => HTMLCanvasElement` defaulting to `() => document.createElement("canvas")`. Callers in `routes/index.tsx` do not change. Injecting it is what lets the state tests run without jsdom; it is not a new required argument.

**Fold in three items from other issues while the file is open** — each is in `paint.ts` or `placement.ts` territory and doing them separately means opening the same file twice:

1. **`chromeHeight` computes from two different bases.** `session.ts:81-83` derives the bar height from the screenshot width; `session.ts:269` recomputes it from `drawn.width`. They agree only by coincidence of the fit. One `browserWindowHeight(width)` in `placement.ts` serves both. (Already in this issue's Repair section; restated because it is the subtle one.)
2. **`pathRoundedRect` is a pure pass-through** (from `t5q19d`). `session.ts:195-204` forwards six arguments to `ctx.roundRect` unchanged, at 7 call sites, all of which spell out the same five `* PAINT_SCALE` multiplications; two are character-for-character identical. **Replace it with `pathScaledRect(ctx, rect, radius)` that applies `PAINT_SCALE` internally.** Do *not* take the `ctx.scale(PAINT_SCALE, PAINT_SCALE)` route — that also scales line widths and shadow blur, which is a behaviour change this issue is not making.
3. **The banned-synonym renames inside these files** (from `tl2tr4`): `BROWSER_WINDOW_CHROME_RATIO` -> `BROWSER_WINDOW_BAR_RATIO`, `chromeHeight` -> `browserWindowHeight`, `chromeH` -> `barHeight`, `shotY`/`shotH` -> `screenshotY`/`screenshotHeight`. `tl2tr4` keeps the `routes/index.tsx` renames and the glossary work.

**The pixel tests stay.** Tests that guard compositing — the two-pass shadow, the rounded clip, the cover fit — keep rendering and reading pixels. Only tests that assert arithmetic become direct calls on `placement.ts`. If a test's failure mode is "the wrong number", convert it; if it is "the wrong pixels", leave it.

## Acceptance additions

- `createSession` still works with no arguments from `routes/index.tsx`.
- `pathRoundedRect` is gone and no call site spells out `* PAINT_SCALE` more than once.
- No identifier in `session.ts`, `placement.ts`, or `paint.ts` uses "chrome" or "shot" for a Browser window or a Screenshot.
- Flip the `placement.ts` and `paint.ts` rows in `docs/ARCHITECTURE.md` to current.

## Order

Runs after `4cagyi`. Independent of the `chrome.ts` chain — different files — so it can run alongside it. `t5q19d`, `v4l2o5`, `dza8bk`, `el94on`, and `f1vkwy` all run after it.
