---
id: rdenqt
title: 'Guardrail wiring: hooks do not survive a clone, nothing runs tests before main'
state: in-progress
priority: medium
labels:
    - maintenance
depends_on:
    - y21uby
created: 2026-08-26T16:34:42Z
updated: 2026-08-26T19:20:53Z
---

## Finding

**The pre-commit hook does not survive a clone.** `.vite-hooks/_/.gitignore` contains `*`, so the dispatcher directory is untracked — `git ls-files .vite-hooks` returns only `.vite-hooks/pre-commit`. `core.hooksPath = .vite-hooks/_` is set **local only**, living in `.git/config`, which no clone carries. `package.json` has no `prepare` script, so `pnpm install` never re-installs it. Net: `git clone && pnpm install` gives a repo with the hook script present and the wiring absent. (It does work in this checkout.)

**Nothing runs the test suite before code reaches main.** `vite.config.ts:4-6` `staged: { "*": "vp check --fix" }` runs check but not `vp test`. `.vite-hooks/_/h:5` reads `[ ! -f "$s" ] && exit 0`, so a missing hook script exits 0 silently — `sh .vite-hooks/_/pre-push` is a no-op. And with 29 commits, 0 merges, and a single contributor, nothing has ever gone through a PR, so the workflow's `pull_request` trigger has never fired; only `push: [main]`, which runs *after* the push.

**The sandbox deny lists have drifted.** Commit `3d01ff0` says it added the rootful podman socket to "both files" — it landed in `.pi/sandbox.json` and `.pi/extensions/pi-permission-system/config.json`, but `.claude/settings.json` was left behind. Diffing the sorted `denyRead` lists shows `/run/podman/podman.sock` present in the pi pair and absent from the claude one. Three hand-maintained lists that must agree, with nothing checking that they do.

**The check sequence is written four times.** `AGENTS.md:5-8` (four commands), `README.md` Commands (three), `package.json:11` `"ci"` (three, and **CI does not use it**), and `.github/workflows/ci.yml` (three inline `pnpm` steps). They agree in effect today — `vp check` = fmt + lint + typecheck, verified — but each can rot alone.

## Repair

- Add `"prepare": "vp hooks install"` to root `package.json` (`vp hooks` exists for this).
- Add `.vite-hooks/pre-push` containing `vp test` — 0.8s of check at commit, ~6s of test at push.
- Make the workflow run `pnpm ci` so the sequence has one definition, and point AGENTS.md and README at that script.
- Either generate the three deny lists from one source or add a check that diffs them.

## Note

CI is otherwise well built: actions pinned by SHA, `permissions: contents: read`, `persist-credentials: false`, `timeout-minutes: 15`, `node-version-file`, `--frozen-lockfile`. No engine drift — `.node-version`, `engines`, `packageManager`, and the installed toolchain all agree.

## Acceptance

A fresh clone plus install has working hooks. A red test suite cannot be pushed to main. The four checks pass.

## Decisions (settled 2026-08-26)

**Correction: `vp hooks install` does not work.** `vp --help` lists a `hooks` command, but `vp hooks` on this toolchain (`vp v0.2.9`) fails with `error: Command 'hooks' not found`. `vp config` is the documented hook installer. It could not be tested: the audit ran in a sandbox that bind-mounts `/dev/null` over `.git/config.lock`, so every write to `.git/config` fails with `could not lock config file .git/config: File exists`. That is the sandbox, not the toolchain — `vp config` may work perfectly in a normal shell. `vite-plus` is installed locally (`node_modules/vite-plus`), so the missing `hooks` subcommand is not a missing-install problem.

So do not put an unverified `vp` subcommand in `prepare`. **Use the plain git command:**

```json
"prepare": "git config core.hooksPath .vite-hooks/_"
```

It is one line, it has no toolchain dependency, and it is exactly what the missing local config does. Try `vp config` first in a normal shell; if it works, prefer it and say so in the closing note. The criterion is a working hook after a clone, not a particular command.

**Note that `.vite-hooks/_/` was regenerated on 2026-08-26**, so something in the local toolchain does reinstall the dispatcher. That does not change the finding: the directory is `*`-gitignored and `core.hooksPath` is local-only, so a fresh clone still gets nothing.

**The deny-list drift gets a test, not a generator.** Three hand-maintained lists must agree — `.claude/settings.json`, `.pi/sandbox.json`, `.pi/extensions/pi-permission-system/config.json` — and commit `3d01ff0` already drifted them (`/run/podman/podman.sock` is in the pi pair, absent from the claude one). A generator means a build step and a source of truth to maintain. A test means the existing suite catches it:

- Add a test that reads all three files and asserts the sorted `denyRead` lists are equal, naming the differing entries on failure.
- Fix the current drift in the same change.

**CI consolidates onto `pnpm ci`.** `.github/workflows/ci.yml` runs `pnpm check`, `pnpm test`, `pnpm build` inline while `package.json:11` defines `"ci": "vp check && vp test && vp run -r build"` — the same sequence, twice. Replace the three steps with one `pnpm ci` step, and point `AGENTS.md` and the README Commands section at that script so the sequence has one definition. Keep the four individual commands listed in `AGENTS.md` — a session needs to run them one at a time — but say that `pnpm ci` is the sequence CI runs.

**`.vite-hooks/pre-push` contains `vp test`.** The dispatcher at `.vite-hooks/_/pre-push` already exists and exits 0 when the script is missing, so this is one new file.

## Acceptance — what this session verifies

- `.vite-hooks/pre-push` exists and contains `vp test`.
- A test fails when the three deny lists disagree, and the current `/run/podman/podman.sock` drift is fixed.
- `.github/workflows/ci.yml` runs `pnpm ci` and nothing else, and `pnpm ci` still carries the `--coverage` flag `y21uby` added to the test step.
- `AGENTS.md` and the README point at `pnpm ci` for the sequence, while `AGENTS.md` keeps listing the four commands individually.
- The four checks pass.

## Acceptance — what the user verifies, once

**This issue does not close itself.** A sandboxed session cannot write `.git/config`, so it cannot clear `core.hooksPath`, reinstall, and watch the hook fire — the one criterion that actually proves the fix. Make the change, then end with a note naming these two steps, apply `needs-review`, release the claim, and stop:

1. `git config --unset core.hooksPath && pnpm install` — the pre-commit hook fires again.
2. A commit with a failing test is rejected by `git push`.

Do not claim either one passed on the strength of reading the script.

## Order

Runs after `y21uby`, so this issue is the last thing to touch `.github/workflows/ci.yml` and the consolidation lands on top of the coverage flag rather than under it.

## Notes

**agent** — 2026-08-26T19:20:53Z

Blocked by y21uby, which is still in progress. Complete and close y21uby before implementing this issue so the CI consolidation lands on top of its coverage change.
