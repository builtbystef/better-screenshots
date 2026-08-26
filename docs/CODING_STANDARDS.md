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

- `routes/index.tsx` contains JSX, DOM event handling, and React state only. Put parsing in `parse.ts`, Composition validation in `session.ts`, Composition geometry in `placement.ts`, and DOM gesture geometry in `drag.ts`.
- A test may declare `@vitest-environment jsdom` only when its module owns a DOM seam: `paint`, `drag`, `scheme`, `indexed-db-store`, or a route.

## Production source

- Do not add explanatory comments to production source. Make the code state the rule; reserve comments for tool directives such as generated-file markers.

## Dependencies

- A new production dependency needs a stated reason in the issue that adds it. Prefer an installed library or the standard library when either already provides the needed capability.
