---
id: aitiuw
title: Write the first-ship spec for Studio chrome?
state: done
assignee: agent
priority: high
labels:
    - roadmap:pfdjl3
    - session:spec
depends_on:
    - 1tsn6n
    - 2lbxwq
    - odl00i
    - 96wun6
    - su06zm
    - 4iz55l
    - adfte6
parent: pfdjl3
created: 2026-08-19T11:59:54Z
updated: 2026-08-19T12:35:12Z
---

Spec session for the settled first-ship Studio chrome area. An implementer of the preview, Inspector, Empty Studio, Export strip, Catalog chips, and light/dark needs these answers together. Composition, draw, Export, and persistence stay in `erb9py` — not this spec. Hosting, deploy, and marketing stay on the Frontier.

Read the notes (and the prototype) of only this area, interview to close remaining gaps inside it, confirm with the user, then invoke `create-specification`. Publish the spec issue with a blocking edge back to each node it covers.

Area nodes:

- 1tsn6n — surface cut (preview + one Inspector, drag, one Empty Studio, disabled Export)
- 2lbxwq — Inspector Background section
- odl00i — Empty Studio overlay, Replace, refuse line
- 96wun6 — Placement and Effect knobs
- su06zm — Export strip
- 4iz55l — Catalog values and chrome tokens (`prototype/catalog-theme`)
- adfte6 — light vs dark follows `prefers-color-scheme`

Do not reopen Composition, draw, or Export (`erb9py`). Do not design hosting or marketing.

## Notes

**agent** — 2026-08-19T12:35:12Z

# Question

Write the first-ship spec for Studio chrome?

# Answer

Yes. Spec issue `3toux4`. Preview plus one Inspector, Catalog chips, Export strip, Empty overlay, drag, and OS light/dark. Composition, draw, and Export stay `erb9py` except a narrow `uploadBackground` / `storage` change. Hosting and marketing stay out.

# Reason

The area's nodes were closed. Remaining gaps (layout, drag hit, chip labels, min-width, first-paint scheme, upload refuse reasons) were settled with the user. The draft was approved and published with blocking edges back to the area nodes.
