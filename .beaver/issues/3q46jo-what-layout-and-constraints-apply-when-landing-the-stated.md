---
id: 3q46jo
title: What layout and constraints apply when landing the stated stack on carbon-fiber?
state: done
assignee: agent
priority: high
labels:
    - roadmap:pfdjl3
    - session:research
parent: pfdjl3
created: 2026-08-18T22:57:36Z
updated: 2026-08-18T23:15:23Z
---

Research session. The stack is already chosen: TypeScript, React, TanStack Start in SPA mode, Tailwind CSS, ShadCN UI (Base UI variant), starting from `../carbon-fiber`, entirely on the frontend. The question is how that landing actually works.

Find:

- Whether TanStack Start SPA mode, Tailwind, and ShadCN Base UI run on carbon-fiber's Vite+ / pnpm workspace without a server runtime.
- The project layout that landing implies (`apps/web` only, extra packages, catalog entries, React types).
- Integration constraints: plugin order, SPA prerender, `components.json`, path aliases, what must be allowlisted under carbon-fiber's `strictDepBuilds`.
- What `vp check` / `vp test` / `vp run` need so the existing tracker issue `px5j2g` can record the four checks later.

Prior art in sibling repos (they have backends; this app must not): `../job-complete/apps/web` and `../idea-katalog/apps/web`. Template: `../carbon-fiber`.

Deliverable: the layout, the constraints, and the surprises — enough to land the stack without reopening the stack choice.

## Notes

**agent** — 2026-08-18T23:15:00Z

# Research report

## Question

What layout and constraints apply when landing the stated stack on carbon-fiber? The stack is already chosen: TypeScript, React, TanStack Start in SPA mode, Tailwind CSS, ShadCN UI (Base UI variant), starting from `../carbon-fiber`, entirely on the frontend.

## Answer

The stack runs on carbon-fiber's Vite+ / pnpm workspace without a production server runtime. Land a single `apps/web` app on the empty carbon-fiber globs. Do not add `apps/backend`, extra `packages/*`, or the official Start example's `nitro()` plugin. Serve `apps/web/dist/client` (`_shell.html` + assets) from a static host that rewrites unknown URLs to `/_shell.html`. Before install, allowlist `esbuild` under `strictDepBuilds` and exclude `semver` from `trustPolicy`. `vp check` already covers format, lint, and typecheck; `vp test` already passes an empty suite; add `vp dev` / `vp build` on the web app so `px5j2g` can record the four checks plus a run command.

## Findings

### 1. Compatibility without a server runtime

- TanStack Start SPA mode is for apps that do not need SSR for SEO or first paint. A CDN that can serve static assets is all that is required at runtime. After `spa.enabled`, a Start build prerenders the root route to `/_shell.html` and expects 404s to rewrite to that shell. (TanStack Start SPA mode guide, fetched 2026-08-18; https://tanstack.com/start/latest/docs/framework/react/guide/spa-mode)
- SPA mode does not forbid server functions, but it does not require them. The initial document is a shell; route HTML is rendered in the browser. (same source)
- Tailwind v4 is a Vite plugin with zero runtime: install `tailwindcss` + `@tailwindcss/vite`, register `tailwindcss()`, `@import "tailwindcss"` in CSS. (Tailwind “Installing with Vite”, fetched 2026-08-18; https://tailwindcss.com/docs/installation/using-vite)
- Tailwind's TanStack Start guide uses the same plugin plus `styles.css?url` on the root route `head.links`. (Tailwind “Install Tailwind CSS with TanStack Start”, fetched 2026-08-18; https://tailwindcss.com/docs/installation/framework-guides/tanstack-start)
- shadcn/ui's default is Base UI as of July 2026. Manual install uses `style: "base-nova"`, `rsc: false`, and `@base-ui/react` primitives. (shadcn changelog “July 2026 - Base UI as the Default”; Manual Installation, both fetched 2026-08-18; https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default, https://ui.shadcn.com/docs/installation/manual)
- carbon-fiber is an empty Vite+ workspace (`apps/*`, `packages/*`, `tools/*`) with no app tree yet. Vite+ (`vp`) is the toolchain. (carbon-fiber README.md; `apps/.gitkeep`, `packages/.gitkeep`)
- Both sibling landings already run this exact stack on carbon-fiber without Nitro: `spa: { enabled: true }`, `@tailwindcss/vite`, `@base-ui/react`, `components.json` `style: "base-nova"`, `rsc: false`. They have backends; those backends are product, not a Start requirement. (job-complete `apps/web/vite.config.ts`, `apps/web/package.json`, `apps/web/components.json`; idea-katalog same paths)
- Official `start-basic` is the counter-example: it registers `nitro()` and starts `node .output/server/index.mjs`. That is a server runtime. Do not copy it. (TanStack/router `examples/react/start-basic/vite.config.ts` and `package.json`, fetched 2026-08-18)
- Surprise: even the sibling SPA builds still emit `dist/server/server.js` next to `dist/client`. Runtime hosting uses the client tree. job-complete's client tree is only `_shell.html` + `assets/` — there is no `index.html`. (job-complete and idea-katalog `apps/web/dist/`)
- Surprise: generated `routeTree.gen.ts` still declares `ssr: true` under `@tanstack/react-start` in both SPA siblings. Ignore that file; do not treat the flag as “SSR is on.” (job-complete and idea-katalog `apps/web/src/routeTree.gen.ts`)

### 2. Layout

- carbon-fiber's rule: drop projects into `apps/*` / `packages/*` / `tools/*`; each app extends a `tsconfig/` preset. Shared toolchain versions come from the catalog. A project adds its own `vite.config.ts` only for runtime-specific plugins. (carbon-fiber README.md “Adding projects”; `pnpm-workspace.yaml` globs)
- Landing implies `apps/web` only. Neither sibling has a `packages/*` package. job-complete has no `packages/` directory at all. Extra packages are not required to land the stack. (carbon-fiber `packages/.gitkeep`; job-complete and idea-katalog trees)
- Web app shape that both siblings share, and that official Start from-scratch requires: `src/router.tsx` exporting `getRouter()`, `src/routes/__root.tsx` with `shellComponent`, at least `src/routes/index.tsx`, generated `src/routeTree.gen.ts`. (TanStack Start “Build a Project from Scratch”, fetched 2026-08-18; both siblings' `apps/web/src/`)
- `apps/web/tsconfig.json` extends `../../tsconfig/browser.json` and then sets `jsx: "react-jsx"`, `types: ["vite/client"]`, `paths: { "@/*": ["./src/*"] }`, `noEmit: true`, and `verbatimModuleSyntax: false`. React types (`@types/react`, `@types/react-dom` `^19`) live on the web app, not in the catalog. (both siblings' `apps/web/tsconfig.json` and `apps/web/package.json`)
- Catalog stays the carbon-fiber set (`@types/node`, `typescript`, `vite`/`vite-plus` coupled). Siblings add `vitest` to the catalog and override it; they do not catalog React, TanStack, Tailwind, or shadcn. (carbon-fiber `pnpm-workspace.yaml`; job-complete and idea-katalog `pnpm-workspace.yaml`)
- Suggested `apps/web` files at landing: `package.json`, `tsconfig.json`, `vite.config.ts`, `components.json`, `src/router.tsx`, `src/routes/__root.tsx`, `src/routes/index.tsx`, `src/styles.css`, `src/lib/utils.ts` (`cn`), and only the shadcn components that are actually added. `src/routeTree.gen.ts` is generated on first `vp dev` / `vp build`.
- Root name/scripts stay carbon-fiber's (`vp check`, `vp test`, `vp run -r build`). Add a convenience `dev` script that filters to the web app if desired (job-complete does; idea-katalog does not). (carbon-fiber `package.json`; job-complete `package.json`)

### 3. Integration constraints

- Plugin order that both siblings and official `start-basic` use: `tailwindcss()`, then `tanstackStart({...})`, then `viteReact()`. Resolve `@/` with Vite's `resolve.tsconfigPaths: true`, not `vite-tsconfig-paths`. (job-complete `apps/web/vite.config.ts`; idea-katalog `apps/web/vite.config.ts`; TanStack `start-basic/vite.config.ts`)
- Official Tailwind+Start snippet omits `viteReact()` and uses `tsConfigPaths()`. Treat that page as incomplete next to the working sibling configs and `start-basic`. (Tailwind TanStack Start guide, fetched 2026-08-18)
- SPA config for a studio with no extra static pages: `tanstackStart({ spa: { enabled: true } })` only, as in job-complete. Official default shell mask path is `/` and is recommended unless you also prerender `/`. (TanStack Start SPA mode guide; job-complete `apps/web/vite.config.ts`)
- Surprise: if you later prerender `/`, the shell is appended to the page list and the later entry wins, so masking `/` replaces the real home page. idea-katalog's `maskPath: "/spa-shell"` plus a real `/spa-shell` route exists only for that case. Do not add it at landing. (idea-katalog `apps/web/vite.config.ts`; `apps/web/src/routes/spa-shell.tsx`)
- SPA prerender defaults: `outputPath: /_shell.html`, `crawlLinks: false`, `retryCount: 0`. The shell is built from the SSR build of the root route; root-route loaders run at build time. (TanStack Start SPA mode guide)
- Host rewrite, in this order: existing static files first, then catch-all 404 → `/_shell.html`. job-complete's client output has no `index.html`, so a host that only looks for `index.html` will 404 the home page. (TanStack Start SPA mode guide; job-complete `apps/web/dist/client/`)
- `components.json` lives in `apps/web` (the CLI's `-c apps/web` cwd). Required shape: `style: "base-nova"`, `rsc: false`, `tsx: true`, `tailwind.config: ""` (v4), `tailwind.css` pointing at `src/styles.css`, aliases `@/components`, `@/lib/utils`, `@/components/ui`, `@/lib`, `@/hooks`, `iconLibrary: "lucide"`. Style and `baseColor` cannot be changed after init. (shadcn `components.json` docs and Manual Installation, fetched 2026-08-18; both siblings' `apps/web/components.json`)
- Path aliases must exist in both `components.json` and `apps/web/tsconfig.json` `paths`. Vite+ honors them via `resolve.tsconfigPaths: true`. (shadcn `components.json` “aliases”; both siblings)
- Surprise: current official manual install also adds a `shadcn` package and `@import "shadcn/tailwind.css"`. Neither sibling depends on `shadcn`; they copy components and import `tailwindcss` + `tw-animate-css` (idea-katalog also vendors `src/shadcn.css`). Landing can follow the siblings and skip the `shadcn` runtime package. (shadcn Manual Installation; both siblings' `package.json` / CSS)
- `verbatimModuleSyntax` must be `false` on the web app. Official Start warns it can leak server bundles into the client. carbon-fiber `tsconfig/base.json` sets it `true`; override only in `apps/web/tsconfig.json`, as both siblings do. (TanStack Start “Build a Project from Scratch”; carbon-fiber `tsconfig/base.json`; both siblings' `apps/web/tsconfig.json`)
- Bump `@tanstack/react-router` and `@tanstack/react-start` together. A split pair installs two router copies and SPA prerender fails. `vp check` / `vp test` still pass, so the break shows up only on `vp build`. (job-complete and idea-katalog `apps/web/package.json` `// @tanstack` comments)
- carbon-fiber `strictDepBuilds: true` + `allowBuilds: {}` fails install on any unreviewed lifecycle script. pnpm's `allowBuilds` map is the allowlist; unlisted packages are unreviewed. (carbon-fiber `pnpm-workspace.yaml`; pnpm Build Settings, fetched 2026-08-18; https://pnpm.io/settings/build)
- Both siblings allowlist only `esbuild: true`. esbuild 0.27.0's `postinstall` is `node install.js` (platform binary). carbon-fiber's lockfile lists esbuild as an optional peer of `vite-plus-core` but does not install it; adding Start pulls it (idea-katalog lockfile resolves `@tanstack/react-start` and `vite-plus-core` with `esbuild@0.27.0`). (esbuild 0.27.0 `package.json`; idea-katalog `pnpm-workspace.yaml` and `pnpm-lock.yaml`; job-complete `pnpm-workspace.yaml`)
- Both siblings also set `trustPolicyExclude: [semver]` because Start's compiler pulls `@babel/core`, which pins `semver@6.3.1` (2023, predates provenance) and trips `trustPolicy: no-downgrade`. (both siblings' `pnpm-workspace.yaml`; idea-katalog `pnpm-lock.yaml` `semver@6.3.1`)
- Ignore generated Start output: `**/routeTree.gen.ts` in root `fmt` and `lint`; `.tanstack/` in `.gitignore`. carbon-fiber's gitignore does not yet list `.tanstack/`. (both siblings' root `vite.config.ts` and `.gitignore`; carbon-fiber `.gitignore`)
- Root lint: carbon-fiber and idea-katalog stay on `plugins: ["typescript"]`. job-complete adds `"react"` and `"jsx-a11y"` and repeats them in the test override. Not required to boot the stack; needed if React/a11y lint should run on first `vp check`. (carbon-fiber, idea-katalog, job-complete root `vite.config.ts`)

### 4. What `vp check` / `vp test` / `vp run` need for `px5j2g`

- `vp check` is format (Oxfmt) + lint (Oxlint) + typecheck (tsgolint) when `lint.options.typeCheck` is true. carbon-fiber already enables `typeAware` and `typeCheck`. Flags: `--fix`, `--no-fmt`, `--no-lint`, and `--no-fmt --no-lint` for typecheck only. (Vite+ Check guide, fetched 2026-08-18; https://viteplus.dev/guide/check; carbon-fiber `vite.config.ts`)
- `vp test` is built-in Vitest, not a `package.json` `test` script. It does not watch by default. carbon-fiber already sets `test.passWithNoTests: true`, so an empty suite passes. `px5j2g`'s “add a smoke test if the runner fails on an empty suite” does not apply unless that flag is removed. (Vite+ Test guide, fetched 2026-08-18; https://viteplus.dev/guide/test; carbon-fiber `vite.config.ts`)
- `vp run` runs `package.json` scripts or `vite.config.ts` tasks, with `-r` for every workspace package in dependency order. `vp dev` is the built-in Vite dev server; `vp run dev` is a `dev` script if one exists. (Vite+ Run guide, fetched 2026-08-18; https://viteplus.dev/guide/run)
- Mapping `px5j2g` can record once `apps/web` exists (Vite+ vocabulary, as the issue asked):
  - Format: `vp fmt --check` (or the format half of `vp check`)
  - Lint: `vp lint`
  - Typecheck: `vp check --no-fmt --no-lint`
  - Test: `vp test`
  - Combined static pass (carbon-fiber / idea-katalog): `vp check`
  - Build: `vp run -r build` (needs `"build": "vp build"` on `apps/web`)
  - Run: `vp dev` from `apps/web`, or a root script `pnpm --filter <web-name> dev` that calls `vp dev --port 3000`
- carbon-fiber root already has `check`, `test`, `build`, `ci`. idea-katalog kept that shape. job-complete split format/lint/typecheck for AGENTS.md; that is optional, not required by Vite+. (carbon-fiber `package.json`; idea-katalog `package.json`; job-complete `package.json` and `AGENTS.md`)
- CI already runs `pnpm check`, `pnpm test`, `pnpm build` on a frozen lockfile. After landing, the same workflow is enough; no new job is required for `px5j2g`. (carbon-fiber `.github/workflows/ci.yml`; `px5j2g` body)
- `apps/web` scripts that make the above real: `"dev": "vp dev --port 3000"`, `"build": "vp build"`, `"preview": "vp preview"`. Typecheck can stay `tsc --noEmit` locally; `vp check` is the workspace typecheck. (both siblings' `apps/web/package.json`)

## Unresolved

- Exact `@tanstack/react-start` / `@tanstack/react-router` versions to pin on the day of landing. Siblings use `^1.168.42` / `^1.170.25` today; official `start-basic` is already a few patch versions ahead. The constraint is “bump the pair together,” not a specific pair.
- Whether first landing should add the `react` / `jsx-a11y` lint plugins (job-complete) or keep carbon-fiber's TypeScript-only lint (idea-katalog). Either boots.
- Whether to adopt official shadcn's new `shadcn` package + `@import "shadcn/tailwind.css"`, or keep the siblings' copy-in setup. Not required to land.
- Whether `vp preview` rewrites 404s to `/_shell.html` the way a production CDN must. Not verified here; production rewrite is documented, preview behavior is not.
- Whether a later composition engine package is desirable. Out of this node's scope; still on the Frontier.

## Sources

- carbon-fiber: `README.md`, `package.json`, `pnpm-workspace.yaml`, `vite.config.ts`, `tsconfig/{base,browser,library,node}.json`, `.node-version`, `.gitignore`, `.github/workflows/ci.yml`, `pnpm-lock.yaml` (vite-plus-core 0.2.8 / esbuild optional peer)
- job-complete: `package.json`, `pnpm-workspace.yaml`, `vite.config.ts`, `AGENTS.md`, `.gitignore`, `.github/workflows/ci.yml`, `apps/web/{package.json,vite.config.ts,tsconfig.json,components.json}`, `apps/web/src/{router.tsx,routes/__root.tsx,routes/index.tsx,styles.css,lib/utils.ts,components/ui/button.tsx,routeTree.gen.ts}`, `apps/web/dist/{client,server}`
- idea-katalog: `package.json`, `pnpm-workspace.yaml`, `vite.config.ts`, `.gitignore`, `.github/workflows/ci.yml`, `apps/web/{package.json,vite.config.ts,tsconfig.json,components.json}`, `apps/web/src/{router.tsx,routes/__root.tsx,routes/spa-shell.tsx,styles.css,shadcn.css,routeTree.gen.ts}`, `apps/web/dist/{client,server}`, `pnpm-lock.yaml` (esbuild 0.27.0, semver 6.3.1)
- TanStack Start SPA mode: https://tanstack.com/start/latest/docs/framework/react/guide/spa-mode (fetched 2026-08-18)
- TanStack Start from scratch: https://tanstack.com/start/latest/docs/framework/react/build-from-scratch (fetched 2026-08-18)
- TanStack Start static prerendering: https://tanstack.com/start/latest/docs/framework/react/guide/static-prerendering (fetched 2026-08-18)
- TanStack `start-basic` example: https://raw.githubusercontent.com/TanStack/router/main/examples/react/start-basic/vite.config.ts and `package.json` (fetched 2026-08-18)
- Tailwind Vite install: https://tailwindcss.com/docs/installation/using-vite (fetched 2026-08-18)
- Tailwind + TanStack Start: https://tailwindcss.com/docs/installation/framework-guides/tanstack-start (fetched 2026-08-18)
- shadcn Manual Installation: https://ui.shadcn.com/docs/installation/manual (fetched 2026-08-18)
- shadcn `components.json`: https://ui.shadcn.com/docs/components-json (fetched 2026-08-18)
- shadcn July 2026 Base UI default: https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default (fetched 2026-08-18)
- shadcn TanStack Start install: https://ui.shadcn.com/docs/installation/tanstack (fetched 2026-08-18)
- Vite+ Check / Test / Run: https://viteplus.dev/guide/check, https://viteplus.dev/guide/test, https://viteplus.dev/guide/run (fetched 2026-08-18)
- pnpm `strictDepBuilds` / `allowBuilds`: https://pnpm.io/settings/build (fetched 2026-08-18)
- esbuild 0.27.0 `package.json` `scripts.postinstall` (`node install.js`) in idea-katalog's store
- tracker issue `px5j2g` (Establish format, lint, typecheck, and test checks when the stack lands)
