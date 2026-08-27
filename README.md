# Better Screenshots

[![CI](https://github.com/builtbystef/better-screenshots/actions/workflows/ci.yml/badge.svg)](https://github.com/builtbystef/better-screenshots/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A small browser studio that turns a plain screenshot into a polished image for launch posts, landing pages, and social media.

Drop a screenshot in, put it on a background, adjust the placement, add a shadow, and export a PNG. Everything runs in your browser.

## Features

- **Bring an image in** by file picker, drag and drop, or paste from the clipboard.
- **Backgrounds**: eight solid colours, six gradients, any hex colour you type, or your own image saved in the browser.
- **Frames**: seven preset sizes, including 16:9, 1:1, 4:5, 9:16, and 1.91:1.
- **Placement**: set padding and scale, then drag the screenshot to position it.
- **Browser window**: wrap the screenshot in a light or dark title bar with your own URL.
- **Effects**: drop shadow (offset, blur, opacity), border (width, colour), and rounded corners.
- **Export**: a PNG rendered at 2x, drawn by the same code that paints the live preview.

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

## Documentation

- [`docs/GLOSSARY.md`](docs/GLOSSARY.md) is the shared vocabulary. Code, tests, and issues use these words.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) describes the modules and the seams between them.
- [`docs/CODING_STANDARDS.md`](docs/CODING_STANDARDS.md) holds the conventions the linter cannot enforce.
- [`docs/adr/`](docs/adr) records decisions that are already settled.

## License

[MIT](LICENSE) © builtbystef
