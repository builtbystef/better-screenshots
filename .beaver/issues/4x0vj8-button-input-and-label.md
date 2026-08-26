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
updated: 2026-08-26T17:40:35Z
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
