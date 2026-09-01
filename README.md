# Better Screenshots

[![CI](https://github.com/builtbystef/better-screenshots/actions/workflows/ci.yml/badge.svg)](https://github.com/builtbystef/better-screenshots/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A small browser studio that turns a plain screenshot into a polished image for launch posts, landing pages, and social media.

**Live at [better-screenshots.pages.dev](https://better-screenshots.pages.dev).**

Drop a screenshot in, put it on a background, adjust the placement, add a shadow, and export a PNG. Everything runs in your browser — images are never uploaded anywhere.

## Features

- **Bring an image in** by file picker, drag and drop, or paste from the clipboard.
- **Backgrounds**: eight solid colours, six gradients, any hex colour you type, or your own image saved in the browser.
- **Frames**: nine preset sizes named for where they go — Social post (4:5), Short-form video (9:16), Landscape (16:9), Instagram grid (3:4), Pinterest Pin (2:3), Square (1:1), Link preview (1.91:1), Classic (4:3), and Photo (3:2).
- **Placement**: set padding and scale, then drag the screenshot to position it.
- **Browser window**: wrap the screenshot in a light or dark title bar with your own URL.
- **Effects**: drop shadow (offset, blur, opacity), border (width, colour), and rounded corners.
- **Export**: a PNG rendered at 2x, drawn by the same code that paints the live preview.
- **Private by construction**: no backend, no accounts, no telemetry. Uploaded backgrounds live in IndexedDB and your settings in localStorage, so the studio reopens the way you left it.

## Getting started

You need [Node.js](https://nodejs.org) 24 or newer and [pnpm](https://pnpm.io) 11.

```sh
git clone https://github.com/builtbystef/better-screenshots.git
cd better-screenshots
pnpm install
pnpm dev
```

The studio opens at http://localhost:3000.

## Commands

| Command      | What it does                         |
| ------------ | ------------------------------------ |
| `pnpm dev`   | Run the studio locally on port 3000  |
| `pnpm check` | Format, lint, and typecheck          |
| `pnpm test`  | Run the test suite                   |
| `pnpm build` | Build for production                 |
| `pnpm ci`    | Run check, test, and build in one go |

Individual checks are available through the `vp` CLI: `vp fmt --check`, `vp lint`, and `vp check --no-fmt --no-lint`.

## Tech stack

TypeScript, React 19, TanStack Start in SPA mode, Tailwind CSS 4, and shadcn UI on the Base UI variant. Drawing and export both go through the Canvas 2D API. Uploaded backgrounds are kept in IndexedDB. The build and the checks run on [Vite+](https://vite.dev).

## Project structure

```text
apps/web/src/
  routes/                 the URL surface, and nothing else
  features/studio/        the studio
    composition/          composition rules, pure and testable in Node
    platform/             canvas, drag and drop, and IndexedDB seams
    components/           the shell, the preview, and the inspector
    hooks/                one hook per preview DOM concern
  components/ui/          shadcn primitives
  hooks/ lib/             shared code that knows nothing about the studio
docs/                     glossary, coding standards, architecture, ADRs
```

## Deployment

The build is a fully static SPA: `pnpm build` writes it to `apps/web/dist/client`, complete with an `index.html`, so it deploys to any static host with no rewrite rules.

The live site is on [Cloudflare Pages](https://pages.cloudflare.com), connected to this repository with these settings:

| Setting                | Value                  |
| ---------------------- | ---------------------- |
| Build command          | `pnpm build`           |
| Build output directory | `apps/web/dist/client` |

The Node version comes from `.node-version` and the pnpm version from the `packageManager` field in `package.json`, both of which Cloudflare's build image respects. A push to `main` deploys automatically once the project is connected.

If the site URL ever changes, update `siteUrl` in `apps/web/src/lib/site.ts` so the link-preview tags point at the right origin.

## Documentation

- [`docs/GLOSSARY.md`](docs/GLOSSARY.md) is the shared vocabulary. Code, tests, and issues use these words.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) describes the modules and the seams between them.
- [`docs/CODING_STANDARDS.md`](docs/CODING_STANDARDS.md) holds the conventions the linter cannot enforce.
- [`docs/adr/`](docs/adr) records decisions that are already settled.

## License

[MIT](LICENSE) © builtbystef
