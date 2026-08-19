---
id: pfdjl3
title: Plan Better Screenshots — roadmap
state: in-progress
assignee: builtbystef
labels:
    - roadmap
created: 2026-08-18T22:57:21Z
updated: 2026-08-19T05:44:37Z
---

## Goal

A developer can open Better Screenshots in the browser, upload one or more Screenshots, place them on a Background, apply small treatments (position, scale, padding, shadow, border, rounded corners), and Export a polished image for a launch post or landing page — no backend, no account.

## Frontier

- Studio chrome: panels, drag and resize, empty state, first-run. Writes the session in `erb9py`. One Screenshot; there is no collage to select among. Export is refused when the Screenshot is absent (cx9cwz); the chrome for that waits. Effect knobs are settled (eivufq); slider chrome waits. Catalog picker and custom-solid control wait (dt8gtk settled the capabilities). Paste is a Screenshot source (qjw6h1); empty-state chrome for it waits.
- Extract the Canvas 2D draw into a `packages/*` package (waits; trigger is a second consumer — 0abxd5).
- Aspect-ratio and social-size presets (waits; not first ship — cx9cwz).
- Device frames and browser chrome (waits; not first ship).
- Crop, rotate, perspective (waits).
- Text, arrows, and other annotations (waits).
- Multi-screenshot layout / collage (waits; first ship is one Screenshot per Composition).
- Marketing page at betterscreenshots.co (waits; first ship is the Studio alone).
- Hosting and deploy of the SPA.
- Visual identity and theme, including the actual Catalog colors (dt8gtk: handful of each; default is one Catalog solid).
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
