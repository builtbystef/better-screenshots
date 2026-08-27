---
id: 4x0vj8
title: Button, Input, and Label
state: todo
priority: medium
labels:
    - maintenance
depends_on:
    - sy3fen
parent: u5l5hp
created: 2026-08-26T17:33:46Z
updated: 2026-08-27T03:36:43Z
---

Replace the primitives that already exist on the page one-for-one.

`routes/index.tsx` currently renders 7 `<button>`, 11 `<input>`, and 3 `<label>`. Add the shadcn `Button`, `Input`, and `Label` components and use them at every one of those sites.

## Work

- `Button`: the place affordance, the upload trigger, the remove control, the export control, and the thumbnail removes. Map the existing visual weights onto `variant` (`default`, `secondary`, `ghost`, `outline`) and `size` rather than restating Tailwind strings.
- `Input`: the numeric fields, the hex fields, and the URL field. `numberChromeClass` and `numberFieldClass` (`routes/index.tsx:744-746`) collapse into `className={cn(…)}` on `Input`, or into a `cva` variant if more than two sites share the shape.
- `Label`: the three `<label>` elements, wired to their inputs with `htmlFor`.
- The `<input type="color">` swatch keeps its native element if shadcn has no equivalent — say so in the closing note rather than approximating one.

Keep every `onChange`, `onBlur`, and `onKeyDown` binding exactly as the `useDraft` hook left it. This sub-issue changes which component renders the field, not how the field commits.

## Acceptance

- No bare `<button>`, `<input type="text">`, or `<label>` remains in `routes/index.tsx`, except a documented native `<input type="color">` and `<input type="file">`.
- `numberChromeClass` and `numberFieldClass` are gone.
- All existing tests pass unchanged.
- `vp lint` passes with the react and jsx-a11y plugins enabled — every `Label` has a target and every icon-only `Button` has an accessible name.
- The four checks pass.

## Notes

**claude** — 2026-08-27T03:36:43Z

From sy3fen (the base landing): `shadcn init` wanted two things this sub-issue will need and sy3fen deliberately left out, because nothing consumed them yet.

- `@import "shadcn/tailwind.css"` in `apps/web/src/styles.css`, plus `shadcn` as a dependency. That stylesheet defines the `data-open`, `data-closed`, `data-checked`, `data-selected`, `data-disabled` and `data-*` custom variants that the base-nova components use in their class strings, along with the `no-scrollbar`, `scroll-fade-*` and `shimmer` utilities. Without the import, those variants silently produce no CSS. `shadcn add` re-adds the import; put `shadcn` in **devDependencies**, not dependencies — the CLI init writes it into dependencies, and it drags ~300 transitive packages.
- `@base-ui/react` and `class-variance-authority` are already installed (sy3fen kept them per the spec) but have no importer yet. Your components are their first consumers.

Also: `--radius-lg`, `--radius-2xl`, `--radius-3xl` and `--radius-4xl` were deleted from the `@theme inline` block, since nothing referenced them. If a vendored component uses `rounded-lg`, it will fall back to Tailwind's built-in 0.5rem instead of `var(--radius)`. Re-add the mapping if that matters.
