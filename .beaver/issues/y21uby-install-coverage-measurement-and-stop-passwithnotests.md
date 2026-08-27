---
id: y21uby
title: Install coverage measurement and stop passWithNoTests masking discovery breakage
state: done
assignee: agent
priority: medium
labels:
    - maintenance
depends_on:
    - aofakr
    - dza8bk
    - el94on
    - yju1dp
    - f1vkwy
    - t5q19d
created: 2026-08-26T16:32:53Z
updated: 2026-08-27T02:51:25Z
---

## Finding

Two guardrails around the test suite are missing, and together they let coverage fall silently.

**No coverage measurement exists.** `vp test --coverage` fails with `MISSING DEPENDENCY  Cannot find dependency '@vitest/coverage-v8'`. The intent is visible — `.gitignore` reserves `coverage/` and `vite.config.ts:18` ignores `**/coverage/**` in lint — but the provider was never installed and no `test.coverage` block or threshold exists.

Untested by line count: `routes/index.tsx` 1234, `routes/__root.tsx` 40, `router.tsx` 16, `lib/utils.ts` 6 = **1296 lines**. Tested: `session.ts` 672, `chrome.ts` 172, `indexed-db-store.ts` 125, `catalog.ts` 99 = 1068. Excluding generated `routeTree.gen.ts`, that is 1296 of 2364 source lines with no test and nothing reporting the fact.

**`vp test` goes green on zero tests.** `vite.config.ts:34` sets `passWithNoTests: true`. Demonstrated: `vp test zzz-no-such-file` exits 0 with "No test files found". If the include glob or a rename stops matching, CI stays green. The flag is presumably there for the empty `packages/` (only `.gitkeep`); `pnpm-workspace.yaml` also globs `tools/*`, which does not exist at all.

Discovery is currently correct — 4 test files on disk, 4 reported, 101 tests matching the per-file counts — so this is a trap, not a live failure.

## Repair

- `pnpm add -Dw @vitest/coverage-v8`, add `test.coverage.thresholds` to `vite.config.ts`, and add `--coverage` to the CI test step so the number cannot fall unnoticed.
- Scope or drop `passWithNoTests`: set it only on workspace projects that legitimately have no tests, or delete the empty `packages/`/`tools/` globs and remove the flag.

A coverage floor is also the only mechanically enforceable form of the "no pure logic in the page" rule — an import-layer rule cannot express it, but a floor on `routes/index.tsx` forces extraction.

## Acceptance

- `vp test --coverage` runs and reports.
- A threshold is set at or slightly below today's real number, so it ratchets rather than blocks.
- Deleting a materially covering test file makes CI fail by crossing a coverage floor.
- The four checks pass.

## Decisions (settled 2026-08-26)

**The threshold is measured, not chosen.** A number written into this issue today would be wrong by the time the queue reaches it — six issues ahead of it move code and add tests. So the rule, not the number:

1. Install `@vitest/coverage-v8` at the workspace root and run `vp test --coverage`.
2. Read the four global numbers (lines, statements, functions, branches).
3. Set `test.coverage.thresholds` to each measured number **minus 2, rounded down to a whole percent**. A floor that ratchets, not a gate that blocks.
4. Record the measured numbers in the closing note, so the next audit can see whether the floor moved.

Do **not** set a per-file threshold on `routes/index.tsx` in this issue. The page's coverage is a consequence of `mqab43`, `msmb41`, and `yju1dp`, all of which run first; adding a second lever on the same number invites two thresholds that disagree.

**`passWithNoTests`: delete the flag.** It was presumably added for the empty `packages/`, which holds only a `.gitkeep` and stays empty by decision (`0abxd5`). Also delete the `tools/*` glob from `pnpm-workspace.yaml` — that directory does not exist at all. With no member project legitimately lacking tests, the flag has nothing left to serve and only hides discovery breakage.

**CI runs coverage.** Add `--coverage` to the test step so the floor is enforced where it matters. Today `.github/workflows/ci.yml` runs `pnpm check`, `pnpm test`, `pnpm build` inline, and `package.json` defines `"ci"` as the same sequence. Put `--coverage` in **both** — the workflow step and the `ci` script — so it survives whichever one wins. `rdenqt` runs after this and consolidates the workflow onto `pnpm ci`; it is told to preserve the flag.

## Acceptance additions

- `vp test --coverage` runs and reports four global numbers.
- `vp test zzz-no-such-file` exits **non-zero** — this is the check that `passWithNoTests` is really gone.
- Deleting a materially covering test file (one whose removal crosses a configured global floor) makes the threshold fail. Coverage is not required to detect deletion of every test file; `passWithNoTests: false` guards against total discovery failure.
- The measured numbers are in the closing note.

## Order

Runs near the end, after `aofakr`, `dza8bk`, `el94on`, `yju1dp`, `f1vkwy`, and `t5q19d` — every issue that changes the number the floor is measured against. `rdenqt` runs after this, not before: it ends in `needs-review` by design, and blocking this issue behind it would strand the coverage floor.

## Notes

**agent** — 2026-08-26T19:16:48Z

Test seams selected from the acceptance criteria: the  CLI boundary for coverage reporting and thresholds, and 
 RUN  v4.1.10 /home/stefan/Code/personal/better-screenshots

No test files found, exiting with code 0 for test-discovery failure. CI command wiring is verified through the workflow and root script plus the full checks.

**agent** — 2026-08-26T19:20:06Z

Implementation uncovered a contradiction in the acceptance criteria. With the mandated global floors (measured 95.88% statements, 92.46% branches, 96.9% functions, 96% lines; prescribed floors 93/90/94/94), deleting 9 of the 12 test files still lets coverage pass; only drag.test.ts, paint.test.ts, and session.test.ts cross a floor. Options: (1) keep the measured-minus-two rule and weaken acceptance to require that deleting a materially covering test file fails; (2) add a separate minimum test-file/discovery manifest guard so deleting any test file fails; or (3) choose tighter or per-file coverage thresholds, reversing the settled threshold constraints. Decide which guard is intended, record the decision in a note, and remove needs-review.

**agent** — 2026-08-26T19:34:02Z

User decision: keep the measured-minus-two global coverage floors and weaken the deletion criterion. Coverage must fail when a materially covering test file is deleted; it does not need to detect deletion of every test file. The existing passWithNoTests: false requirement remains the guard against total test-discovery failure.

**agent** — 2026-08-26T19:37:44Z

Completed coverage enforcement. Installed @vitest/coverage-v8 pinned to 4.1.10 to match Vite+'s bundled Vitest, configured global floors, removed passWithNoTests, removed the nonexistent tools/* workspace glob, and enabled coverage in both CI command paths. Measured baseline: statements 95.88%, branches 92.46%, functions 96.9%, lines 96%; prescribed floors are 93%, 90%, 94%, and 94% respectively. Verified vp test zzz-no-such-file exits 1 and removing session.test.ts makes all four coverage thresholds fail. Format, lint, typecheck, and all 131 tests pass.

**claude** — 2026-08-27T02:51:25Z

Coverage enforcement removed by user decision (2026-08-26). The floors were measuring the wrong denominator: Vitest v4 only counts files a test loads, so routes/index.tsx (1059 lines), routes/__root.tsx, router.tsx and lib/utils.ts were absent from the report entirely. The measured 95.88% described the ~460 statements that were already tested, and the floor could never fall as the page grew — the opposite of this issue's stated intent ('a floor on routes/index.tsx forces extraction'). Removed test.coverage.thresholds, --coverage from the ci script and the CI workflow, and the @vitest/coverage-v8 devDependency. passWithNoTests stays deleted, so total test-discovery failure is still caught. User's position: coverage is not a metric they want to optimise for.
