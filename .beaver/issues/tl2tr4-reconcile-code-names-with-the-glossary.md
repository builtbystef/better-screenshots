---
id: tl2tr4
title: Reconcile code names with the glossary
state: todo
priority: low
labels:
    - maintenance
depends_on:
    - 1o9amb
    - dwzqq1
    - mqab43
    - p6557v
created: 2026-08-26T16:34:00Z
updated: 2026-08-26T17:52:26Z
---

## Finding

`docs/GLOSSARY.md` is the stated authority on the project's vocabulary, and the code uses two of its banned synonyms.

**"chrome" for the Browser window.** The glossary lists `chrome (when this wrap is meant)` under _Avoid_ for **Browser window**. Used anyway at `session.ts:79` `BROWSER_WINDOW_CHROME_RATIO`, `:81` `chromeHeight`, `:97`, `:269` `chromeH`, `:388`, and in test copy at `session.test.ts:447`.

Worse, `chrome` also names a *different* concept: `apps/web/src/chrome.ts` holds UI copy, parsers, drag math, and the colour-scheme rule — nothing to do with the Browser window. One word, two meanings, one of them banned, neither in the glossary. This breaks the glossary's own rule at line 3: "use one term for each concept".

**"shot" for the Screenshot.** Listed under _Avoid_ for **Screenshot**. Used at `routes/index.tsx:170` `overShot` (also `:340, 349, 384, 392, 397`) and `session.ts:385-397` `shotY` / `shotH`.

## Repair

- `BROWSER_WINDOW_CHROME_RATIO` -> `BROWSER_WINDOW_BAR_RATIO`; `chromeHeight` -> `browserWindowHeight`; `chromeH` -> `barHeight`.
- `overShot` -> `overScreenshot`; `shotY`/`shotH` -> `screenshotY`/`screenshotHeight`.
- Decide what `chrome.ts` should be called. It is really five modules in one file — user-facing copy (`placeLine`, `exportLine`, `uploadLine`), DOM event predicates, input parsers, catalog matchers, and the colour-scheme boot — and because two of ~16 functions touch `HTMLInputElement`, `chrome.test.ts:1` declares `// @vitest-environment jsdom` for the whole file, so `parseHex("#abc")` needs a DOM. Splitting it into `messages.ts`, `parse.ts`, `drag.ts`, and `scheme.ts` removes the need for an umbrella term and the name collision disappears on its own. Sequence the rename after that split, and after the matchers move to `catalog.ts`.

## Also worth deciding

Three domain concepts exist in the code with no glossary entry: **Uploaded background** (`UploadedBackground`, the Inspector's Image group — distinct from Catalog and from Screenshot), **Session** (`StudioSession`, the named public seam), and **Refuse** (`"ok" | Refuse` crosses every seam and is reserved project vocabulary). Add them or decide they are implementation detail.

## Acceptance

No _Avoid_ synonym appears in production identifiers for the concept it is banned for. The four checks pass.

## Decisions (settled 2026-08-26)

**The `chrome.ts` name collision is already solved when this runs.** `dwzqq1` splits the file into `messages.ts`, `parse.ts`, and `drag.ts` and deletes it, so no umbrella term is needed and the word "chrome" stops naming two things. Nothing to decide here.

**The `session.ts` renames belong to `p6557v`**, which is already opening those files: `BROWSER_WINDOW_CHROME_RATIO` -> `BROWSER_WINDOW_BAR_RATIO`, `chromeHeight` -> `browserWindowHeight`, `chromeH` -> `barHeight`, `shotY`/`shotH` -> `screenshotY`/`screenshotHeight`.

**What is left for this issue:**

1. `routes/index.tsx`: `overShot` -> `overScreenshot` (`:170`, and `:340, 349, 384, 392, 397`).
2. Test copy: `session.test.ts:447` and any other test description using a banned synonym.
3. **Add the three missing glossary entries.** They are project vocabulary that crosses seams, not implementation detail — settled, add them:
   - **Uploaded background**: A Background image the user supplied, stored in the browser and listed in the Inspector's Image group. Distinct from a Catalog value and from a Screenshot. *Avoid*: custom background, user image.
   - **Session**: The live Composition and its writers, opened when the Studio loads. *Avoid*: store, state, model.
   - **Refuse**: The result a writer returns when it will not accept a value. *Avoid*: error, reject, fail.
   Follow the file's own rules at line 3: one or two sentences saying what the term IS, no implementation details, rejected synonyms under *Avoid*.
4. **One more mismatch, found after this issue was filed.** The glossary's **Composition** entry reads "the screenshots on it" — plural. The code is `screenshot: Blob | null`, singular, and multi-screenshot collage waits on the roadmap. Correct it to singular. `11cr8l` fixes the same plural in the README; this one is in the glossary, so it belongs here.

## Acceptance additions

- `git grep -nw 'overShot\|shotY\|shotH\|chromeH\|chromeHeight'` returns nothing in `apps/web/src`.
- The glossary has entries for Uploaded background, Session, and Refuse, each following the file's format rules.
- The Composition entry is singular.

## Order

Runs after `dwzqq1`, `mqab43`, and `p6557v` — renaming before the moves settle means renaming twice.

## Notes

**claude** — 2026-08-26T17:52:26Z

Glossary: the Browser window placement rule is settled, do not re-litigate it.

Padding, Position, and Scale all act on the Screenshot together with its Browser window — `derivePlacement` (session.ts:85-99) computes `objectHeight = screenshot.height + chromeHeight(...)` and derives the fit, the drawn size, and the center from that. The three entries carried a repeated "— and its Browser window, when present —" qualifier; it was trimmed on 2026-08-26, which made them inaccurate.

Settled by stating it once in the Browser window entry, which sits directly above the three it governs:

  The Chrome-style title and address bar drawn around a Screenshot. The two
  are placed as one, so Padding, Position, and Scale act on both.

Leave Padding, Position, and Scale as one sentence each. Do not reintroduce the per-entry qualifier.

Two more glossary mismatches to sweep while you are in the file, neither covered by 11cr8l:

- **Background**: "The surface a composition's screenshots sit on." Lowercase "composition", and plural "screenshots" against `screenshot: Blob | null`.
- **Effect**: "A visual change applied to a screenshot". Lowercase.

Both are the same singular/capitalisation fix as the Composition entry this issue already carries.
