---
id: 1tsn6n
title: What belongs on the first-ship Studio surface?
state: done
assignee: agent
priority: high
labels:
    - roadmap:pfdjl3
    - session:grill
depends_on:
    - bdkac8
parent: pfdjl3
created: 2026-08-19T09:17:55Z
updated: 2026-08-19T09:28:42Z
---

Grill session, limited to the first-ship chrome cut — not picker chrome, slider chrome, or empty-state copy.

The session seam is built (`erb9py`). This node settles what the first-ship surface includes.

Settle with the user:

- Drag-to-reposition the Screenshot: in or out.
- Scale handles on the Screenshot: in or out.
- A distinct first-run from empty-occupied (Screenshot absent after a sitting vs first open), or one empty state.
- One inspector vs several panels.
- Export control when the Screenshot is absent: disabled, hidden, or something else.

Do not design the Catalog picker, the custom-solid control, the upload/remove chrome, the slider chrome, or the empty-state copy. Those wait.

Pointers: bdkac8 note; `erb9py`; eivufq (Effect knobs); dt8gtk (Catalog capabilities); qjw6h1 (paste); cx9cwz (Export refused when Screenshot absent); `docs/GLOSSARY.md` (Studio, Screenshot, Background, Catalog, Composition, Effect, Export).

## Notes

**agent** — 2026-08-19T09:28:42Z

# Question

What belongs on the first-ship Studio surface?

# Answer

Preview plus one Inspector. Drag the Screenshot to write Position. No scale handles. One Empty Studio. Export is visible and disabled when the Screenshot is absent. The Inspector and its placement and Effect controls stay live on Empty. After Export they stay occupied.

# Cut

**Surface.** Preview (the `render` bitmap) and one Inspector. The Inspector holds Background, placement (Padding, Scale, Position), and Effects.

**Drag.** In. Pointer-drag on the Screenshot writes Position. Position stays unbounded; the frame clips (y7ac9r). Scale handles are out. Scale is Inspector-only.

**Empty Studio.** One state. First open and post-refresh are the same chrome. There is no distinct first-run. After Export the Screenshot stays; they replace to sit again. No Clear (already out — dhjf03).

**Inspector on Empty.** Present. Placement and Effect controls are live. Values are already stored while the Screenshot is absent (y7ac9r). Export is the one disabled control.

**Export.** Visible. Disabled when the Screenshot is absent. Session still refuses the file (cx9cwz). Hidden is out.

# Reason

The sitting is two minutes. Drag is the natural writer for Position. Scale handles are selection-box chrome. One Empty Studio and one Inspector keep a single surface; a first-run splash or several panels are a second editor. Disabled Export keeps the sitting's end in view. Live knobs avoid a second enabled/disabled matrix; the empty preview only shows Background, which is already the paint rule.

# Glossary

Added **Empty Studio** and **Inspector**.

# Not this node

Catalog picker. Custom-solid control. Upload/remove chrome. Slider chrome. Empty-state copy.
