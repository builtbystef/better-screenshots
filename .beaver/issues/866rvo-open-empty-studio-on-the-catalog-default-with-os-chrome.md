---
id: 866rvo
title: Open Empty Studio on the Catalog default with OS chrome
state: done
assignee: agent
priority: high
parent: 3toux4
created: 2026-08-19T19:38:30Z
updated: 2026-08-19T19:59:33Z
---

## What to build

A developer opens the Studio and sees Empty Preview on the Catalog default solid, with the Inspector present. Chrome follows the OS light or dark scheme. There is no header, no wordmark, and no loading surface. Refresh is a new session: the Composition is Empty again; uploaded Background images remain.

## Acceptance criteria

- [ ] Opening the Studio creates one in-memory session on the Catalog default solid Zinc 200 `#E4E4E7` and the existing uploaded-Background store. The Studio does not paint until that session exists. There is no loading surface.
- [ ] Tab title is `Better Screenshots`. No header. No wordmark.
- [ ] `schemeClass("dark")` is `"dark"`. `schemeClass("light")` is `null`. `schemeClass("no-preference")` is `null`.
- [ ] A blocking script in the document shell applies `schemeClass` to class `dark` on `html` before first paint. The same media query stays live for the sitting: an OS change mid-sitting flips chrome. Nothing is stored.
- [ ] No in-app scheme toggle. No System / light / dark third state. Catalog values, a custom hex, and Export do not follow chrome.
- [ ] The Studio fills the viewport. Preview column left, Inspector right at `20rem`. Page padding `1.5rem`, column gap `1.5rem`. Studio `min-width` is `48rem`; narrower may scroll sideways. No stacked phone layout.
- [ ] The session `render` canvas keeps its 3840×2160 bitmap and is CSS-sized to contain in the Preview column, 16:9, never cropped. Page `background` shows around it. 1px `border` on the bitmap. The Preview column is top-aligned.
- [ ] The Inspector is always visible, including on Empty. Always open. No folds. No reset. It uses `card` / `border` and scrolls on its own if later knobs overflow. Sections in order, headings only: Background, Placement, Effects. Heading Placement is chrome only.
- [ ] Chrome uses the existing light and dark tokens (`background`, `foreground`, `card`, `card-foreground`, `border`, `muted-foreground`, `primary`, `primary-foreground`, `ring`, `radius`). Type is `system-ui`. No new library.

## Notes

**agent** — 2026-08-19T19:59:33Z

Opened Empty Studio on Catalog default Zinc 200 #E4E4E7 via createSession + createIndexedDbStore. The page returns nothing until that session exists; no loading surface.

schemeClass is the chrome seam (chrome.ts). Worked examples: dark → "dark"; light and no-preference → null. A blocking inline script in the document shell applies it to class dark on html before first paint and listens for prefers-color-scheme changes. Nothing is stored. No toggle.

Layout: viewport-filling row, Preview left, Inspector 20rem right, 1.5rem padding and gap, min-width 48rem. session.render() canvas stays 3840×2160 and is CSS-contained 16:9 with a 1px border. Inspector is always open with headings only: Background, Placement, Effects.

Page is not a test seam. Tests cover schemeClass only.
