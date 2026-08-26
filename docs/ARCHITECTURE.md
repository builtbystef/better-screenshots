# Architecture

The Studio is one browser application under `apps/web`. Its modules expose small interfaces and keep Composition rules, browser APIs, and presentation details on their respective sides of those interfaces. This document records both the current structure and the settled target structure; rows marked **Target** do not exist yet.

## Current module map

| Module                             | Interface                                                                          | Hides                                                                                                                                                                                                       |
| ---------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/src/session.ts`          | `createSession(...) -> StudioSession`, plus the Composition and storage port types | The Composition shape and state machine, validation, `derivePlacement` geometry, and the background, shadow, Browser window, and Screenshot paint passes                                                    |
| `apps/web/src/indexed-db-store.ts` | `createIndexedDbStore() -> UploadedBackgroundStore`                                | IndexedDB database `better-screenshots` version 1, object store `uploaded-backgrounds`, and key path `id`; storage failures are translated to `"quota"` or `"unavailable"` and do not throw across the port |
| `apps/web/src/catalog.ts`          | `catalogSolids`, `catalogGradients`, `catalogDefaultSolid`, and `aspectPresets`    | The eight solid Backgrounds, six gradient Backgrounds, default Background, and seven Aspect presets                                                                                                         |
| `apps/web/src/scheme.ts`           | `schemeBootScript`                                                                 | The single light/dark rule and colour-scheme change listener                                                                                                                                                |
| `apps/web/src/chrome.ts`           | Pure helpers for messages, parsing, Catalog matching, and drag geometry            | Refusal copy, input syntax, chip matching, and Position calculations                                                                                                                                        |
| `apps/web/src/routes/index.tsx`    | TanStack Router's `/` route with `HomePage`                                        | The Studio shell, Preview, the five Inspector sections, DOM event handling, and React state                                                                                                                 |
| `apps/web/src/lib/utils.ts`        | `cn(...)`                                                                          | Tailwind class merging                                                                                                                                                                                      |

The current source dependency direction is:

```text
routes/index.tsx -> session, catalog, chrome, scheme, indexed-db-store
chrome.ts        -> session and catalog types
catalog.ts       -> session types
indexed-db-store.ts -> session's UploadedBackgroundStore port
```

`session.ts` currently has no source imports. It nevertheless combines state, geometry, Canvas 2D painting, and browser image decoding; the target map separates those responsibilities. Likewise, `chrome.ts` is a temporary collection, not an architectural layer.

## Target module map

Structural issues move one row at a time from **Target** to current. Keep this map current as those issues land.

| Status     | Module                | Interface                                                                   | Hides                                                        |
| ---------- | --------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Current    | `session.ts`          | `StudioSession` and the `createSession` coordinator                         | The Composition state machine and writer validation          |
| **Target** | `placement.ts`        | `derivePlacement`, `browserWindowHeight`, `gradientLine`                    | Composition geometry; loads in Node                          |
| **Target** | `paint.ts`            | The four paint passes and `renderComposition`                               | Canvas 2D drawing and image decoding                         |
| Current    | `catalog.ts`          | Catalog data and `catalogSolidFor`, `catalogGradientFor`, `aspectPresetFor` | Built-in Background and Aspect preset lookup                 |
| **Target** | `messages.ts`         | Refusal and affordance message functions                                    | User-facing outcome copy; loads in Node                      |
| **Target** | `parse.ts`            | `parseHex`, `parseOpacityPercent`, formatters, and `commitDraft`            | Text-field parsing and commit rules; loads in Node           |
| **Target** | `drag.ts`             | `isFileDrag`, `filesFrom`, `positionFromDrag`, and `hitsDrawn`              | DataTransfer and pointer geometry                            |
| Current    | `scheme.ts`           | `schemeBootScript`                                                          | The single light/dark rule and colour-scheme DOM integration |
| Current    | `indexed-db-store.ts` | `createIndexedDbStore() -> UploadedBackgroundStore`                         | The production persistence adapter                           |
| **Target** | `hooks/use-draft.ts`  | The draft/commit/revert hook                                                | React draft-input lifecycle                                  |
| Current    | `lib/utils.ts`        | `cn(...)`                                                                   | Tailwind class merging                                       |
| **Target** | `components/ui/`      | shadcn components                                                           | Reusable presentation primitives, after spec `u5l5hp`        |
| Current    | `routes/index.tsx`    | `HomePage`                                                                  | JSX and React state only                                     |

`chrome.ts` is absent from the target. Issue `dwzqq1` replaces it with `messages.ts`, `parse.ts`, and `drag.ts` rather than creating another umbrella module.

Target dependencies point one way:

```text
routes/index.tsx -> session, catalog, messages, parse, drag, scheme, hooks, components/ui
session.ts       -> placement, paint, catalog, indexed-db-store (port)
paint.ts         -> placement
placement.ts, parse.ts, messages.ts, scheme.ts -> nothing
```

In the target, DOM access is permitted in exactly five places: `paint.ts`, `drag.ts`, `scheme.ts`, `indexed-db-store.ts`, and the route tree. Every other module must load and test in the default Node environment. A `@vitest-environment jsdom` pragma on another module's test is therefore a layering violation. Until the target extractions land, the current `session.ts` and `chrome.ts` necessarily retain the DOM access assigned to their target replacements.

## Composition invariants

`session.ts` owns Composition state and its invariants. Callers request changes through `StudioSession`; they do not reproduce its validation.

- Position is unbounded and the Frame clips it. No caller clamps Position. This rule was settled in spec `y7ac9r`; issue `jcden7` removes the current contradictory UI clamp.
- Padding, Scale, Shadow, and Border are validated in `session.ts` and nowhere else.
- A Composition is replaced, never mutated. Writers assign a new object with object spread.
- `PAINT_SCALE = 2`: the render canvas is twice the Frame dimensions. Preview and Export use the same bitmap and therefore both depend on this constant. It is not part of the Composition.

A validator, clamp, or parse rule in `routes/index.tsx` is a layering violation. Parsing belongs in `parse.ts`; state invariants belong in `session.ts`; geometry belongs in `placement.ts` or `drag.ts` according to whether it describes the Composition or a DOM gesture.

## Cross-seam contracts

### Session outcomes

StudioSession writers return an explicit outcome instead of throwing. Ordinary writers use `"ok" | Refuse`, where `Refuse` is `"refuse"`. Upload uses `UploadRefuse` (`"undecodable" | "quota" | "unavailable"`) because the Inspector needs distinct user-facing messages. Browser and adapter failures are translated before crossing these seams.

### Uploaded Background persistence

`UploadedBackgroundStore` is the persistence port consumed by `createSession`. `createIndexedDbStore` is the production adapter. The `memoryStore` helper in `session.test.ts` is the in-memory test adapter. Session behavior depends on the port, not IndexedDB details.

### Preview and Export

Preview and Export share the Canvas 2D draw path required by ADR 0001. Painting clips to the Frame, runs the four paint passes, and produces a bitmap scaled by `PAINT_SCALE`; Export serializes that same result with `toBlob`.

### Canvas tests

`apps/web/src/test/ensure-canvas-shim.ts` is a test-only global setup. It symlinks the fake `canvas` package from `apps/web/src/test/canvas-shim` beside jsdom so that jsdom resolves `@napi-rs/canvas`. This shim is infrastructure for the browser seam, not a production adapter.

## Package boundary

`packages/` remains empty by decision. Keep Studio modules in `apps/web` and extract a package only when a second consumer exists, as recorded by issue `0abxd5`.
