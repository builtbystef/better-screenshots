---
id: msmb41
title: Give StudioSession change notification and delete the bump() protocol
state: done
assignee: agent
priority: medium
labels:
    - maintenance
depends_on:
    - mqab43
created: 2026-08-26T16:31:56Z
updated: 2026-08-26T18:40:05Z
---

## Finding

`createSession` returns a mutable object behind getters and emits nothing when it changes. React cannot observe it, so `routes/index.tsx:50-51` invents a `revision` counter and `bump()`, threads `onChange: () => void` through five components, and every successful write must remember to call it — at roughly 15 call sites (`index.tsx:185, 367, 522, 530, 559, 564, 784, 838, 857, 885, 899, 909, 928, 934, 997`).

The obligation is already applied inconsistently:

- `index.tsx:783-784` — `setPosition` result discarded, `onChange()` fired unconditionally
- `index.tsx:856-857` — `setUrl` result discarded
- `index.tsx:562-565` — `removeBackground` result discarded entirely; `onChange()` fires even on refusal
- everywhere else — `if (session.setX(...) === "ok") { onChange(); }`

Forgetting the pairing at a new call site produces a silently stale preview: no type error, no test failure, and the page is not a test seam.

## Repair

Give the session a version counter or `subscribe(listener)` and drive React with `useSyncExternalStore`. The `onChange` prop leaves five component signatures and the ~15 call sites collapse into the 12 places inside `createSession` that already assign `composition = { ... }`.

## Acceptance

- No `revision`/`bump` counter in the route.
- Adding a new session writer cannot produce a stale preview by omission.
- The three call sites that currently discard results either check them or document why not.
- The four checks pass.

## Decision (settled 2026-08-26)

**Both, in the one shape `useSyncExternalStore` wants.** The issue offered "a version counter or `subscribe(listener)`" — React needs both halves:

```ts
interface StudioSession {
  subscribe(listener: () => void): () => void;  // returns the unsubscribe
  readonly version: number;                     // the snapshot
  // …the existing getters and writers
}
```

The page becomes `useSyncExternalStore(session.subscribe, () => session.version)`. `subscribe` must be a stable reference — bind it once in `createSession`, never recreate it per call — or React resubscribes on every render.

**One place bumps the version.** The twelve sites inside `createSession` that assign `composition = { ... }` are the only writers, so route them through a single private `commit(next: Composition)` that assigns and notifies. A writer that forgets to call `commit` is then the only way to produce a stale preview, and it is one function away instead of fifteen call sites away.

**Non-composition state notifies too.** `storage` downgrades and the uploaded-background list are session state the page renders; they must notify as well, or removing a Background leaves a stale thumbnail list. Give them the same `commit` path.

**The three discarding call sites get checked, not documented.** `index.tsx:783-784`, `:856-857`, and `:562-565` currently discard the writer's result and fire `onChange` unconditionally — `:562-565` fires it even on refusal. Once the session notifies itself, `onChange` disappears and those become plain calls; check each result and surface the refusal through the existing refusal-copy path in `messages.ts`. Do not leave a discarded `"refuse"` behind a comment.

## Acceptance additions

- `subscribe` is referentially stable across renders.
- No `revision` state and no `bump` function in `routes/index.tsx`; the `onChange` prop is gone from all five component signatures.
- A session test asserts that a subscriber fires once per successful write and **not at all** on a refusal.
- A session test asserts the unsubscribe stops delivery.
- The three previously discarding sites check their result.

## Order

Runs after `mqab43`. `yju1dp` rewrites the same rows and runs after this — taking the `onChange` prop out first means `yju1dp` rewrites each row once, not twice.

## Notes

**agent** — 2026-08-26T18:34:38Z

Testing seams: StudioSession public interface for subscription delivery and unsubscribe behavior; route compile/type checks for useSyncExternalStore integration and refusal handling.

**agent** — 2026-08-26T18:40:05Z

Completed: StudioSession now exposes a stable subscribe function and numeric version, and every Composition, uploaded-Background, and storage-state change notifies through one commit path. Studio uses useSyncExternalStore; route revision/bump and Inspector onChange plumbing are removed. The drag Position, URL, and Background removal outcomes now flow through refusal copy. Added subscriber delivery, refusal, unsubscribe, stability, and copy tests. Verified format, lint, typecheck, and all 111 tests.
