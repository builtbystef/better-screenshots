---
id: 4iz55l
title: What Catalog colors and Studio theme ship?
state: done
assignee: agent
priority: medium
labels:
    - roadmap:pfdjl3
    - session:prototype
depends_on:
    - dt8gtk
parent: pfdjl3
created: 2026-08-19T09:18:01Z
updated: 2026-08-19T10:41:17Z
---

Prototype session. Shape: "what must this look like" — several very different variations the user can switch in the browser.

dt8gtk settled the capabilities: a handful of solids, a handful of gradients, custom `#RRGGBB` in, custom gradient out, default is one Catalog solid. Actual values wait here, with the chrome theme.

Settle with the user:

- The Catalog solids and gradients (under a dozen each), and which solid is the default.
- The Studio chrome theme: panels, type, light / dark / both.

Do not design wordmark, logo, or a marketing page. Do not design picker chrome or slider chrome.

Pointers: dt8gtk note; `docs/GLOSSARY.md` (Catalog, Background, Studio); `apps/web/src/styles.css`; `apps/web/components.json`.

## Notes

**agent** — 2026-08-19T10:41:17Z

# Question

What Catalog colors and Studio theme ship?

# Answer

System dual. Chrome is the existing base-nova / neutral tokens, light and dark. Catalog is that variant's eight solids and six gradients. Default solid is Zinc 200 `#E4E4E7`.

# Cut

**Chrome.** `apps/web/src/styles.css` tokens (`:root` and `.dark`). Panels, border, text, muted, radius from those tokens. Type is `system-ui`. Light and dark both ship. Not light-only, not dark-only, not a custom skin (pastel / paper / midnight / cinema are out).

**Catalog solids** (8), in order:

- Zinc 100 `#F4F4F5`
- Zinc 200 `#E4E4E7` — default
- Slate `#CBD5E1`
- Charcoal `#27272A`
- Black `#09090B`
- Sky `#BAE6FD`
- Teal `#99F6E4`
- Rose `#FECDD3`

**Catalog gradients** (6), in order:

- Zinc fade — 180° `#F4F4F5` → `#D4D4D8`
- Slate dusk — 160° `#CBD5E1` → `#64748B`
- Sky wash — 135° `#BAE6FD` → `#E0E7FF`
- Teal mist — 150° `#99F6E4` → `#BAE6FD`
- Night — 180° `#27272A` → `#09090B`
- Rose mist — 140° `#FECDD3` → `#E0E7FF`

**Default.** Zinc 200 `#E4E4E7`. Not a gradient. Not an unpublished hex.

# Reason

The user picked System dual from the five looks.

# Prototype

`prototype/catalog-theme` — `/prototype-catalog-theme`.

# Not this node

How light vs dark is chosen (OS, toggle, persist). Picker chrome. Slider chrome. Wordmark, logo, marketing page.
