---
id: i57ovz
title: Delete the decoy schemeClass and test the boot script that ships
state: todo
priority: high
labels:
    - maintenance
depends_on:
    - 4cagyi
created: 2026-08-26T16:30:30Z
updated: 2026-08-26T17:40:35Z
---

## Finding

`apps/web/src/chrome.ts:153` exports `schemeClass`, and `chrome.test.ts:23-33` spends three of the suite's 101 tests on it. It has **no production caller**. The code that actually decides the Studio's colour scheme is a hand-copied duplicate of its body inside the `schemeBootScript` template string at `chrome.ts:158-160`, injected raw via `dangerouslySetInnerHTML` at `routes/__root.tsx:27`.

So the tested copy is not the shipped copy. The shipped copy is untyped, unlinted, and untested. A typo, a rename, or a divergence between the two ships a broken first-paint theme with all three tests still green. Four audit dimensions flagged this independently; it is the clearest "test wearing a costume" in the repo.

## Repair

Pick one, not both:

- (a) Delete the TypeScript `schemeClass` and its three tests, and test `schemeBootScript` by evaluating it in jsdom with `matchMedia` stubbed.
- (b) Generate the boot script from the function so one definition serves both.

(a) is the smaller change and makes the tested artifact the shipped artifact.

## Acceptance

- Exactly one definition of the light/dark rule exists.
- A test fails if the shipped boot script stops setting `dark` on `html` for `prefers-color-scheme: dark`, and if it sets it for `light` or `no-preference`.
- The `change` listener re-applying mid-session is covered.
- The four checks pass.

## Decision (settled 2026-08-26)

**Take option (a).** Delete the TypeScript `schemeClass` and its three tests. Keep `schemeBootScript` as the single definition, and test it by evaluating it in jsdom with `matchMedia` stubbed.

(b) — generating the script from the function — keeps two artifacts and a generator between them, to guard code that is nine lines long. (a) makes the tested artifact the shipped artifact, which is the whole point of the finding.

## Where it lands

Create `apps/web/src/scheme.ts` holding `schemeBootScript` and the `change` listener wiring, per the target layout in `docs/ARCHITECTURE.md`. `routes/__root.tsx:27` imports from there. Remove both names from `chrome.ts` — `dwzqq1` splits and deletes that file next, and it expects the scheme code already gone.

Add `scheme.ts` to the list of modules permitted to touch browser globals, and flip its row from target to current in `docs/ARCHITECTURE.md`.

## Order

Runs after `4cagyi` and before `dwzqq1`.
