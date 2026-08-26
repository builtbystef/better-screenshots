# Coding standards

The conventions that this project holds, beyond what linters and formatters enforce. Reviews check diffs against this file. Keep each rule current, or delete it.

## Dependencies

- Prefer what the project already has: an installed library, or the standard library, before a new dependency.
- A new production dependency needs a stated reason, in the issue that adds it. A new dependency is never the default answer to a small problem.

Production dependencies in `apps/web` and why they stay:

- `react`, `react-dom`: the Studio is a React app.
- `@tanstack/react-router`, `@tanstack/react-start`: the route tree and the SPA host.
- `tailwindcss`: utility styling.
- `@base-ui/react`, `class-variance-authority`, `clsx`, `tailwind-merge`: the runtime of the shadcn component library the Studio is built from (`cn` in `lib/utils.ts` is the class-string seam).
- `lucide-react`: Preview and Inspector icons.
