## Checks

While you work, run the check that your change touches. Before you end a session that changed code, run all of the checks. Each one must pass:

- Format: `vp fmt --check`
- Lint: `vp lint`
- Typecheck: `vp check --no-fmt --no-lint`
- Test: `vp test`

Run the app locally: `pnpm dev`

## Project docs & tracker

### Domain glossary

`docs/GLOSSARY.md` — the project's terms. Use its vocabulary in code, tests, specs, and issues. The format rules are at the top of the file.

### Coding standards

`docs/CODING_STANDARDS.md` — the conventions beyond the linter. Reviews check diffs against this file.

### Architecture & decisions

`docs/ARCHITECTURE.md` — the modules and the seams. `docs/adr/` — decisions already made (the format is in `docs/adr/README.md`). Do not debate them again.

### Issue tracker

`docs/TRACKER.md` — how to use this project's issue tracker.
