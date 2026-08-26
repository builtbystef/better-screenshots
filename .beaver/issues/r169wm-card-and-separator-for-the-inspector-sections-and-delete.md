---
id: r169wm
title: Card and Separator for the Inspector sections, and delete the class helpers
state: todo
priority: low
labels:
    - maintenance
depends_on:
    - ywo131
    - ikjavi
    - 11cr8l
parent: u5l5hp
created: 2026-08-26T17:34:11Z
updated: 2026-08-26T17:40:35Z
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
