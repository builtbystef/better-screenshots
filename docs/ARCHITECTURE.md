# Architecture

The modules of this system, and the seams between them. Update this file when the shape changes. Audits compare it with reality.

## apps/web

The Studio. A TanStack Start SPA on carbon-fiber's Vite+ workspace. Composition, draw, and Export live here — not in a workspace package.

`createSession` is the public seam. It opens one in-memory session on a fresh default Composition. IndexedDB sits behind the `UploadedBackgroundStore` port the session is created with. `createIndexedDbStore` is the production adapter: one object store, the Blob on the record.

`schemeClass` is the chrome seam: OS `prefers-color-scheme` to class `dark` on `html`. The document shell applies it before first paint and keeps the media query live. `placeLine`, `isFileDrag`, and `isTextFieldTarget` are the place-chrome rules. `exportLine` is the Export-chrome rule. `parseHex`, `matchingSolid`, `matchingGradient`, and `uploadLine` are the Background chrome rules. `parseInteger`, `parseScale`, `parseOpacityPercent`, `positionFromDrag`, and `clampPosition` are the placement and Effects chrome rules. `clampPosition` keeps the Screenshot center inside the Composition frame. `matchingAspectPreset` is the Frame chrome rule. The Catalog is the built-in solids, gradients, and Aspect presets the Inspector chips write. A Browser window is a Composition field the session paints into the same bitmap as Preview and Export. The page is not a test seam.
