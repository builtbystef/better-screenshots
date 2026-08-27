# Architecture

The Studio is one browser application under `apps/web`. Its modules expose small interfaces and keep Composition rules, browser APIs, and presentation details on their respective sides of those interfaces.

## Module map

| Module                             | Interface                                                                                                 | Hides                                                                                                                                                                                                       |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/src/session.ts`          | `createSession(...) -> StudioSession`, plus the Composition and storage port types                        | The Composition shape, state machine, and validation                                                                                                                                                        |
| `apps/web/src/placement.ts`        | `derivePlacement`, `browserWindowHeight`, and `gradientLine`                                              | Composition geometry; loads in Node                                                                                                                                                                         |
| `apps/web/src/paint.ts`            | `renderComposition`, `paintScreenshot`, and `paintBrowserWindow`                                          | Canvas 2D drawing and image decoding                                                                                                                                                                        |
| `apps/web/src/indexed-db-store.ts` | `createIndexedDbStore() -> UploadedBackgroundStore`                                                       | IndexedDB database `better-screenshots` version 1, object store `uploaded-backgrounds`, and key path `id`; storage failures are translated to `"quota"` or `"unavailable"` and do not throw across the port |
| `apps/web/src/hooks/use-draft.ts`  | `useDraft(value, parse, onWrite, format?)`                                                                | React draft-input state, stored-value re-sync, and blur/Enter commit wiring                                                                                                                                 |
| `apps/web/src/catalog.ts`          | Catalog data and `catalogSolidFor`, `catalogGradientFor`, `aspectPresetFor`                               | The eight solid Backgrounds, six gradient Backgrounds, default Background, and seven Aspect presets                                                                                                         |
| `apps/web/src/scheme.ts`           | `schemeBootScript`                                                                                        | The single light/dark rule and colour-scheme change listener                                                                                                                                                |
| `apps/web/src/messages.ts`         | Refusal and affordance message functions                                                                  | User-facing outcome copy; loads in Node                                                                                                                                                                     |
| `apps/web/src/parse.ts`            | `parseHex`, `parseInteger`, `parseScale`, `parseOpacityPercent`, `parseNonNegativeInteger`, `formatScale` | Input syntax and field formatting; loads in Node                                                                                                                                                            |
| `apps/web/src/drag.ts`             | `isFileDrag`, `isTextFieldTarget`, `filesFrom`, `positionFromDrag`, and `hitsDrawn`                       | DataTransfer and pointer geometry                                                                                                                                                                           |
| `apps/web/src/routes/index.tsx`    | TanStack Router's `/` route with `HomePage`                                                               | The Studio shell, Preview, the five Inspector sections, DOM event handling, and React state                                                                                                                 |

Source dependencies point one way:

```text
routes/index.tsx -> session, catalog, messages, parse, drag, hooks
routes/__root.tsx -> scheme
session.ts       -> placement, paint, indexed-db-store (port)
paint.ts         -> placement, session types
messages.ts, catalog.ts -> session types
placement.ts, parse.ts, scheme.ts -> nothing
```

DOM access is permitted in exactly five places: `paint.ts`, `drag.ts`, `scheme.ts`, `indexed-db-store.ts`, and the route tree. Every other module must load and test in the default Node environment. A `@vitest-environment jsdom` pragma on another module's test is therefore a layering violation.

Adopting shadcn components (spec `u5l5hp`) adds a `components/ui/` row for reusable presentation primitives; nothing else in this map moves.

## Composition invariants

`session.ts` owns Composition state and its invariants. Callers request changes through `StudioSession`; they do not reproduce its validation.

- Position is unbounded and the Frame clips it. No caller clamps Position. This rule was settled in spec `y7ac9r` and the contradictory UI clamp was removed in `jcden7`.
- Padding, Scale, Shadow, and Border are validated in `session.ts` and nowhere else.
- A Composition is replaced, never mutated. Writers assign a new object with object spread.
- `PAINT_SCALE = 2`: the render canvas is twice the Frame dimensions. Preview and Export use the same bitmap and therefore both depend on this constant. It is not part of the Composition.

A validator, clamp, or parse rule in `routes/index.tsx` is a layering violation. Parsing belongs in `parse.ts`; state invariants belong in `session.ts`; geometry belongs in `placement.ts` or `drag.ts` according to whether it describes the Composition or a DOM gesture.

## Cross-seam contracts

### Session outcomes

StudioSession writers return an explicit outcome instead of throwing. Ordinary writers use `"ok" | Refuse`, where `Refuse` is `"refuse"`. Upload uses `UploadRefuse` (`"undecodable" | "quota" | "unavailable"`) because the Inspector needs distinct user-facing messages. Browser and adapter failures are translated before crossing these seams.

### Uploaded Background persistence

`UploadedBackgroundStore` is the persistence port consumed by `createSession`. `createIndexedDbStore` is the production adapter. The `memoryStore` helper in `test/helpers.ts` is the in-memory test adapter, shared by every test that needs one. Session behavior depends on the port, not IndexedDB details.

### Preview and Export

Preview and Export share the Canvas 2D draw path required by ADR 0001. Painting clips to the Frame, runs the paint passes, and produces a bitmap scaled by `PAINT_SCALE`; Export serializes that same result with `toBlob`.

### Canvas tests

`apps/web/src/test/ensure-canvas-shim.ts` is a test-only global setup. It symlinks the fake `canvas` package from `apps/web/src/test/canvas-shim` beside jsdom so that jsdom resolves `@napi-rs/canvas`. This shim is infrastructure for the browser seam, not a production adapter.

## Package boundary

`packages/` remains empty by decision. Keep Studio modules in `apps/web` and extract a package only when a second consumer exists, as recorded by issue `0abxd5`.
