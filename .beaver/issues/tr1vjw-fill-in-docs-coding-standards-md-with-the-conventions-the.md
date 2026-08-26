---
id: tr1vjw
title: Fill in docs/CODING_STANDARDS.md with the conventions the code enforces
state: done
assignee: agent
priority: low
labels:
    - maintenance
depends_on:
    - f1vkwy
    - msmb41
    - dwzqq1
    - tl2tr4
created: 2026-08-26T16:35:13Z
updated: 2026-08-26T19:57:06Z
---

## Finding

`docs/CODING_STANDARDS.md` is eight lines covering dependencies only, while its own line 3 says "Reviews check diffs against this file" and "Keep each rule current, or delete it." A reviewer holding only this file can check almost nothing.

**One rule cannot be violated.** Line 8: "A new dependency is never the default answer to a small problem." Neither "default answer" nor "small problem" has a test; no diff can fail it. The first half of that line *is* checkable, and the code passes it — every dependency added since the stack landed has a stated reason on record (`jsdom` + `@napi-rs/canvas` in the `hbbrwg` verdict, `fake-indexeddb` in `ozv21y`, the production set in `px5j2g`). The exception is the shadcn cluster, tracked separately.

**Five real conventions are unwritten and, so far, unbroken:**

- **Nothing throws across a seam.** Every session writer returns `"ok" | Refuse` (`session.ts:439-453`); every store method returns a union including `"unavailable"`; `decodeImageSize` swallows and returns `null`.
- **Refusal copy lives in exactly one module** (`chrome.ts:8-33`) — never an inline string in the page.
- **Composition is replaced, never mutated** — `composition = { ...composition, ... }` at eleven sites.
- **No explanatory comments in production source.** A grep over `apps/web/src` returns only two `@vitest-environment` pragmas; the only prose comments in the repo are two dependency-coupling warnings in manifests.
- **`readonly` on every exposed collection** (`session.ts:435-438`, `catalog.ts:5,18,91`).

## Repair

Write these down, delete the unenforceable half-rule, and keep the checkable dependency rule.

## Acceptance

Every rule in the file is one a reviewer can check against a diff. The four checks pass.

## Decisions (settled 2026-08-26)

**This issue runs last in the queue.** Three of the five conventions it records are changed by issues ahead of it, and writing them first means writing them twice:

- "Nothing throws across a seam" gains `Refuse` deleted in favour of the literal `"refuse"` (`f1vkwy`).
- "Refusal copy lives in exactly one module" becomes `messages.ts`, not `chrome.ts` (`dwzqq1`).
- Composition writes go through one `commit` that also notifies (`msmb41`), which is a stronger rule than "replaced, never mutated" — record the stronger one.

**Record all five, plus three the queue establishes. Together with the retained dependency rule, the file has nine rules:**

6. **The page holds no logic.** No validator, parse rule, clamp, or geometry in `routes/index.tsx` — it composes components and holds React state. `docs/ARCHITECTURE.md` names the modules each kind of rule belongs to; this file states it as the reviewable rule.
7. **A `@vitest-environment jsdom` pragma is a claim about the module under test.** Only `paint`, `drag`, `scheme`, `indexed-db-store`, and route tests may carry one. A pragma anywhere else means the module reached for the DOM and should not have.
8. **Domain values get their own type, and one constructor.** `HexColor` is `` `#${string}` `` and `parseHex` is its only entry point (`f1vkwy`). A raw `string` reaching a domain setter is the smell this rule catches.

**Delete the unenforceable half-rule.** Line 8's "A new dependency is never the default answer to a small problem" has no test and no diff can fail it. Keep the first half — every production dependency has a stated reason — which is checkable and which the code currently passes.

**Every rule must be checkable against a diff.** That is the file's own standard at line 3. If a rule cannot be stated as something a reviewer can point at in a diff, it does not go in the file.

## Acceptance additions

- Nine rules, each phrased so a reviewer can point at a diff and say yes or no.
- No rule in the file describes a module or a convention that the queue changed.
- The dependency rule keeps its checkable half and loses the other.

## Order

Last. After `f1vkwy`, `msmb41`, `dwzqq1`, and `tl2tr4`.

## Notes

**agent** — 2026-08-26T19:24:01Z

The acceptance criteria contradict the settled rule count. “Record all five, plus three” requires the five listed conventions and three queue conventions (eight before dependencies), while the acceptance additions require exactly eight total rules and also require retaining the existing dependency rule (nine total). Options: (1) require nine rules; (2) identify which one of the eight listed conventions the dependency rule replaces; or (3) combine two conventions into one rule and specify which pair. User must decide, record the decision in a note, and remove the needs-review label.

**agent** — 2026-08-26T19:34:02Z

User decision: require nine rules. The five existing conventions plus three queue-established conventions make eight, and the retained dependency rule is the ninth.

**agent** — 2026-08-26T19:57:06Z

Completed docs/CODING_STANDARDS.md with exactly nine reviewable rules covering seam outcomes, refusal copy, Composition commits, readonly exposed collections, HexColor parsing, route boundaries, jsdom pragmas, production comments, and dependency justification. Kept the dependency rule's checkable requirement and removed the subjective small-problem wording. No test seam was added because this is documentation-only; format, lint, typecheck, and all 131 tests pass.
