---
id: r169wm
title: Card and Separator for the Inspector sections, and delete the class helpers
state: done
assignee: claude
priority: low
labels:
    - maintenance
depends_on:
    - ywo131
    - ikjavi
    - 11cr8l
parent: u5l5hp
created: 2026-08-26T17:34:11Z
updated: 2026-08-27T04:38:09Z
---

The last slice. The Inspector renders six `<section>` elements separated by `border-t` divider divs, with heading markup repeated in each.

## Work

- Wrap each Inspector section in `Card` / `CardHeader` / `CardTitle` / `CardContent`, or in whatever the landed shadcn set calls the equivalent. Keep the section order and the headings.
- Replace the `border-t` divider divs with `Separator`.
- Sweep `routes/index.tsx` for any remaining ad-hoc conditional class string and route it through `cn`.
- Correct `README.md:27` if the stack line no longer describes what shipped. It reads "ShadCN UI using the Base UI variant"; after this spec that is true, so most likely it stays. `11cr8l` deliberately left this one line to this spec so it is not corrected twice.
- Update `docs/ARCHITECTURE.md`: `src/components/ui/` and `src/hooks/` are now real modules with a stated dependency direction, and the page's interface is the components it composes.

## Acceptance

- No hand-rolled class helper remains in `routes/index.tsx`.
- Every conditional class string goes through `cn`.
- `README.md:27` matches what shipped.
- `docs/ARCHITECTURE.md` records `components/ui` and `hooks`.
- All existing tests pass unchanged.
- The four checks pass.

## Notes

**claude** — 2026-08-27T04:38:09Z

Vendored Card and Separator with `pnpm exec shadcn add card separator` (base-nova registry, formatter-only edits, as with the earlier slices). The five `<section>` elements in the Inspector became one local `InspectorSection` that composes Card / CardHeader / CardTitle / CardContent, so the repeated heading markup now lives in one place; order and headings are unchanged.

Facts a reviewer needs:

- The dividers were `border-b border-border` on the sections themselves, not the `border-t` divider divs the body describes. They are now `<Separator />` elements between the Cards.
- The Card is styled flat (`rounded-none bg-transparent ring-0 py-5`) so the Inspector keeps its flat, divider-separated look inside the `bg-card` aside. This is a markup migration; making the sections look like floating cards would have been a redesign the spec puts out of scope.
- `mt-4` came off each Inspector root: Card's own `gap-(--card-spacing)` is the 1rem that separated heading from content before.
- CardTitle renders a plain div, so `<h2>` stays inside it and the heading outline survives for the `<h3>` subheadings below. `role="heading" aria-level={2}` was tried first and `jsx-a11y(prefer-tag-over-role)` rejected it.
- Every conditional class string already went through `cn`; the only ternaries left in the file choose whether to render an element, not which classes to apply. The four hand-rolled helpers were gone before this slice; `inspectorField` and `chipItem` are `cva` variants, which the spec endorses.
- `README.md:27` keeps the line `11cr8l` settled; only the stale parenthetical "(planned; the Studio currently uses native controls)" is gone.
- `docs/ARCHITECTURE.md` gained rows for `src/components/ui/` and `src/lib/utils.ts`, records `routes/index.tsx -> components/ui -> lib/utils` with `hooks` and `components/ui` as leaves that import no Composition module, and the route row now names the primitives the page composes.

No test was added. Nothing in the suite renders React, and `q53d20` owns that harness; all 100 existing tests pass unchanged. The four checks pass and the production build prerenders.
