---
id: m8b0jw
title: Distinguish upload refusals and expose session storage
state: done
assignee: agent
priority: high
parent: 3toux4
created: 2026-08-19T19:38:30Z
updated: 2026-08-19T20:05:10Z
---

## What to build

Upload of a Background image tells the Studio why it failed. The session no longer collapses every failure to a single refuse. It also says whether storage is usable, so Add can stay disabled when it is not.

```ts
type UploadRefuse = "undecodable" | "quota" | "unavailable"

type StudioSession = {
  readonly storage: "ok" | "unavailable"
  uploadBackground(
    file: Blob,
    filename: string,
  ): Promise<UploadedBackground | UploadRefuse>
  // all other members unchanged
}
```

`storage` is `"unavailable"` when `createSession` could not list the store, and after an upload or remove that sees the store unavailable. `"quota"` does not flip `storage`. Decode failure is `"undecodable"` and does not write the store.

## Acceptance criteria

- [ ] `uploadBackground` of an undecodable Blob or a `0×0` image returns `"undecodable"`, stores nothing, and leaves `composition.background` unchanged.
- [ ] `uploadBackground` when the store `put` returns `"quota"` returns `"quota"`, stores nothing, and leaves already-stored records in place. `storage` stays `"ok"`.
- [ ] `uploadBackground` when the store `put` returns `"unavailable"` returns `"unavailable"` and `storage` becomes `"unavailable"`.
- [ ] When `createSession` could not list the store, `storage` is `"unavailable"` and `uploadBackground` returns `"unavailable"`.
- [ ] After a `removeBackground` whose store `remove` is `"unavailable"`, `storage` is `"unavailable"`.
- [ ] A successful upload still returns the record. `storage` is `"ok"` when the store listed and later puts succeed.

## Notes

**agent** — 2026-08-19T20:05:10Z

Completed at the session seam named by the spec.

uploadBackground now returns UploadRefuse ("undecodable" | "quota" | "unavailable") instead of collapsing to "refuse". StudioSession.storage is "ok" | "unavailable": "unavailable" after a failed list, and after a put or remove that sees the store unavailable. quota does not flip storage. Decode failure returns "undecodable" and does not write the store. removeBackground still returns "ok" | "refuse".

IndexedDB adapter tests now expect the distinguished refuse strings so they follow the same contract.

No new decisions. Existing storeUnavailable short-circuit on upload now returns "unavailable" via the live storage flag.
