---
id: su06zm
title: What is the preview chrome for Export?
state: done
assignee: agent
priority: medium
labels:
    - roadmap:pfdjl3
    - session:grill
depends_on:
    - 1tsn6n
    - odl00i
parent: pfdjl3
created: 2026-08-19T09:49:54Z
updated: 2026-08-19T11:12:54Z
---

Grill session, limited to the Export control and the preview strip it shares with Replace — not Empty overlay copy, not Inspector chrome, not theme.

1tsn6n settled Export visible and disabled when the Screenshot is absent. odl00i settled Replace next to Export in the preview chrome.

Settle with the user:

- Where the strip sits (above the preview, below it, or over an edge).
- Export label, and what disabled looks like (still readable vs dim-only).
- Click: download the session PNG; what a refused Export looks like if they somehow click while disabled (should not happen).

Do not redesign the Empty overlay or Replace (odl00i). Do not design Inspector sliders (`96wun6`) or the theme (`4iz55l`).

Pointers: 1tsn6n note; odl00i note; cx9cwz note; `erb9py`; `docs/GLOSSARY.md` (Export, Empty Studio).

## Notes

**agent** — 2026-08-19T11:12:54Z

# Question

What is the preview chrome for Export?

# Answer

Buttons in the gap above the preview, right-aligned. Replace then Export. Label `Export`, filled. Disabled is readable, not dim-only. Click downloads the session PNG. Disabled click is silence. Encode refuse is one line.

# Cut

**Strip.** Above the preview, outside the bitmap. No bar. The two buttons sit in that gap, right-aligned, as wide as the preview column — not over the Inspector. Order: Replace, then Export. On Empty, Replace is gone; the disabled Export stays in that trailing slot.

**Export.** Label `Export`. Filled / primary. Replace stays ghost / secondary; its label and behavior stay odl00i.

**Disabled.** Empty, or `exportPng` in flight. Still readable (`muted-foreground`), default cursor, not a pointer, not opacity-only. Label stays `Export`. No `Exporting…`. No spinner. A click is a no-op and writes no line.

**Enabled click.** Browser download of the session PNG (cx9cwz). No toast.

**Occupied encode refuse.** `exportPng` returned `"refuse"` (`toBlob` failed). One line on the preview, same slot as a refused place: `Couldn't export that image.` Last event wins. A successful place, a successful Export, or the next attempt of either clears or replaces it. Empty never shows this line — Export is disabled there.

# Reason

The sitting is two minutes and the preview is already the Composition. A strip on the bitmap covers the Background (odl00i refused a scrim for that). Below the 16:9 preview puts the sitting's end past a scroll. No bar keeps one surface. Export last at the trailing edge is the last step; Replace is the occupied sibling. `Export` is the glossary term; `Download` is an Avoid. Disabled must stay readable because on Empty it is the only control in the strip. The disabled control is the teaching — a line for a click that should not happen is noise (same as the disabled remove-X). An encode fail with no line looks like the file vanished, same reason a refused place is a line. Last-event-wins stops a stale export error from accusing a new Screenshot. A label flash or spinner for a sub-second encode is noisier than a brief dead button.

# Not this node

Empty overlay copy (odl00i). Replace beyond sitting next to Export (odl00i). Inspector (2lbxwq, 96wun6). Theme and light/dark (4iz55l, adfte6). Keyboard shortcut (Frontier).
