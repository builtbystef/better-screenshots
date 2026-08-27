---
id: 4x0vj8
title: Button, Input, and Label
state: done
assignee: claude
priority: medium
labels:
    - maintenance
depends_on:
    - sy3fen
parent: u5l5hp
created: 2026-08-26T17:33:46Z
updated: 2026-08-27T04:57:18Z
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

**claude** — 2026-08-27T03:57:08Z

Landed. `shadcn add button input label` vendored the three base-nova components into `apps/web/src/components/ui/`. `@base-ui/react`, `class-variance-authority`, `clsx` and `tailwind-merge` now have their first importer. No new dependency was added.

**Sites migrated.** The export control, the thumbnail select, and the thumbnail remove became `Button`. The Background hex field, the Border color hex field, the URL field, and the three numeric fields (the knob field, Position X, Position Y) became `Input`. All three label elements became `Label`, each keeping its `htmlFor`. The Replace trigger and the drop-zone "Choose a file" affordance route their styling through `buttonVariants()` rather than restating Tailwind, so a label keeps driving the file input instead of a nested button breaking it.

**claude** — 2026-08-27T03:57:46Z

**Native elements kept, as the body allows.** Both color swatches keep the native color input: the base-nova registry has no colour-input component, and approximating one would mean rebuilding the OS picker. Both file inputs stay native. The range input also stays, since it belongs to the `Slider` in `ikjavi`.

**claude** — 2026-08-27T03:57:59Z

**`numberChromeClass` and `numberFieldClass` are gone.** Three numeric sites and two hex sites shared a shape, so they collapsed into one `cva` named `inspectorField`, carrying a `field` variant with a `number` case and a `hex` case. `w-12` and the `min-w-0 w-full` pair were dropped: the `w-full min-w-0` already inside `Input` fills the 3rem grid column identically. Both cases carry `md:text-xs` deliberately. The base class string of `Input` ends in `md:text-sm`, and the Studio always sits at or above the `md` breakpoint because its main element sets a 48rem minimum width, so a bare `text-xs` would have silently rendered as `text-sm`.

**claude** — 2026-08-27T03:58:16Z

**Deviation from the acceptance line, and why.** "No bare button remains" is not literally true: four button sites survive, namely the Catalog solids, the Catalog gradients, the aspect presets, and the window schemes. Those are the four chip groups that `ywo131` owns, and `ywo131` turns them into `ToggleGroupItem`, not `Button`. The two issues are siblings with no edge between them, so converting the chips here would have been work that `ywo131` throws away. The enumeration in the Work section was taken as the operative list. `chipClass` and `textChipClass` are untouched for the same reason.

**Two repository facts changed.** First, `--radius-lg: var(--radius)` is back in the `@theme inline` block. The base class string of every vendored component starts with `rounded-lg`, and without the mapping it fell back to the built-in 0.5rem of Tailwind instead of the 0.625rem this project uses. Verified in the built CSS, where `.rounded-lg` now resolves to `var(--radius)`. The other radii that `sy3fen` removed are still unreferenced and stay removed. Second, `components/ui/label.tsx` carries an `oxlint-disable-next-line jsx-a11y/label-has-associated-control`. The rule cannot see through a wrapper that receives `htmlFor` via props, and it fired on the vendored file, not on any call site. Suppressing it locally keeps the rule live at every real `Label`, which the acceptance asks for. A future `shadcn add label` overwrites the file and reintroduces the warning.

**claude** — 2026-08-27T03:58:42Z

**The shadcn tailwind.css import was NOT added, contradicting the earlier note.** These three components use only bracketed variants: has-data, in-data, group-data, aria-expanded and not-aria. All of those are native to Tailwind 4. Confirmed in the built CSS, which contains the compiled in-data and has-data rules. The bare `data-open` and `data-checked` variants that stylesheet defines have no consumer yet, so neither the import nor the `shadcn` package was needed. A later slice that vendors `ToggleGroup` or `Slider` should re-check and add the import, with `shadcn` in devDependencies, only when a bare data variant actually appears.

**Seam selection: no new test.** This slice changes which component renders each field, never how the field commits, and the project has no harness that renders React, so the outermost seam that could observe the criteria does not exist yet. The two risks the body flags were verified with throwaway jsdom probes that were run and then deleted. First, the Base UI `Input` merges its internal handlers ahead of ours rather than replacing them, so `useDraft` still sees every `onChange`, still commits on blur, and still commits on Enter. Second, `Button` renders a native button whose type attribute defaults to button, fires `onClick` when enabled, and stays inert when disabled. Building that harness for real is `q53d20`, published under this spec. It also protects `ywo131`, `ikjavi` and `r169wm`, which each carry the same unverified-forwarding risk.

All 100 existing tests pass unchanged. Format, lint, typecheck, test, and the workspace build all pass.

**claude** — 2026-08-27T04:57:18Z

q53d20 (render harness) was deleted on 2026-08-27. Render-testing the components/ui wrappers is not wanted for this project: they are vendored registry source whose behaviour is the library's, and the seams worth asserting are covered without rendering React. The standing rule is now in docs/CODING_STANDARDS.md under Module boundaries — verify a wrapper's prop forwarding with a throwaway probe when a slice needs it, and delete the probe with the slice. References to q53d20 above are historical; there is no follow-on issue.
