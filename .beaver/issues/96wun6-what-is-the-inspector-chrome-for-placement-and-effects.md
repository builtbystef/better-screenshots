---
id: 96wun6
title: What is the Inspector chrome for placement and Effects?
state: done
assignee: agent
priority: medium
labels:
    - roadmap:pfdjl3
    - session:grill
depends_on:
    - 1tsn6n
    - eivufq
    - y7ac9r
parent: pfdjl3
created: 2026-08-19T09:28:57Z
updated: 2026-08-19T11:00:49Z
---

Grill session, limited to the Inspector controls for Padding, Scale, Position, shadow, border, and radius — not Background chrome, not visual theme.

1tsn6n settled one Inspector, live on Empty, drag writes Position, no scale handles. eivufq and y7ac9r settled the fields and legal ranges. This node settles the chrome that writes them.

Settle with the user:

- Control type for each knob (slider, number field, both).
- Practical slider bounds and steps where the stored range is open-ended (Padding, Scale, Position, shadow offset/blur, border width, radius).
- How border color is chosen (reuse the custom-solid pattern, or something else).
- Whether Position numbers sit next to drag or drag is enough and the numbers are secondary.

Do not design Catalog picker, upload/remove, empty-state copy, or the theme (`4iz55l`).

Pointers: 1tsn6n note; eivufq note; y7ac9r note; `erb9py`; `docs/GLOSSARY.md` (Inspector, Padding, Scale, Position, Effect).

## Notes

**agent** — 2026-08-19T11:00:49Z

# Question

What is the Inspector chrome for placement and Effects?

# Answer

Slider + number for each numeric knob. Position is X/Y numbers only; drag writes and snaps to CSS pixels. Border color reuses hex + native. Placement then Effects, always open.

# Cut

**Sections.** After Background: Placement, then Effects. Always open. No folds. No reset. No unit suffixes. No native spinners. No arrow-key nudge in fields.

**Placement.**

- **Padding:** slider `0–400` step `1` + integer number. Default `120`.
- **Scale:** slider `0.25–2` step `0.05` + number. Chrome hundredths: display `1.00`, commit rounds to two decimals. Default `1`.
- **Position:** one row, label Position, integer fields X and Y. No sliders. Drag writes, snaps to the nearest CSS pixel; the fields follow live.

**Effects.**

- **Shadow:** Offset `0–64` step `1`; Blur `0–80` step `1`; Opacity `0–100` step `1` (stored `value / 100`). Defaults `16` / `32` / `25`.
- **Border:** Width `0–24` step `1`; Color always visible (hex + native, 2lbxwq commit/restore), even at width `0`. Default width `0`, color `#FFFFFF`.
- **Radius:** slider `0–64` step `1` + integer number. Default `16`.

**Write.** One row per knob: label, slider, number. Slider writes every input. Number and hex commit on blur and Enter. Invalid, empty, `12px`, comma decimals, and non-integers on a px knob: refuse, restore. Trim whitespace; optional leading `+`; decimal point is `.` only. Number may pass the slider (except Opacity, which is the full range). Thumb pins at the near end; first move writes the thumb. Session-illegal typed values restore (`Scale ≤ 0`, Padding `< 0`, Opacity outside `0–100`, …). Heading **Placement** is chrome only. Session `Placement` stays the derived rects. No glossary term.

# Reason

The sitting is two minutes. Slider is the feel; the number is a known value (Scale `1.25`, Padding `80`). Drag is already the Position writer (1tsn6n); hiding the numbers makes “40px right of center” a blind drag. Stored ranges stay open (y7ac9r, eivufq); the slider is only the sitting range so the track is not 10 000 px of Padding. Integer CSS-pixel chrome and a snapped drag keep fields from showing `40.382`. Opacity as percent is how a developer reads `25`. Border color is a solid, not a Catalog pick — chips would pretend the Catalog is a border set (2lbxwq). Always-open sections and no per-knob reset keep one surface; a fold or a reset is a second editor (vfgwur already refused history).

# Not this node

Catalog picker, upload/remove (2lbxwq). Empty overlay and Export strip (odl00i, su06zm). Theme and light/dark (4iz55l, adfte6).
