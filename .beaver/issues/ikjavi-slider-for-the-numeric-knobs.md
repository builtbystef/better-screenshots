---
id: ikjavi
title: Slider for the numeric knobs
state: done
assignee: claude
priority: medium
labels:
    - maintenance
depends_on:
    - 4x0vj8
parent: u5l5hp
created: 2026-08-26T17:34:11Z
updated: 2026-08-27T04:15:14Z
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

## Notes

**claude** — 2026-08-27T04:13:56Z

Landed. `shadcn add slider` vendored the base-nova Slider into `apps/web/src/components/ui/slider.tsx`, and `KnobRow` now renders it in place of the native range input. All seven knobs — Padding, Scale, Shadow offset, Shadow blur, Shadow opacity, Border width and Radius — go through that one row, so one edit covers every knob.

The local three-argument `clamp` is gone with the thumb math, and so are the four `.studio-slider` rules in `styles.css`, which had no other consumer. Base UI clamps the value against `min`/`max` itself, so the row no longer needs to.

Opacity is untouched: `EffectsInspector` still passes the stored fraction up as a percent and still divides by 100 on the way back, and `parseOpacityPercent` still owns the syntax. The percent round-trip test passes unchanged.

**claude** — 2026-08-27T04:14:09Z

**Two edits to the vendored file, both forced by a single-thumb slider.** As the registry ships it, `Slider` derives its thumb count from `Array.isArray(value)`, and falls back to `[min, max]` — two thumbs — for anything else. A scalar `value` is "anything else", so the knob would have rendered a range slider. The file now counts thumbs from the value it is given (one for a number, `length` for an array, two when neither `value` nor `defaultValue` is set, as before), and is generic over `Value`. The generic is what makes `onValueChange` hand `KnobRow` a `number` instead of `number | readonly number[]`; `SliderPrimitive.Root` was already generic, the wrapper simply was not passing it through. Everything else in the file is untouched, including the class strings. A future `shadcn add slider` overwrites both edits.

**claude** — 2026-08-27T04:14:30Z

**A dependency was added: `shadcn`, in devDependencies, for its stylesheet.** The note on `4x0vj8` said to add `@import "shadcn/tailwind.css"` only when a bare `data-*` variant actually appears in a vendored class string. It appears here. `Slider` carries `data-horizontal:w-full`, `data-horizontal:h-1`, `data-vertical:*` and `data-disabled:opacity-50`, and this Base UI version emits `data-orientation="horizontal"` — `SliderRootDataAttributes` has no `data-horizontal` member at all. Tailwind 4 compiles a bare `data-x` variant as `[data-x]`, so before the import those classes compiled into selectors that match nothing: the root had no width and the track no height, i.e. an invisible slider. `shadcn/tailwind.css` defines `@custom-variant data-horizontal { &:where([data-orientation="horizontal"]) }` and the same for `data-vertical`, which is exactly the mapping the components assume. Verified in the built CSS, where `.data-horizontal\:w-full` now carries `:where([data-orientation=horizontal])`.

Weighed against writing the two `@custom-variant` rules into `styles.css` by hand, which needs no dependency: the import was chosen because `ywo131` (ToggleGroup) and `r169wm` (Card) will need `data-selected`, `data-checked`, `data-open` and `data-active` on the same terms, and a hand-copied list would drift from the registry the components are vendored from. `shadcn` is a devDependency, not a dependency — nothing imports it at runtime, only `styles.css` at build time — but it does add 258 packages to the lockfile. The reason is recorded in `apps/web/package.json` under `// shadcn/tailwind.css`, next to the existing `// shadcn` note. `pnpm add` also placed `shadcn: ^4.19.0` in the workspace catalog, which `catalogMode: prefer` does for every new dependency.

**claude** — 2026-08-27T04:14:48Z

**Seam selection: no new test, same reasoning as `4x0vj8`.** The suite still has no way to render React, and building one is `q53d20`. A test written here could only mount a hand-copied replica of `KnobRow`, since the row is not exported and exporting it for a test is a module-boundary change `q53d20` owns. So the criteria were verified with a throwaway jsdom probe (`react-dom/client` plus `act`, no new dependency), which was run and then deleted:

- A scalar `value` renders exactly one thumb — the regression the vendored-file edit prevents.
- The slider's own change path writes the stored value: an ArrowRight on the thumb's hidden range input took the stored opacity from 0.25 to 0.26.
- The typed field re-synced to "26" on that write, so a slider change does not fight the draft. `useDraft`'s effect already covers this; it is now observed, not assumed.
- Typing "40" and blurring wrote 0.4 and moved the slider to 40. Both paths reach the same stored value for the same target.

Pointer drag itself was not exercised: jsdom has no pointer capture. Drag, track-press and keyboard all deliver through the one `onValueChange` callback that the probe drove, so the writing path is the same in each case; the part not covered is Base UI's pointer-to-value arithmetic, which is the library's own.

All 100 existing tests pass unchanged. Format, lint, typecheck, test, and the workspace build all pass.

**claude** — 2026-08-27T04:15:04Z

**Two visible consequences of taking the vendored styling as-is.** The thumb is `bg-white` with a `border-ring` in both schemes, where the hand-rolled one was `var(--foreground)` — black in light, white in dark. The filled part of the track is `bg-primary` rather than `var(--foreground)`; those two tokens differ only slightly at either scheme. Both are the base-nova defaults and were kept, since the spec calls this a markup and styling migration.

`aria-label` now lands on the slider's `role="group"` root, which is where `SliderPrimitive.Root` puts it, not on the range input inside the thumb. The input is the focusable control and now has no name of its own; a reader announces it inside the named group. Base UI's route to naming the input is `getAriaLabel` on `Slider.Thumb`, which the vendored wrapper does not forward. Left alone deliberately: forwarding it is a third edit to a vendored file, and `q53d20`'s harness is the place where an a11y assertion of this kind can be written down and kept.
