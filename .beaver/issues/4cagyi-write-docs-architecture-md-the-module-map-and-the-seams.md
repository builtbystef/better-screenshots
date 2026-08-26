---
id: 4cagyi
title: 'Write docs/ARCHITECTURE.md: the module map and the seams'
state: todo
priority: high
labels:
    - maintenance
created: 2026-08-26T16:31:01Z
updated: 2026-08-26T16:31:01Z
---

## Finding

`docs/ARCHITECTURE.md` is the 3-line template header and names no module and no seam. `AGENTS.md:24` points every agent at it as "the modules and the seams", and this skill's own instruction is that audits compare it with reality — there is nothing to compare against.

The cost is concrete, not theoretical: several findings in this audit exist because no document records which modules are supposed to be deep and where invariants live. The Position clamp landed in the UI, parse rules landed in the page, and nothing flagged either as a layering violation.

Note: the current stub state is intentional (confirmed with the user during the audit). This issue is to write the file, not to restore a previous version.

## What it must record

The four real modules and their interfaces:

| Module | Interface | Hides |
|---|---|---|
| `session.ts` (672 ln) | `createSession(...)` -> `StudioSession` | Composition shape, `derivePlacement` geometry, all four paint passes |
| `indexed-db-store.ts` (125) | `createIndexedDbStore()` | DB `better-screenshots` v1, store `uploaded-backgrounds`, keyPath `id`; every failure becomes `"quota" \| "unavailable"`, nothing throws |
| `catalog.ts` (99) | 4 const exports | 8 solids, 6 gradients, the default, 7 aspect presets |
| `chrome.ts` (172) | ~16 pure functions | refusal copy, parsing, chip matching, drag geometry, colour-scheme rule |
| `routes/index.tsx` (1234) | `HomePage` | Studio shell, Preview, 5 Inspector sections, all React state |

And the contracts that cross seams and are currently written nowhere:

- `PAINT_SCALE = 2` — the render canvas is 2x the Frame; both Preview and Export depend on it.
- The `"ok" | Refuse` / `UploadRefuse` protocol every writer returns.
- `UploadedBackgroundStore` as the port, `createIndexedDbStore` as the production adapter.
- The test-only canvas shim (`test/ensure-canvas-shim.ts` symlinks a fake `canvas` package for jsdom).
- `packages/` stays empty by decision — extract only when a second consumer exists (`0abxd5`).

## Acceptance

- The file names each module, its interface, and what it hides.
- It states the dependency direction and where DOM access is permitted.
- It states where Composition invariants live, so a reviewer can catch the next `clampPosition`-style drift.
- The four checks pass.

## Target layout, settled 2026-08-26

This file is the memory the implementation loop does not otherwise have: each session is cold, and several queued issues move code between modules. **Record both the layout as it is today and the target layout below**, marking the target rows as target. Each structural issue then flips its own row to current as it lands.

```
apps/web/src/
  session.ts            state machine + StudioSession + createSession coordinator
  placement.ts   TARGET  derivePlacement, browserWindowHeight, gradientLine     (node)
  paint.ts       TARGET  the four paint passes + renderComposition              (canvas)
  catalog.ts            the data + catalogSolidFor / catalogGradientFor / aspectPresetFor
  messages.ts    TARGET  refusal and affordance copy                            (node)
  parse.ts       TARGET  parseHex, parseOpacityPercent, formatters, commitDraft (node)
  drag.ts        TARGET  isFileDrag, filesFrom, positionFromDrag, hitsDrawn     (jsdom)
  scheme.ts      TARGET  the single light/dark rule and its boot script
  indexed-db-store.ts   the UploadedBackgroundStore adapter
  hooks/use-draft.ts   TARGET  the draft/commit/revert hook
  lib/utils.ts          cn
  components/ui/ TARGET  shadcn components (spec u5l5hp, after this queue)
  routes/index.tsx      the page: JSX and React state only
```

`chrome.ts` does not appear. `dwzqq1` splits it into `messages.ts`, `parse.ts`, and `drag.ts` and deletes it — which also resolves the name collision `tl2tr4` found, without inventing a new umbrella term.

Dependency direction, one way only:

```
routes/index.tsx -> session, catalog, messages, parse, drag, hooks, components/ui
session.ts       -> placement, paint, catalog, indexed-db-store (port)
paint.ts         -> placement
placement.ts, parse.ts, messages.ts, scheme.ts -> nothing
```

**DOM access is permitted in exactly five places**: `paint.ts`, `drag.ts`, `scheme.ts`, `indexed-db-store.ts`, and the route tree. Everything else must load and test in the default node environment. That rule is what makes a `@vitest-environment jsdom` pragma reviewable: a pragma on any other module's test is a layering violation.

## Composition invariants — where they live

- **Position is unbounded. The Frame clips.** Settled in spec `y7ac9r` and confirmed 2026-08-26; `jcden7` deletes the UI clamp that contradicted it. No caller clamps Position.
- **Padding, Scale, Shadow, and Border are validated in `session.ts`** and nowhere else. Every writer returns `"ok" | "refuse"`; nothing throws across a seam.
- **`PAINT_SCALE = 2`** — the render canvas is 2x the Frame. Both Preview and Export depend on it, and it is not a Composition field.
- **Composition is replaced, never mutated** — `composition = { ...composition, ... }` at eleven sites.

State that a validator, a clamp, or a parse rule appearing in `routes/index.tsx` is a layering violation. That sentence is the thing a reviewer needs and does not currently have — it is why the Position clamp and five parse rules landed in the page unremarked.

## Also record

- The `"ok" | Refuse` / `UploadRefuse` protocol every writer returns.
- `UploadedBackgroundStore` as the port, `createIndexedDbStore` as the production adapter, the in-memory double as the test adapter.
- The test-only canvas shim (`test/ensure-canvas-shim.ts` symlinks a fake `canvas` package so jsdom resolves `@napi-rs/canvas`).
- `packages/` stays empty by decision — extract only when a second consumer exists (`0abxd5`).

## Order

**This issue runs first in the queue.** Nine later issues read the target layout from this file, and a cold session cannot infer it.
