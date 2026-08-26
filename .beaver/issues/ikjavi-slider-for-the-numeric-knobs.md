---
id: ikjavi
title: Slider for the numeric knobs
state: todo
priority: medium
labels:
    - maintenance
depends_on:
    - 4x0vj8
parent: u5l5hp
created: 2026-08-26T17:34:11Z
updated: 2026-08-26T17:40:35Z
---

`KnobRow` (`routes/index.tsx:1005`) hand-draws a track and a thumb: `clamp(value, min, max)` at `:1052` converts the stored value to a percentage and positions the thumb with inline styles. Padding, Scale, Shadow offset, Shadow blur, Shadow opacity, and Border width all render through it.

## Work

- Add the shadcn `Slider` and use it for the track. Keep the paired numeric `Input` from `4x0vj8` — the row is a slider plus a typed field, and the typed field is the one `useDraft` governs.
- The slider writes on change; the input commits on blur and Enter, exactly as `useDraft` defines. A slider drag must not fight the input draft: re-sync is already the hook's job.
- Delete the local `clamp` helper (`routes/index.tsx:761`) once the thumb math is gone. Note that this is the generic three-argument `clamp`, unrelated to `clampPosition`, which `jcden7` deleted.
- Opacity keeps its `0.25 <-> 25` percent round-trip: the slider works in percent, the session stores the fraction. That conversion lives in `parse.ts`, not in the row.

## Acceptance

- Every knob renders a shadcn `Slider`.
- The hand-rolled track, thumb, and the local `clamp` helper are gone.
- Dragging the slider and typing in the field produce the same stored value for the same target.
- All existing tests pass unchanged, including the opacity round-trip test.
- The four checks pass.
