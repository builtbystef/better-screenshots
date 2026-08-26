---
id: u5l5hp
title: Adopt shadcn UI across the Studio
state: todo
priority: medium
labels:
    - spec
created: 2026-08-26T16:31:56Z
updated: 2026-08-26T17:32:57Z
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
