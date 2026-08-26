---
id: 11cr8l
title: Correct factual rot in README and ADR 0001
state: done
assignee: agent
priority: medium
labels:
    - maintenance
depends_on:
    - 4cagyi
created: 2026-08-26T16:33:28Z
updated: 2026-08-26T18:30:19Z
---

## Finding

These are statements the current code contradicts. They are separate from the deliberate doc edits made on 2026-08-26, which this issue leaves alone.

**ADR 0001:5 — "Shadows have offset, blur, and color, not spread."** There is no colour parameter. `session.ts:27` types it `shadow: { offset: number; blur: number; opacity: number }`, and `session.ts:222` hardcodes black: `shadowCtx.shadowColor = \`rgba(0,0,0,${String(shadow.opacity)})\``. `setShadow(offset, blur, opacity)` takes no colour and the Inspector exposes exactly Offset / Blur / Opacity.
*Correction:* "offset, blur, and opacity over black — not spread, not an arbitrary colour."

**ADR 0001:5 — "Preview and Export share one Canvas 2D bitmap (`toBlob`)."** `renderComposition` (`session.ts:479-480`) creates a **new** canvas on every call; `render` and `exportPng` each call it independently. They share the draw path and produce identical pixels — the intent holds — but not one bitmap.
*Correction:* "Preview and Export run the same draw at the same 2x scale; `exportPng` re-runs it and calls `toBlob` on that canvas."

**README.md:9-10 — "Upload one or more screenshots" / "Place screenshots on backgrounds."** `session.ts:23` is `screenshot: Blob | null`. `placeScreenshot` takes a list only to skip undecodable sources and keeps the first good one. The roadmap agrees: multi-screenshot collage waits.
*Correction:* singular throughout.

**README.md:13 — "Export finished compositions as high-quality images."** `exportPng` writes `image/png` only (`session.ts:655`), and the glossary already defines Export as "The PNG file".
*Correction:* "Export the composition as a PNG."

**README.md:11-12 — two words the glossary bans.** "framing" is an _Avoid_ synonym under **Padding**; "treatments" is an _Avoid_ synonym under **Effect**. The real controls are Frame, Padding, and Effects.

**GLOSSARY "Catalog" — "the finite set of built-in solid and gradient Background values."** `catalog.ts:89-99` also exports `aspectPresets` — seven named Frame sizes, which are not Background values.
*Correction:* "built-in Background values and Aspect presets the Inspector can write."

**GLOSSARY "Aspect preset" — "A named Frame size the Inspector can write."** The file's own rule at line 3 says a definition says what the term IS, not what it does.

**README.md:27 — "ShadCN UI using the Base UI variant."** Covered by the shadcn/Base UI decision issue; correct it there or here, not twice.

## Acceptance

Each statement above either matches the code or is gone. The four checks pass.

## Decisions (settled 2026-08-26)

- **`README.md:27` stays as it is.** "ShadCN UI using the Base UI variant" was flagged as possibly stale; it is not. The shadcn adoption question was settled on 2026-08-26 as **yes, in full** (spec `u5l5hp`), so the line describes what is being built. `r169wm` re-checks it at the end of that spec. Do not touch it here.
- **The glossary Composition plural moved to `tl2tr4`.** The entry reads "the screenshots on it" while the code is `screenshot: Blob | null`. It sits with the other glossary work rather than being split across two issues.
- Every other correction listed above is unconditional. Apply the exact replacement text given for each.

## Also correct

- **`GLOSSARY.md` Catalog** and **Aspect preset** were hand-edited on 2026-08-26. Re-read both entries against the current file before editing — the quoted text above was captured before those edits and may already be partly fixed. Correct what is still wrong; do not revert a deliberate edit.

## Scope guard

This issue touches `README.md`, `docs/adr/0001-canvas-2d-draw-path.md`, and `docs/GLOSSARY.md` only. No code changes. If a correction seems to require a code change, the code is right and the doc is wrong — that is the premise of every item here.

## Order

Runs after `4cagyi`. Independent of the code queue.

## Notes

**agent** — 2026-08-26T18:30:19Z

Corrected the README to describe one Screenshot, use the glossary terms Frame, Padding, and Effects, and identify Export as PNG. Corrected ADR 0001 to state that Preview and Export re-run the same 2x draw and that shadows use offset, blur, and opacity over black. Updated Catalog to include built-in Background values and Aspect presets, and defined an Aspect preset as a named Frame size in the Catalog. Left the settled ShadCN line and Composition entry unchanged. All four checks pass.
