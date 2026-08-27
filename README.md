# Better Screenshots

Better Screenshots is a simple, browser-based studio for creating polished product screenshots for launch posts, landing pages, social media, and other marketing materials.

## Core Experience

Users can:

- Upload a Screenshot
- Place the Screenshot on a customizable Background
- Adjust Position, Scale, Padding, and Frame
- Apply lightweight Effects such as shadows, borders, and rounded corners
- Export the Composition as a PNG

The product should feel fast, minimal, and focused—more like a lightweight design utility than a full graphics editor.

## Technical Requirements

The application should run entirely on the frontend with no backend dependency.

**Stack:**

- TypeScript
- React
- TanStack Start in SPA mode
- Tailwind CSS
- ShadCN UI using the Base UI variant (planned; the Studio currently uses native controls)

The Studio lives in `apps/web`, started from the carbon-fiber Vite+ workspace.

## Commands

```sh
pnpm install        # install dependencies
pnpm dev            # Studio at http://localhost:3000
vp check            # format + lint + typecheck
vp test             # Vitest
vp run -r build     # production build
```
