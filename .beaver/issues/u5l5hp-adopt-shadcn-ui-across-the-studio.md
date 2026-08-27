---
id: u5l5hp
title: Adopt shadcn UI across the Studio
state: done
priority: medium
labels:
    - spec
created: 2026-08-26T16:31:56Z
updated: 2026-08-27T04:53:59Z
---

## Decision (settled 2026-08-26)

**Adopt shadcn UI in full.** Every control in the Studio becomes a shadcn component. The hand-rolled class helpers — `chipClass`, `textChipClass`, `numberChromeClass`, `numberFieldClass` — are deleted, and `cn` becomes the only place a conditional class string is assembled.

This settles the question the audit raised. `components.json` (`style: "base-nova"`, Base UI, lucide icons), the `@/*` alias, `resolve.tsconfigPaths`, `@base-ui/react`, `class-variance-authority`, `clsx`, `tailwind-merge`, and `lib/utils.ts` all stay, and each now has a stated reason: they are the runtime of the component library the Studio is built from. `lucide-react` was never dead — `routes/index.tsx:2` imports four icons from it.

**This spec runs after the maintenance queue, not inside it.** Three maintenance issues rewrite the same JSX (`mqab43` moves logic out of the page, `msmb41` removes the `onChange` prop from five component signatures, `yju1dp` replaces the four hand-written draft fields with one hook). Migrating the markup while that logic is still being pulled out means doing both badly. The first sub-issue carries the blocking edges.

## Scope

| Today | After |
|---|---|
| `<button className={chipClass(selected)}>` | `<ToggleGroupItem value=…>` |
| `<input className={numberFieldClass}>` | `<Input>` paired with `<Slider>` |
| `<div className="…border-t…">` | `<Separator />` |
| `<section>` | `<Card>` / `<CardHeader>` |
| 7 ad-hoc class ternaries | `cn()` and `cva` variants |

Out of scope: changing what any control does, the Composition data shape, or the draw path. This is a markup and styling migration. Every existing test must still pass unchanged — if a test breaks, the migration changed behaviour it should not have.

## Known risks for the first sub-issue

- The `shadcn` CLI needs network access and writes into `src/components/ui`. If the sandbox blocks it, vendor the component source from the registry by hand — do not add a component library dependency to work around it.
- The workspace runs `minimumReleaseAge`, `trustPolicy: no-downgrade`, and `strictDepBuilds`. Any transitive dependency a component pulls in must be allowlisted deliberately, and `docs/CODING_STANDARDS.md` requires a stated reason for it.
- `styles.css:22` maps `--color-destructive-foreground: var(--destructive-foreground)`, and `--destructive-foreground` is never defined. Fix it in the first sub-issue before any component consumes it.

## Acceptance

This spec is complete when every sub-issue is closed and no hand-rolled class helper remains in `routes/index.tsx`. Build the sub-issues; never this issue.

## Notes

**claude** — 2026-08-27T02:51:25Z

Unused shadcn scaffolding removed (2026-08-26) during a simplification pass: @base-ui/react, class-variance-authority, clsx, tailwind-merge and tw-animate-css were production dependencies with zero imports anywhere in src; apps/web/src/lib/utils.ts (cn()) had no callers; apps/web/components.json and 49 lines of unused CSS tokens (--chart-1..5, --sidebar-*, --popover*, --destructive, the last of which referenced an undefined --destructive-foreground) were dead. None of this was in use — the sy3fen base landing was reverted in dd90434. When this spec is built, re-add the dependencies and re-run 'shadcn init' as the first step rather than assuming the scaffolding is still present.

**claude** — 2026-08-27T04:53:41Z

Built by an implement-loop run on 2026-08-27 (03:20–04:38Z), one session per sub-issue, five for five.

| Sub-issue | Commit | Landed |
|---|---|---|
| sy3fen | f49cb96 | shadcn base, cn at @/lib/utils, tsconfigPaths, CSS tokens reconciled |
| 4x0vj8 | cd0ecf5 | Button, Input, Label; numberChromeClass + numberFieldClass collapsed into the inspectorField cva |
| ikjavi | de926bd | Slider for all seven knobs; local clamp and .studio-slider deleted |
| ywo131 | 45bbf72 | four chip groups as ToggleGroup; chipClass and textChipClass deleted |
| r169wm | 16565a3 | Inspector as Card + Separator; README and ARCHITECTURE updated |

Full diff b0e3d4f..16565a3: +3200/-375 over 25 files, 8 components vendored into src/components/ui.

**Acceptance met.** All four hand-rolled class helpers are gone from routes/index.tsx, confirmed by grep. Checks verified independently of the sessions' own reports: vp fmt --check clean, vp lint clean, typecheck 0 errors over 37 files, 100 tests in 10 files passing. The spec required every existing test to pass unchanged; they do.

**Three issue bodies were wrong about the library, and each session corrected against the vendored source rather than forcing the spec's wording.** sy3fen assumed the scaffolding still existed (9083999 had deleted it). sy3fen's handoff claimed a shadcn/tailwind.css import was needed for Button/Input/Label; 4x0vj8 checked the built CSS, found those variants native to Tailwind 4, and left it out — then ikjavi found Slider genuinely does need it, because bare data-horizontal resolves to [data-orientation=horizontal] under Base UI. ywo131's body specified ToggleGroup type="single", a Radix prop; base-nova is Base UI, where single-select is the default and the value is an array.

**Two deviations accepted, not fixed.**

1. Slider aria-label lands on the role="group" root, where SliderPrimitive.Root puts it, so the focusable range input has no name of its own. Reviewed and accepted 2026-08-27: every KnobRow pairs the slider with an Input carrying the same aria-label, so all seven values stay reachable by keyboard and screen reader, and the group name is announced on entry. Base UI exposes Slider.Thumb getAriaLabel(index) if this is ever revisited.
2. Slider thumb is bg-white with border-ring in both schemes (was var(--foreground)) and the filled track is bg-primary (was var(--foreground)). base-nova defaults, kept because this is a markup and styling migration.

**Cost to note.** pnpm-lock.yaml grew 2447 lines. Most of that is the shadcn devDependency, added by ikjavi solely so styles.css can @import shadcn/tailwind.css for its @custom-variant rules. Vendoring those rules into styles.css and dropping the package is a live alternative if the transitive surface ever matters.

**The 8 files in src/components/ui are vendored byte-identical to the registry.** Nothing pins them and no lockfile covers them: a future shadcn add overwrites local edits silently. Any deliberate change to one should say so at the edit site.

Follow-on: q53d20 (render harness) — nothing in the suite renders React, so every vendored component's prop forwarding is verified only by reading. That is why deviation 1 above reached a commit with no test to catch it.
