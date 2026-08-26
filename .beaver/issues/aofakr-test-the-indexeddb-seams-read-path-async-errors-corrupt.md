---
id: aofakr
title: 'Test the IndexedDB seams: read path, async errors, corrupt image'
state: todo
priority: medium
labels:
    - maintenance
depends_on:
    - v4l2o5
created: 2026-08-26T16:32:24Z
updated: 2026-08-26T17:40:35Z
---

## Finding

Narrowed from the original nine-seam issue. The paint seams moved to `dza8bk` and the pure seams to `el94on`; three IndexedDB seams stay here because they share one prerequisite — a store you can inject failures into.

**The read path is never called.** `indexed-db-store.ts:34` `get()` is called by no test. The one test that renders an image Background (`session.test.ts:877`) uses the in-memory double, so the promise of `ozv21y` — uploaded Backgrounds survive a refresh — is only half-tested: the record survives, but the Blob is never proven to come back in a form `createImageBitmap` accepts.
*Assert:* upload against the real store, open a second session, set the image Background, render, and check the cover-centre pixel.

**The async error paths never fire.** `indexed-db-store.test.ts:97` makes `put()` throw *synchronously*, hitting the `try/catch` at line 104. `request.onerror` (`:112`), `tx.onabort` (`:118`), and `tx.onerror` (`:121`) never run. Real browsers report quota **asynchronously**, so `isQuotaExceeded` (`:62`) is never applied to an error delivered the way a browser delivers it. The test named "refuses when the store hits quota" does not cover the production quota path.
*Assert:* fire `onerror`/`onabort` with a `QuotaExceededError` and expect `"quota"`; a non-quota abort yields `"unavailable"`.

**A corrupt stored image has no test.** `session.test.ts:941` covers a missing record and an unavailable store, but not a record whose Blob fails to decode — the realistic case. The fallback matters because the alternative is a transparent Composition that then gets exported.

## Prerequisite, settled here

`indexed-db-store.test.ts:89-105` monkeypatches `IDBObjectStore.prototype.put` and `.delete` to inject failures, because no seam exists for it. Prototype surgery cannot deliver an async `onerror`, which is why the async paths are untested.

**Take the factory as a parameter:** `createIndexedDbStore(factory: IDBFactory = globalThis.indexedDB)`. Production callers are unchanged; the tests pass a stub that settles requests however they need. Delete the prototype patching in the same change. This was listed in `t5q19d` and belongs here — it is the enabling change, not a cleanup.

## Also settled here

`openDatabase` (`indexed-db-store.ts:66`) handles `success` and `error` only, with no `onblocked`. A blocked open never settles, `createSession`'s `await store.list()` never resolves, and `HomePage` returns `null` forever — a blank page with no error path. Unreachable at `DB_VERSION = 1`, and a landmine on the first schema bump. Add the handler: a blocked open resolves to `"unavailable"`, like every other failure this module reports.

## Acceptance

- `createIndexedDbStore` takes an `IDBFactory` parameter defaulting to `globalThis.indexedDB`; no test patches a vendor prototype.
- `get()` has a test that fails if it stops returning a decodable Blob.
- An asynchronous `QuotaExceededError` yields `"quota"`; an asynchronous non-quota abort yields `"unavailable"`.
- A stored record whose Blob does not decode produces a refusal, not a transparent Composition.
- A blocked open resolves to `"unavailable"` and has a test.
- The four checks pass.
