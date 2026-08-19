# Architecture

The modules of this system, and the seams between them. Update this file when the shape changes. Audits compare it with reality.

## apps/web

The Studio. A TanStack Start SPA on carbon-fiber's Vite+ workspace. Composition, draw, and Export live here — not in a workspace package.

`createSession` is the public seam. It opens one in-memory session on a fresh default Composition. IndexedDB sits behind the `UploadedBackgroundStore` port the session is created with. `createIndexedDbStore` is the production adapter: one object store, the Blob on the record.
