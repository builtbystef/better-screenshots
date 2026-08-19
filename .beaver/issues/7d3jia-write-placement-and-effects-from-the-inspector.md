---
id: 7d3jia
title: Write placement and Effects from the Inspector
state: done
assignee: agent
priority: high
depends_on:
    - 866rvo
parent: 3toux4
created: 2026-08-19T19:38:34Z
updated: 2026-08-19T20:30:32Z
---

## What to build

The Inspector writes placement and Effects with sliders and numbers. Position is X and Y. The knobs stay live on Empty. Border color is hex plus a native input, even at width 0.

## Acceptance criteria

- [ ] `parseInteger(" 80 ")` → `80`. `parseInteger("+80")` → `80`. `parseInteger("80px")` → `"refuse"`. `parseInteger("80.0")` → `"refuse"`. `parseInteger("80,5")` → `"refuse"`.
- [ ] `parseScale("1")` → `1`. `parseScale("1.255")` → `1.26`. `parseScale("0")` → `"refuse"`. `parseScale("1,25")` → `"refuse"`.
- [ ] `parseOpacityPercent("25")` → `25`. `parseOpacityPercent("101")` → `"refuse"`. `parseOpacityPercent("25.5")` → `"refuse"`.
- [ ] Number parse: trim whitespace; optional leading `+`; decimal point is `.` only. A `parseInteger` result `< 0` is refused for Padding, Offset, Blur, Width, and Radius. `parseScale` ≤ 0 is refused. `parseOpacityPercent` outside `0–100` is refused.
- [ ] One row per knob: label, slider, number. Slider writes every input. Number and hex commit on blur and Enter. Number may pass the slider except Opacity (the slider is the full `0–100`). When the stored value is outside the track, the thumb sits at the near end; the first move writes the thumb.
- [ ] No unit suffixes. No native spinners. No arrow-key nudge in fields.
- [ ] Padding: slider `0–400` step `1` + integer number. Default `120`.
- [ ] Scale: slider `0.25–2` step `0.05` + number. Display two decimals (`1.00`). Default `1`.
- [ ] Position: one row, label Position, integer fields X and Y. No sliders.
- [ ] Shadow: Offset `0–64` step `1`; Blur `0–80` step `1`; Opacity `0–100` step `1` (store `value / 100`). Defaults `16` / `32` / `25`.
- [ ] Border: Width `0–24` step `1`; Color always visible (hex + native, same commit and restore as Background), even at width `0`. Default width `0`, color `#FFFFFF`.
- [ ] Radius: slider `0–64` step `1` + integer number. Default `16`.

## Notes

**agent** — 2026-08-19T20:30:32Z

Inspector Placement and Effects now write the session. Knobs stay live on Empty. Preview re-renders on each write.

Seams (chrome.ts): parseInteger, parseScale, parseOpacityPercent. Worked examples from the spec are tests. Page is not a test seam.

Number parse: trim; optional leading +; '.' only. parseInteger refuses 80px, 80.0, 80,5. A result < 0 is refused for Padding, Offset, Blur, Width, and Radius. parseScale rounds to two decimals and refuses <= 0. parseOpacityPercent is a 0-100 integer.

UI: one row per knob (label, slider, number). Slider writes every input and clamps the thumb when the stored value is off-track. Number and hex commit on blur and Enter; invalid restores. Number may pass the slider except Opacity. No unit suffixes, no native spinners, no arrow-key nudge.

Placement: Padding 0-400 step 1 default 120; Scale 0.25-2 step 0.05 displayed to two decimals default 1; Position is X/Y integers, no sliders. Effects: Shadow Offset/Blur/Opacity (opacity stored /100) defaults 16/32/25; Border Width 0-24 and Color (hex + native, same commit/restore as Background) even at width 0; Radius 0-64 default 16.
