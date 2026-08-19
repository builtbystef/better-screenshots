---
id: odl00i
title: What place affordance and copy does the Empty Studio show?
state: done
assignee: agent
priority: high
labels:
    - roadmap:pfdjl3
    - session:grill
depends_on:
    - 1tsn6n
    - qjw6h1
parent: pfdjl3
created: 2026-08-19T09:28:57Z
updated: 2026-08-19T09:49:40Z
---

Grill session, limited to how the user starts or replaces a Screenshot — not Inspector Background or slider chrome.

1tsn6n settled one Empty Studio, Inspector present, Export disabled. qjw6h1 settled paste. Sources are picker, drop, and paste. There is no Clear.

Settle with the user:

- Empty Studio copy and the visible place affordance (drop target, picker control, paste hint).
- How occupied replace is offered (same drop/paste, and whether a picker control stays visible).
- What a refused place looks like (bad file, empty clipboard) — a signal, or silence.

Do not design the Inspector's Background or slider chrome. Do not write marketing copy.

Pointers: 1tsn6n note; qjw6h1 note; `erb9py`; `docs/GLOSSARY.md` (Empty Studio, Screenshot, Studio).

## Notes

**agent** — 2026-08-19T09:49:40Z

# Question

What place affordance and copy does the Empty Studio show?

# Answer

Overlay on the preview: Drop a screenshot / or paste (Ctrl/Cmd+V) / Choose a file. Occupied: overlay gone, Replace next to Export, drop and paste still replace. A refused place is one line, not silence.

# Cut

**Empty Studio.** Overlay centered on the preview. No scrim — the Catalog default solid stays visible. No dashed frame at rest.

- Headline: Drop a screenshot
- Hint: or paste (Ctrl/Cmd+V)
- Button: Choose a file
- Click the overlay or the empty preview opens the same one-file `image/*` picker as the button.

**Occupied.** Overlay is gone. Drop and paste still replace. Replace sits in the preview chrome next to Export — not on the Screenshot, not in the Inspector. Click on the Screenshot is drag (Position), not pick.

**Drop.** A file drop anywhere in the window places a Screenshot (and stops the browser from navigating). Preview shows a ring while a file is dragged over the window. The Inspector is not a drop target and does not take the file as a Background. Non-file drops are ignored. Copy does not change during the drag. Several files walk as the session already does (first decodable wins).

**Refuse.** One line on the preview (under the overlay when Empty; under the bitmap when occupied). Stays until the next place attempt.

- Picker, drop, undecodable, or 0×0 → That file isn't an image.
- Paste with no image → No image on the clipboard.
- Focused text field: text paste is not a place, no signal (qjw6h1).

# Reason

The sitting is two minutes and the preview is already the Composition. Copy on the bitmap, no scrim, keeps the Background in view so the Inspector still means something on Empty. A picker must stay after the first place or file-only users cannot replace; it cannot sit on the Screenshot because drag writes Position. Window-wide file drop is the same place as preview drop and stops a missed drop from navigating away. A refused place with no line looks like the file vanished — same reason 2lbxwq signaled quota.

# Not this node

Inspector Background or slider chrome. Theme (`4iz55l`). Export label and strip placement beyond Replace sits next to it. A paste button. Marketing copy.
