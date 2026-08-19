---
id: hbbrwg
title: 'Prototype: decode a Blob and get a Canvas 2D bitmap under vp test'
state: done
priority: high
labels:
    - research
parent: erb9py
created: 2026-08-19T06:07:51Z
updated: 2026-08-19T07:19:57Z
---

## What to build

A verdict on how `vp test` decodes an image Blob and produces a Canvas 2D bitmap that can write `image/png`. Later slices call `placeScreenshot`, `uploadBackground`, `render`, and `exportPng` through that environment. Use the prototype skill. Closure waits for user review.

## Acceptance criteria

- [ ] Under `vp test`, a decodable PNG Blob of a known intrinsic size can be decoded.
- [ ] Under `vp test`, an `HTMLCanvasElement` can be created, painted, and turned into an `image/png` Blob.
- [ ] The verdict names the environment and any new dependency. No production draw library is added.

## Notes

**agent** — 2026-08-19T07:07:00Z

# Verdict

`vp test` is Vitest 4.1.10. Its default environment is `node`: Blob exists; createImageBitmap, Image, document, and HTMLCanvasElement do not. Later slices that call placeScreenshot, uploadBackground, render, or exportPng should run under `environment: "jsdom"` with two test-only dependencies — jsdom@30.0.1 and @napi-rs/canvas@1.0.6 — a small `canvas` shim so jsdom's require("canvas") gets createCanvas / Image / callback toBuffer, and a createImageBitmap polyfill that calls loadImage. No production draw library is added.

Prototype: branch `prototype/decode-blob-canvas-under-vp-test` (fbff447). Run: `vp test apps/web/src/prototype-decode-blob-canvas.test.ts` after the test-only links in `apps/web/src/PROTOTYPE-decode-blob-canvas.md`. Both acceptance probes passed there: an 8×4 PNG Blob decoded to width 8 height 4, and document.createElement("canvas") painted via drawImage then toBlob("image/png") wrote a Blob whose first eight bytes are the PNG signature.

# Findings

- vp test is Vitest. Default environment is "node". Source: vite-plus 0.2.8 docs/guide/test.md; vitest 4.1.10 dist/config.d.ts configDefaults.environment; vitest.dev/config/environment (v4.1.10).
- Node 24.18.0 under that default has Blob and File, and none of Image, HTMLCanvasElement, OffscreenCanvas, createImageBitmap, document, or window. Source: probe on this machine, Node v24.18.0.
- jsdom is an optional peer of vitest 4.1.10 and is not in this workspace. @vitest-environment jsdom fails with Cannot find package 'jsdom'. Source: vitest 4.1.10 package.json peerDependencies; probe.
- jsdom 30.0.1 (2026-07-29, older than minimumReleaseAge) gives Image, HTMLCanvasElement, document, and window. createImageBitmap and OffscreenCanvas stay missing. Without a canvas backend, Image load never fires and getContext("2d") returns null with "Not implemented: HTMLCanvasElement's getContext() method: without installing the canvas npm package". Source: jsdom README "Canvas support"; jsdom lib/jsdom/utils.js require("canvas"); HTMLCanvasElement-impl.js; probe.
- jsdom's official backend is the `canvas` package 3.x (node-canvas). This image has no cairo and no sudo. Source: jsdom README; dpkg/pkg-config on this host.
- @napi-rs/canvas@1.0.6 (2026-08-13, age-ok; 1.0.7 is too new for the 4-day rule) loads an 8×4 PNG via loadImage, paints, and toBlob/convertToBlob write image/png. Its toBuffer is sync and rejects a callback, so a shim must wrap toBuffer for jsdom's HTMLCanvasElement.toBlob. Source: npm registry times; @napi-rs/canvas 1.0.6 runtime probe; jsdom HTMLCanvasElement-impl.js toBlob → canvas.toBuffer(callback, type, options).
- With that shim registered as `canvas` next to jsdom's realpath, plus `globalThis.createImageBitmap = (blob) => loadImage(Buffer.from(await blob.arrayBuffer()))`, vp test decoded the 8×4 Blob and exported a PNG from an HTMLCanvasElement. Image + blob: URL still timed out (jsdom resource loader). drawImage of the polyfilled bitmap onto the jsdom canvas succeeded. Source: prototype tests on this branch.
- Vitest browser mode (vite-plus/test/browser-playwright, peer @vitest/browser-playwright@4.1.10 + playwright) is the native-API alternative (real createImageBitmap, no shim). Chromium launched and died: missing libglib-2.0.so.0. No sudo to install Playwright OS deps. Source: vitest v4.1.10 docs/guide/browser/index.md; vite-plus package.json peerDependencies; probe launch log.

# Unresolved

- Whether later slices add the jsdom path to apps/web (or the workspace root) as real devDependencies, or wait for a machine that can run Playwright. This prototype did not change package.json on main.
- Whether production createImageBitmap should keep a Node fallback. The polyfill is test-only; the browser already has the API.

# User

Close this issue to approve the verdict. Or note requested changes and remove the needs-review label.

**agent** — 2026-08-19T07:19:52Z

Approved: later decode/draw slices use environment jsdom with test-only jsdom@30.0.1 and @napi-rs/canvas@1.0.6, a canvas shim, and a test-only createImageBitmap polyfill. No production draw library.
