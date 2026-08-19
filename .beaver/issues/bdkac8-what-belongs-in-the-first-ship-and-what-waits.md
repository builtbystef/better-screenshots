---
id: bdkac8
title: What belongs in the first ship, and what waits?
state: done
assignee: agent
priority: high
labels:
    - roadmap:pfdjl3
    - session:grill
parent: pfdjl3
created: 2026-08-18T22:57:36Z
updated: 2026-08-19T00:43:47Z
---

The scoping decision everything else hangs on. One grill session, limited to the first-ship cut — not the detailed design of each feature.

Settle with the user:

- The two-sentence first-ship promise (what a developer can finish in one sitting).
- One screenshot on a background, or several in one composition.
- Which backgrounds and which effects ship; which wait. The README already names shadow, border, rounded corners, position, scale, padding, and framing — confirm that list as the floor, then decide what else is in.
- Device frames / browser chrome: in or out.
- Crop, rotate, perspective: in or out.
- Text, arrows, annotations: in or out.
- A marketing page at betterscreenshots.co, or the studio alone.
- Whether a composition must survive a refresh in the first ship.

Do not design the data model, the studio chrome, or the export file contract. Those wait until this cut exists.

Pointers: `README.md`, `docs/GLOSSARY.md` (Screenshot, Background, Composition, Effect, Export). The stack and the "no backend" rule are already decided.

## Notes

**agent** — 2026-08-19T00:43:47Z

# Question

What belongs in the first ship, and what waits?

# Answer

A developer opens the Studio, places one Screenshot on a solid, a gradient, or a Background image they uploaded, adjusts position, scale, padding, shadow, border, and rounded corners, and Exports. They can repeat that sitting in the same visit; uploaded Background images survive a refresh, the Composition does not.

# Cut

**One Screenshot per Composition.** The README's "one or more" means several Exports in one visit, each from its own one-Screenshot Composition — not a collage.

**Placement and Effects.** Position, scale, and padding. Effects are shadow, border, and rounded corners. Nothing else. **Padding** is the inset of the Screenshot on the Background. **Framing** is retired (glossary).

**Backgrounds.** Solid, gradient, and user-uploaded images. Patterns wait.

**Site.** The Studio alone, at `/`. No marketing page.

**Persistence.** Uploaded Background images survive a refresh. The in-progress Composition does not (no draft restore, no named-draft list). Pixels do not go in `localStorage` (~5 MB string quota per origin; a Screenshot plus a Background as data URLs will throw). IndexedDB or OPFS holds the `Blob`s — which of those is a later node.

**Waits (still in scope for a later ship).** Collage / multi-Screenshot layout. Device frames and browser chrome. Crop, rotate, perspective. Text, arrows, and other annotations. Background patterns. A marketing page. Restoring an in-progress Composition.

# Reason

The sitting is a two-minute utility, not a graphics editor and not a landing-page collage. Device frames are a catalog and they change the draw path. Crop, rotate, perspective, and annotations edit or write on the Screenshot; a general graphics editor is already out of scope. A marketing page is a second route and a visual-identity project. Draft persistence means storing the Screenshot too — a second feature. Uploaded Backgrounds persist so a custom backdrop is not re-uploaded every visit.

# Glossary

Added **Studio** and **Padding**. Retired **framing**. **Composition** now names padding, not framing.
