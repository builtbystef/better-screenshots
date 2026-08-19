---
id: qjw6h1
title: Does the first ship accept a Screenshot from the clipboard?
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
updated: 2026-08-19T04:20:32Z
---

Grill session, one question: file picker / drop only, or also paste from the clipboard. The sitting (bdkac8) is "place one Screenshot"; paste is the natural sibling of drop for a developer.

Settle with the user:

- In or out for the first ship.
- If in: paste replaces the current Screenshot (there is only one).

Do not design the empty-state chrome or the keyboard map beyond paste.

Pointers: bdkac8 note; `docs/GLOSSARY.md` (Screenshot, Studio).

## Notes

**agent** — 2026-08-19T04:20:32Z

# Question

Does the first ship accept a Screenshot from the clipboard?

# Answer

Yes. `Ctrl`/`Cmd`+`V` places a Screenshot. A paste with one already present replaces it. Only a decodable image counts.

# Cut

**In.** Paste is a third way to place a Screenshot, next to file picker and drop. `Ctrl`/`Cmd`+`V`.

**Replace.** A successful paste swaps the Screenshot handle and keeps Padding, Scale, Position, and Effects. Same as a file replace (y7ac9r). There is still only one Screenshot.

**What counts.** A decodable image. First image if the clipboard has several. Empty clipboard, text, or undecodable bytes: Composition unchanged — same refuse as a bad file. Text paste is never a Screenshot.

# Reason

A developer's Screenshot is often already on the clipboard from the OS. Saving it to a file just to drop it is a detour the two-minute sitting does not need. Replace-keeps-numbers is already the Composition rule. Text paste stays text so a focused hex field still works.

# Not this node

Empty-state chrome. A paste button. The rest of the keyboard map.
