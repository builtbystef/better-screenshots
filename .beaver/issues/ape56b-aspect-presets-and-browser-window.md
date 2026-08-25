---
id: ape56b
title: Aspect presets and Browser window
state: done
assignee: agent
priority: high
labels:
    - session:task
created: 2026-08-25T13:12:40Z
updated: 2026-08-25T13:18:03Z
---

## What to build

Aspect presets write the Frame. A Browser window (None / Light / Dark plus a URL) is painted around the Screenshot into the same Preview/Export bitmap.

## Cut

- Aspect presets: 16:9 1920×1080 (default), 1:1 1080×1080, 4:5 1080×1350, 9:16 1080×1920, 4:3 1440×1080, 3:2 1620×1080, 1.91:1 1200×630.
- Inspector: Frame first (chips), Window after Placement (None / Light / Dark, default None, URL field writes each keystroke).
- Browser window sits above the Screenshot as one placed object. Turning it on shrinks the Screenshot so the window still fits in the Padding. Chrome height is 5.5% of Screenshot width. Shadow, border, and Radius wrap the outer window. Drag hits the whole window. Empty Studio paints none. Replace keeps the window. The Screenshot blob is unchanged.
- Compact Chrome homage: traffic lights, address pill, URL in system-ui. Light #F1F3F4 / #FFFFFF / #202124. Dark #202124 / #303134 / #E8EAED.

## Testing Decisions

Seams: `createSession` for `setSize`, `setBrowserWindow`, `setUrl`, placement with a Browser window, and render canvas size / a chrome-bar pixel. Chrome rules: `matchingAspectPreset`. Catalog: the Aspect preset list. Do not mount the page. Do not snapshot full bitmaps.

## Notes

**agent** — 2026-08-25T13:18:03Z

Session gained setSize, setBrowserWindow, and setUrl. Aspect presets live in the Catalog. matchingAspectPreset is the Frame chrome rule. Preview follows the Frame. Browser window is painted into the same bitmap; Empty paints none. Checks: vp fmt --check, vp lint, vp check --no-fmt --no-lint, vp test (101).
