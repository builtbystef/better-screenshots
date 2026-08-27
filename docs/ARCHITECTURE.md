# Architecture

The Studio is one browser application under `apps/web`. Its modules expose small interfaces and keep Composition rules, browser APIs, and presentation details on their respective sides of those interfaces.

## Source layout

`apps/web/src` is organised by feature, not by file type. The Studio owns its own folder and everything inside it; the rest of `src` is either routing or genuinely shared.

```text
routes/          the URL surface, and nothing else
features/studio/ the Studio
  composition/   Composition rules, pure and Node-only
  platform/      the Studio's DOM seams
  components/    the shell, the Preview, and the Inspector sections
  hooks/         one hook per Preview DOM concern
  studio-page.tsx  the Session boot
  index.ts       what the route is allowed to import
components/ui/   shadcn presentation primitives
hooks/           React hooks that know nothing about the Studio
lib/             shared modules that know nothing about the Studio
```

A second feature would arrive as a second folder under `features/`, not as new files spread across `composition/`, `platform/`, and `components/`.

## Module map

| Module                                         | Interface                                                                                                                            | Hides                                                                                                                                                                                                       |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `features/studio/composition/session.ts`       | `createSession(...) -> StudioSession`, plus the Composition and storage port types                                                   | The Composition shape, state machine, and validation                                                                                                                                                        |
| `features/studio/composition/placement.ts`     | `derivePlacement`, `browserWindowHeight`, and `gradientLine`                                                                         | Composition geometry; loads in Node                                                                                                                                                                         |
| `features/studio/composition/catalog.ts`       | Catalog data and `catalogSolidFor`, `catalogGradientFor`, `aspectPresetFor`                                                          | The eight solid Backgrounds, six gradient Backgrounds, default Background, and seven Aspect presets                                                                                                         |
| `features/studio/composition/messages.ts`      | Refusal and affordance message functions                                                                                             | User-facing outcome copy; loads in Node                                                                                                                                                                     |
| `features/studio/composition/parse.ts`         | `parseHex`, `parseInteger`, `parseScale`, `parseOpacityPercent`, `parseNonNegativeInteger`, `formatScale`                            | Input syntax and field formatting; loads in Node                                                                                                                                                            |
| `features/studio/platform/paint.ts`            | `renderComposition`, `paintScreenshot`, and `paintBrowserWindow`                                                                     | Canvas 2D drawing and image decoding                                                                                                                                                                        |
| `features/studio/platform/drag.ts`             | `isFileDrag`, `isTextFieldTarget`, `filesFrom`, `positionFromDrag`, and `hitsDrawn`                                                  | DataTransfer and pointer geometry                                                                                                                                                                           |
| `features/studio/platform/indexed-db-store.ts` | `createIndexedDbStore() -> UploadedBackgroundStore`                                                                                  | IndexedDB database `better-screenshots` version 1, object store `uploaded-backgrounds`, and key path `id`; storage failures are translated to `"quota"` or `"unavailable"` and do not throw across the port |
| `features/studio/studio-page.tsx`              | `StudioPage()`                                                                                                                       | The Session boot: it creates the Session with the IndexedDB adapter and hands it to `StudioShell`                                                                                                           |
| `features/studio/index.ts`                     | `StudioPage`                                                                                                                         | Every other module in the feature; the route imports this file and no deeper                                                                                                                                |
| `features/studio/components/studio-shell.tsx`  | `StudioShell({ session })`                                                                                                           | The Studio shell layout, the version subscription, and the five `InspectorSection` cards                                                                                                                    |
| `features/studio/components/preview.tsx`       | `Preview({ session, sessionVersion })`                                                                                               | The Preview surface markup and the wiring of the four Preview hooks                                                                                                                                         |
| `features/studio/components/inspector/`        | One Inspector section per file: `FrameInspector`, `BackgroundInspector`, `PlacementInspector`, `WindowInspector`, `EffectsInspector` | The section markup, the shared `KnobRow`, `PositionRow`, and `BorderColorRow`, the `styles.ts` class variants, and `gradientCss`                                                                            |
| `features/studio/hooks/`                       | One hook per Preview DOM concern: `usePreviewCanvas`, `useFileDrop`, `useScreenshotDrag`, `useExport`                                | Canvas mounting, the window drag and paste listeners, pointer drag state, and the export download                                                                                                           |
| `routes/index.tsx`                             | TanStack Router's `/` route with `StudioRoute`                                                                                       | Nothing: it declares the route and renders `StudioPage`                                                                                                                                                     |
| `routes/__root.tsx`                            | TanStack Router's root route                                                                                                         | The document shell, the head tags, and the colour-scheme boot script                                                                                                                                        |
| `hooks/use-draft.ts`                           | `useDraft(value, parse, onWrite, format?)`                                                                                           | React draft-input state, stored-value re-sync, and blur/Enter commit wiring                                                                                                                                 |
| `components/ui/`                               | One shadcn presentation primitive per file: `Button`, `Input`, `Label`, `Slider`, `Toggle`, `ToggleGroup`, `Card`, `Separator`       | Base UI behaviour and the Tailwind class strings that style it; each file is vendored from the `base-nova` registry that `components.json` names, and is edited only to keep the formatter happy            |
| `lib/scheme.ts`                                | `schemeBootScript`                                                                                                                   | The single light/dark rule and colour-scheme change listener                                                                                                                                                |
| `lib/utils.ts`                                 | `cn(...inputs)`                                                                                                                      | The one place a conditional class string is assembled: `clsx` composition and `tailwind-merge` conflict resolution                                                                                          |

Source dependencies point one way:

```text
routes/index.tsx   -> features/studio
routes/__root.tsx  -> lib/scheme
features/studio/studio-page.tsx -> features/studio/components, composition, platform
features/studio/components      -> features/studio/composition, features/studio/hooks, components/ui, hooks, lib/utils
features/studio/hooks           -> features/studio/composition, features/studio/platform
features/studio/platform        -> features/studio/composition types
features/studio/composition/session -> features/studio/composition/placement, features/studio/platform/paint
components/ui      -> lib/utils
features/studio/composition/placement, hooks, lib/scheme, lib/utils -> nothing
```

`components/ui/`, `hooks/`, and `lib/` are leaves that know nothing about the Studio. A primitive takes props and renders; `useDraft` takes a value, a parser, and a writer. Neither imports `session`, `catalog`, or any other Composition module, so the arrow never points back at the feature. The route is a composition point: it imports `features/studio` and nothing deeper, so the Studio can be re-mounted, re-routed, or replaced without touching its insides.

The folders carry the DOM rule too. `composition/` holds the Node-only modules; `platform/` holds the three that own a DOM seam — `paint.ts`, `drag.ts`, `indexed-db-store.ts`. DOM access is permitted in those three, in `lib/scheme.ts`, in `features/studio/components/` and `features/studio/hooks/`, and in the route tree, and nowhere else. Every module under `composition/` must load and test in the default Node environment, so a `@vitest-environment jsdom` pragma on a `composition/` test is a layering violation.

`platform/` rather than `browser/`, because Browser window is a glossary term.

Spec `u5l5hp` landed those primitives. Every control in the Studio is now a shadcn component, and `cn` is the only place a conditional class string is assembled — the hand-rolled class helpers are gone.

Issue `fabo7m` split the Studio page, which had grown to 1039 lines, into a shell, a Preview, one file per Inspector section, and one hook per Preview DOM concern. Issue `xgp77f` then gathered those files, the Composition modules, and the Studio's DOM seams under `features/studio/`, and reduced `routes/index.tsx` to the route declaration. Neither changed behaviour. `features/` is a sibling of `routes/`, not a child, because `routeTree.gen.ts` is generated from everything under `routes/`. Every internal import uses the `@/` alias.

## Composition invariants

`session.ts` owns Composition state and its invariants. Callers request changes through `StudioSession`; they do not reproduce its validation.

- Position is unbounded and the Frame clips it. No caller clamps Position. This rule was settled in spec `y7ac9r` and the contradictory UI clamp was removed in `jcden7`.
- Padding, Scale, Shadow, and Border are validated in `session.ts` and nowhere else.
- A Composition is replaced, never mutated. Writers assign a new object with object spread.
- `PAINT_SCALE = 2`: the render canvas is twice the Frame dimensions. Preview and Export use the same bitmap and therefore both depend on this constant. It is not part of the Composition.

A validator, clamp, or parse rule under `features/studio/components/`, `features/studio/hooks/`, or `routes/` is a layering violation. Parsing belongs in `composition/parse.ts`; state invariants belong in `composition/session.ts`; geometry belongs in `composition/placement.ts` or `platform/drag.ts` according to whether it describes the Composition or a DOM gesture.

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
