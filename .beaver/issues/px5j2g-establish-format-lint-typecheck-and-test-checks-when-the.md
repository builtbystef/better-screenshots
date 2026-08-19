---
id: px5j2g
title: Establish format, lint, typecheck, and test checks when the stack lands
state: done
assignee: agent
priority: medium
labels:
    - maintenance
created: 2026-08-18T22:49:12Z
updated: 2026-08-19T05:54:18Z
---

This repository has no app tree yet, so the agent setup recorded no check commands.

When the carbon-fiber starting template is copied in (TypeScript, React, TanStack Start in SPA mode, Tailwind, ShadCN Base UI), record the four checks in `AGENTS.md` and make sure each command passes on the tree:

- Format
- Lint
- Typecheck (strictest settings the current code passes; full strict on a fresh tree)
- Test (add a smoke test if the runner fails on an empty suite)

Vite+ via `vp check` / `vp test` is the expected vocabulary. Add a run command if the app is startable. If a CI-capable remote exists by then and there is no workflow, offer a minimal workflow that runs the same commands on push.

## Notes

**agent** — 2026-08-19T05:54:17Z

# Done

Copied carbon-fiber into this repo and landed `apps/web` so the four checks have a tree to run on.

## Stack

- Vite+ workspace from carbon-fiber (`vp`, pnpm catalog, `tsconfig/` presets, CI, hooks, supply-chain policy).
- `apps/web` only: TanStack Start SPA (`spa.enabled`, no Nitro), Tailwind v4, ShadCN Base UI scaffolding (`components.json` `style: "base-nova"`, `rsc: false`, `cn`, theme tokens). No `packages/*`, no `shadcn` runtime package.
- TanStack pair: `@tanstack/react-start@1.168.46` + `@tanstack/react-router@1.170.29` (Start's pinned router; one copy).
- `allowBuilds: { esbuild: true }` and `trustPolicyExclude: [semver]` as 3q46jo required.

## Checks (all green)

- Format: `vp fmt --check`
- Lint: `vp lint`
- Typecheck: `vp check --no-fmt --no-lint` (full strict from carbon-fiber `tsconfig/base.json`)
- Test: `vp test` (empty suite passes via `passWithNoTests`; no smoke test added)
- Run: `pnpm dev`

No git remote, so no CI offer. Carbon-fiber's workflow is in `.github/workflows/ci.yml` for when a remote exists.

## Decisions a reviewer should know

- TypeScript-only lint (carbon-fiber / idea-katalog), not job-complete's `react` / `jsx-a11y`.
- No unused shadcn components. CLI can add them later against `apps/web/components.json`.
- `docs/ARCHITECTURE.md` now names `apps/web` as the Studio (0abxd5).
