---
id: vfgwur
title: Does the first ship include undo?
state: done
assignee: agent
priority: medium
labels:
    - roadmap:pfdjl3
    - session:grill
depends_on:
    - bdkac8
parent: pfdjl3
created: 2026-08-19T00:44:15Z
updated: 2026-08-19T04:27:45Z
---

Grill session, one question: undo in or out of the first ship. The sitting (bdkac8) is tweak-then-Export on one Screenshot.

Settle with the user:

- In or out.
- If in: undo of placement and Effects only, or also replacing the Screenshot / Background.

Do not design the history model, keyboard map, or redo, unless "in" forces a one-line rule (e.g. a single revert-to-previous).

Pointers: bdkac8 note; `docs/GLOSSARY.md` (Composition, Effect).

## Notes

**agent** — 2026-08-19T04:27:45Z

# Question

Does the first ship include undo?

# Answer

No. Placement, Effects, Screenshot replace, and Background change are live. No history, no revert-to-previous, no redo.

# Cut

**Out.** First ship has no undo. Wrong slider: move it back. Wrong paste or Background: pick or paste again. Refresh still wipes the Composition.

**Not in.** A history stack. A single revert-to-previous. Redo. Undo of placement, Effects, Screenshot replace, or Background.

# Reason

The sitting is two minutes. Placement and Effects are numbers you can move back. Refresh is already a coarse start-over. Accidental paste-replace takes an explicit `Ctrl`/`Cmd`+`V`. A history model is a second editor surface next to drafts, which the first ship already refused.

# Not this node

Studio chrome. The rest of the keyboard map. A reset-to-defaults control (not undo).
