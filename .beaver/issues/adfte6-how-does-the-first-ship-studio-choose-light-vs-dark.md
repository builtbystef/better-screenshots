---
id: adfte6
title: How does the first-ship Studio choose light vs dark?
state: done
assignee: agent
labels:
    - roadmap:pfdjl3
    - session:grill
depends_on:
    - 4iz55l
parent: pfdjl3
created: 2026-08-19T10:41:26Z
updated: 2026-08-19T11:59:27Z
---

Grill session, limited to how the Studio picks light vs dark.

4iz55l settled both schemes, using the existing base-nova / neutral tokens. Switching was a prototype control, not a product decision.

Settle with the user:

- Follow `prefers-color-scheme`, an in-app toggle, or both.
- If a toggle: whether the choice persists across refresh.

Do not redesign Catalog colors, panels, or type. Do not design marketing.

Pointers: 4iz55l note; `apps/web/src/styles.css`; `docs/GLOSSARY.md` (Studio).

## Notes

**agent** — 2026-08-19T11:59:27Z

# Question

How does the first-ship Studio choose light vs dark?

# Answer

Follow `prefers-color-scheme`. No in-app toggle. Live. Nothing stored.

# Cut

**Source.** `prefers-color-scheme` only. `dark` → `.dark` on `<html>`. `light` or `no-preference` → no class (`:root`).

**Live.** An OS change mid-sitting flips chrome. Not a snapshot at first paint.

**Persist.** Out. No `localStorage`. Refresh still wipes the Composition; chrome is not a second store.

**Not in.** A toggle. A System / light / dark third state. A control in the Inspector or the preview strip.

**Unchanged.** Catalog, custom hex, and Export do not follow chrome (4iz55l). Tokens stay `:root` / `.dark` in `apps/web/src/styles.css`.

# Reason

The sitting is two minutes. The developer already chose a scheme at the OS. A toggle is another control next to Inspector and Export. A persisted override would remember chrome while forgetting the Composition — the split the first ship refused for drafts and undo. Live follow is what "follow the OS" means; a snapshot would be a hidden choice.

# Not this node

Catalog colors and panel tokens (4iz55l). Wordmark, logo, marketing.
