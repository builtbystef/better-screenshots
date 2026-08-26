---
id: dwzqq1
title: Split chrome.ts into messages.ts, parse.ts, and drag.ts
state: done
assignee: agent
priority: high
labels:
    - maintenance
depends_on:
    - i57ovz
    - 1o9amb
created: 2026-08-26T17:31:27Z
updated: 2026-08-26T18:22:35Z
---

## Finding

`apps/web/src/chrome.ts` is five modules in one file — user-facing copy (`placeLine`, `exportLine`, `uploadLine`), DOM event predicates, input parsers, Catalog matchers, and the colour-scheme boot. Because two of its ~16 functions touch `HTMLInputElement`, `chrome.test.ts:1` declares `// @vitest-environment jsdom` for the whole file, so `parseHex("#abc")` needs a DOM.

The name is also the second meaning of a banned glossary synonym (`tl2tr4`): the glossary bans "chrome" for the Browser window, and this file uses the same word for something unrelated. Splitting removes the need for an umbrella term, so the collision disappears without inventing a new name.

This issue is a **pure move**. No behaviour changes, no signatures change, no logic is added or removed. It exists so that `mqab43`, `jcden7`, `tl2tr4`, and the pure-seam tests all land in modules that already exist.

## Repair

Split into the target layout recorded in `docs/ARCHITECTURE.md`:

| New module | Takes from `chrome.ts` | Environment |
|---|---|---|
| `messages.ts` | `placeLine`, `exportLine`, `uploadLine`, and every other copy constant (`chrome.ts:8-33`) | node |
| `parse.ts` | `parseHex`, `parseOpacityPercent`, and the formatters | node |
| `drag.ts` | `isFileDrag`, `positionFromDrag`, `clampPosition`, and the `HTMLInputElement` predicates | jsdom |

Split `chrome.test.ts` the same way. Only `drag.test.ts` keeps the `// @vitest-environment jsdom` pragma; `messages.test.ts` and `parse.test.ts` run in the default node environment.

Delete `chrome.ts` and `chrome.test.ts`. By the time this issue runs, `schemeClass`/`schemeBootScript` have moved to `scheme.ts` (`i57ovz`) and the three matchers have moved to `catalog.ts` (`1o9amb`), so nothing is left over.

Keep `clampPosition` here for now even though `jcden7` deletes it next — moving and deleting in one session mixes a mechanical change with a behavioural one.

## Acceptance

- `chrome.ts` and `chrome.test.ts` no longer exist.
- `messages.test.ts` and `parse.test.ts` carry no `@vitest-environment` pragma and pass.
- The test count is unchanged: this move adds and removes no assertions.
- `docs/ARCHITECTURE.md` shows the three modules as current, not target.
- The four checks pass.

## Notes

**agent** — 2026-08-26T18:22:35Z

Completed the pure split: moved copy helpers to messages.ts, parsers to parse.ts, and DOM/drag helpers to drag.ts; updated route imports and architecture; removed chrome.ts. Test seams are the three new module interfaces; the original 27 assertions are unchanged, with only drag.test.ts using jsdom. All four checks pass (102 tests total).
