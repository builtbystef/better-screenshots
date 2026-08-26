---
id: pfdjl3
title: Plan Better Screenshots — roadmap
state: in-progress
assignee: builtbystef
labels:
    - roadmap
created: 2026-08-18T22:57:21Z
updated: 2026-08-26T16:00:49Z
---

## Goal

A developer can open Better Screenshots in the browser, upload one or more Screenshots, place them on a Background, apply small treatments (position, scale, padding, shadow, border, rounded corners), and Export a polished image for a launch post or landing page — no backend, no account.

## Frontier

- Extract the Canvas 2D draw into a `packages/*` package (waits; trigger is a second consumer — 0abxd5).
- Device frames (waits). Aspect presets and the Browser window shipped in ape56b.
- Crop, rotate, perspective (waits).
- Text, arrows, and other annotations (waits).
- Multi-screenshot layout / collage (waits; first ship is one Screenshot per Composition).
- Marketing page (waits; first ship is the Studio alone). The apex is the Studio (38ykmy); marketing does not keep `betterscreenshots.co` unless the Studio moves.
- Deploy the SPA to Pages project `better-screenshots` at `betterscreenshots.co` (38ykmy). Waits on a Studio worth publishing, and on the domain (NXDOMAIN today; registration is its own node).
- Keyboard map (paste settled — qjw6h1; undo/redo out of first ship — vfgwur; the rest waits).
- Failure modes: huge uploads, memory. Preview-versus-Export match is settled (same bitmap, dm1i0g). Export bitmap is frame × 2 (cx9cwz).
- Restoring an in-progress Composition / named drafts (waits).
- Background patterns (waits).
- User-authored gradients (waits; not first ship — dt8gtk).
- Persisted custom colors / "my colors" (waits; not first ship — dt8gtk).
- Undo / history (waits; not first ship — vfgwur).

## Out of scope

- A backend, accounts, authentication, or billing.
- Server-side Export.
- Collaboration or multiplayer.
- Bulk generation from templates, design documents, or a render worker (that is Media Canvas).
- Native mobile apps.
- A general graphics editor.
- DOM + a snapshot library as the Composition draw / Export path (dm1i0g).
- SVG as the Composition draw / Export path (dm1i0g).
- A split path: preview in one technology, Export in another (dm1i0g).
- Composition size derived from the Screenshot or from the Background image (y7ac9r).
- A catalog id as the Composition's Background reference (y7ac9r).
- A large first-ship Background Catalog (dt8gtk).
- Clear Screenshot (return to empty) in the first ship (dhjf03).
- Scale handles on the Screenshot in the first ship (1tsn6n).
- A distinct first-run surface (1tsn6n).
- Several Inspector panels in the first ship (1tsn6n).
- Tabs or a popover as the Background picker (2lbxwq).
- A hero swatch for the current Background (2lbxwq).
- Drop-on-the-Inspector as a Background upload target (2lbxwq).
- A confirm step before remove of an uploaded Background (2lbxwq).
- A paste button as the place affordance (odl00i).
- Click on the Screenshot opens the picker (odl00i).
- A dimming scrim on the Empty Studio preview (odl00i).
- A toast for a refused place (odl00i).
- Workers or Workers static assets as the first-ship host (38ykmy).
- A Worker script to serve `_shell.html` without copying to `index.html` (38ykmy).
- A marketing page at the apex while the Studio is bound there (38ykmy).
- Redirect `better-screenshots.pages.dev` to the apex (38ykmy).
- `www` as a second Studio URL (38ykmy).
- Pastel stage Catalog and chrome (4iz55l).
- Ink & paper Catalog and chrome (4iz55l).
- Midnight tool Catalog and chrome (4iz55l).
- Cinema warm Catalog and chrome (4iz55l).
- Light-only first-ship Studio chrome (4iz55l).
- Dark-only first-ship Studio chrome (4iz55l).
- A custom first-ship typeface (4iz55l).
- Native number spinners on Inspector knobs (96wun6).
- Arrow-key nudge in Inspector number fields (96wun6).
- Reset-to-default on a placement or Effect knob (96wun6).
- A center control for Position (96wun6).
- Unit suffixes on Inspector knobs (96wun6).
- Collapsible Inspector sections (96wun6).
- Position sliders (96wun6).
- Slider as a hard max for open-ended knobs (96wun6).
- Catalog chips for border color (96wun6).
- The Export strip below the preview (su06zm).
- The Export strip over an edge of the bitmap (su06zm).
- A bar as the preview Export strip (su06zm).
- Opacity-only disabled Export (su06zm).
- `Exporting…` or a spinner while Export is in flight (su06zm).
- A toast for a successful Export (su06zm).
- A line for a disabled Export click (su06zm).
- An in-app light/dark toggle (adfte6).
- A System / light / dark third state (adfte6).
- Persisted chrome scheme (adfte6).
- Snapshot-at-load chrome that ignores an OS change (adfte6).
- A stacked phone layout (aitiuw).

## Notes

**agent** — 2026-08-25T13:18:03Z

Aspect presets and Browser window shipped in ape56b.
