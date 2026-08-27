# Coding standards

The conventions that this project holds, beyond what linters and formatters enforce. Reviews check diffs against this file. Keep each rule current, or delete it.

## Seams and outcomes

- Expected failures do not throw across Session or persistence seams. Session writers return `"ok" | "refuse"` (or the upload-specific refusal union), persistence methods return unions that include `"unavailable"`, and browser adapters translate exceptions into those outcomes.
- User-facing copy for refused operations lives in `messages.ts`. Routes render the values returned by that module instead of defining refusal copy inline.

## Composition and domain values

- Every Composition write passes a replacement Composition to the Session's `commit`; code does not mutate the current Composition or assign it outside `commit`. `commit` increments the version and notifies subscribers for every write.
- Collection inputs and views exposed by `StudioSession`, and collections exported by `catalog.ts`, are typed `readonly`.
- Raw user text becomes a `HexColor` only through `parseHex`; domain writers accept `HexColor`, not `string`. Give each new domain value its own type and one parser from raw input.

## Module boundaries

- Application code lives in a folder of its own under `features/`, not in a folder named after its file type. A feature owns its `composition/`, `platform/`, `components/`, and `hooks/`; a module only leaves the feature when a second feature needs it, and then it goes to `lib/`, `hooks/`, or `components/`.
- `routes/` declares routes and renders a feature's page component. It holds no state, no boot, and no markup beyond the page it renders. Put the boot in the feature's page.
- A feature is entered through its `index.ts`. `routes/` imports `@/features/<feature>`; nothing outside a feature reaches into its folders.
- `components/` and `hooks/` inside a feature contain JSX, DOM event handling, and React state only. Put parsing in `composition/parse.ts`, Composition validation in `composition/session.ts`, Composition geometry in `composition/placement.ts`, and DOM gesture geometry in `platform/drag.ts`.
- One Inspector section per file under `features/studio/components/inspector/`, and one Preview DOM concern per hook under `features/studio/hooks/`. When a section outgrows its file, extract a row component beside it rather than letting the file grow.
- Import internal modules through the `@/` alias, never a relative path.
- A test may declare `@vitest-environment jsdom` only when its module owns a DOM seam: anything under a `platform/` folder, `lib/scheme.ts`, a component, a hook, or a route. Nothing under a `composition/` folder may.
- The shadcn wrappers in `components/ui` are not render-tested. They are vendored registry source whose behaviour is the library's, not this project's; the seams worth asserting — parsing, commit and revert, geometry, paint — are covered without rendering React. Verify a wrapper's prop forwarding with a throwaway probe when a slice needs it, and delete the probe with the slice.

## Production source

- Do not add explanatory comments to production source. Make the code state the rule; reserve comments for tool directives such as generated-file markers.

## Dependencies

- A new production dependency needs a stated reason in the issue that adds it. Prefer an installed library or the standard library when either already provides the needed capability.
