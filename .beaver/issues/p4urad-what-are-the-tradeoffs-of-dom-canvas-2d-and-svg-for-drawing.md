---
id: p4urad
title: What are the tradeoffs of DOM, Canvas 2D, and SVG for drawing a composition and writing an Export?
state: done
assignee: agent
priority: high
labels:
    - roadmap:pfdjl3
    - session:research
parent: pfdjl3
created: 2026-08-18T22:57:36Z
updated: 2026-08-18T23:15:18Z
---

Research session. The studio is browser-only. The preview the user sees must be honest about the Export they download. Effects named so far: shadow, border, rounded corners. Manipulations named so far: position, scale, padding, framing.

Compare DOM (plus a snapshot library), Canvas 2D, and SVG as the way to draw a composition and write an Export:

- Fidelity of shadows, rounded clips, and image scaling.
- Preview-versus-Export match.
- Memory and speed with large PNGs.
- How an uploaded screenshot becomes pixels (object URL, ImageBitmap, and tainted-canvas rules).
- Export formats that fall out of each approach (PNG, JPEG, WebP) and whether 2x / retina is free or extra work.
- License and supply-chain cost of any library the approach needs.

Comparable in-browser screenshot studios may be cited for how they draw, not for product scope. Do not copy Media Canvas (SVG design documents + a Chromium worker) — that product is out of scope here.

Deliverable: a comparison an implementer can pick from, with citations. Do not pick the approach in this node.

## Notes

**agent** — 2026-08-18T23:15:18Z

# Question

What are the tradeoffs of DOM, Canvas 2D, and SVG for drawing a composition and writing an Export? Sub-questions: (1) fidelity of shadows, rounded clips, and image scaling, and whether preview matches Export; (2) how an uploaded Screenshot becomes pixels, and how origin-clean / taint affects Export; (3) which formats and 1x/2x scale paths exist; (4) library license / supply-chain cost, and large-PNG memory and speed.

This note compares. It does not pick an approach.

# Answer

Three paths, none free.

**DOM + a snapshot library.** The live preview is native CSS: `box-shadow` follows `border-radius` and has a spread radius. Export is not a screenshot of that preview. html2canvas rebuilds the tree from the CSS it implements and lists `box-shadow` and `object-fit` as unsupported — preview will not match Export for this product's named Effects. html-to-image (and screenshot.rocks' `dom-to-image`) clone the node into an SVG `<foreignObject>` and rasterize via canvas; closer to native paint, but clone/embed/data-URI/`foreignObject` limits apply, and raster Export still needs an origin-clean canvas. Adds an MIT library.

**Canvas 2D.** One bitmap for preview and Export (`toBlob`). Shadows, rounded clips, and scaling are platform APIs (`shadow*`, `roundRect`+`clip`, `drawImage` + `imageSmoothingQuality`). Canvas shadows have no spread. A single `drawImage` is subject to both the shadow attributes and the clipping region — a rounded clip will cut the drop shadow unless the shadow is drawn in a separate unclipped pass. No library. User `File` → `createImageBitmap` → `drawImage` stays origin-clean.

**SVG.** Live `<image>` + `clipPath` + `feDropShadow` for preview. Raster Export still goes through canvas (`drawImage` of the SVG, then `toBlob`). SVG used as an image cannot load external resources, so `blob:` hrefs must be inlined as `data:` URLs before that draw. A vector SVG download is possible; it is not a PNG/JPEG/WebP Export. No library. `feDropShadow` also has no spread.

2x / retina is extra work on every raster path: size the bitmap to CSS size × scale, then serialize. PNG is the guaranteed type; JPEG and WebP are requested types that fall back to PNG if unsupported.

Taint is not a problem for user-uploaded Screenshots (`blob:` URLs and `File`/`Blob` ImageBitmaps are same-origin). It becomes a problem if remote Background images are drawn without CORS.

# Findings

## 1. Fidelity and preview–Export match

**DOM preview (CSS).** `box-shadow` takes offset, blur, optional spread, optional `inset`, and a comma-separated list. If `border-radius` is set on the same element, the shadow takes the same rounded corners. (MDN `box-shadow`, last modified 23 May 2026; CSS Backgrounds and Borders Module Level 3.)

**html2canvas (rebuild).** The library "does not make an actual screenshot, but builds a representation of it based on the properties it reads from the DOM" and "is only able to render correctly properties that it understands". (html2canvas `docs/documentation.md`.) Its unsupported list includes `box-shadow`, `filter`, and `object-fit`. `border-radius` is listed as supported. (`docs/features.md`, mirrored at html2canvas.hertzen.com/features.) `foreignObjectRendering` defaults to `false`; `scale` defaults to `window.devicePixelRatio`. (html2canvas configuration.)

**html-to-image (foreignObject).** Version 1.11.13. Pipeline: recursively clone the node; copy computed styles and recreate pseudo-elements; embed fonts and images as data URLs; serialize; wrap in SVG `<foreignObject>`; for PNG/JPEG/pixels, draw that SVG onto an off-screen canvas. (README "How it works"; `src/index.ts` `toSvg` / `toCanvas`.) Requires SVG `<foreignObject>` (IE will never be supported). "Rendering will failed on huge DOM due to the dataURI limit." A tainted `<canvas>` inside the cloned tree fails. (README "Browsers", "Things to watch out for".) `<foreignObject>` is the SVG element that embeds HTML/XHTML. (MDN `foreignObject`, 6 Jun 2025; SVG 2.)

**Canvas 2D shadows.** Four attributes: `shadowOffsetX`, `shadowOffsetY`, `shadowBlur`, `shadowColor`. "All drawing operations on an object which implements the `CanvasShadowStyles` interface are affected by the four global shadow attributes." Shadows are only drawn if the shadow color's alpha is nonzero and either blur or an offset is nonzero. `shadowBlur` is a non-negative float, not a pixel count, and is not affected by the current transform. There is no spread-radius attribute. (HTML Living Standard, last updated 18 Aug 2026, §4.12.5.1.19 Shadows and the `CanvasShadowStyles` IDL; MDN `shadowBlur`, 25 Sep 2025.) Contrast CSS `box-shadow`'s fourth length (spread). (MDN `box-shadow`.)

**Canvas 2D rounded clips and scaling.** `roundRect(x, y, width, height, radii)` adds a rounded-rect path; radii work like CSS `border-radius` when width and height are positive. Combine with `clip()`. `clip()` replaces the clipping region with the intersection of the current region and the path; the initial region is the infinite surface. (MDN `roundRect`, 17 Dec 2025; MDN `clip`, 1 Jan 2026; HTML LS.) `drawImage` can scale via `dWidth`/`dHeight`. "Images are painted without affecting the current path, and are subject to shadow effects, global alpha, the clipping region, and the current compositing and blending operator." If the image is not origin-clean, the context's origin-clean flag is set to false. (HTML LS §4.12.5.1.15; MDN `drawImage`, 25 Sep 2025.) `imageSmoothingEnabled` defaults true; when true the UA should apply a smoothing algorithm to scaled images. `imageSmoothingQuality` is a preference (`low` / `medium` / `high`), default `low`. The spec does not mandate the algorithm. (HTML LS §4.12.5.1.18; MDN `imageSmoothingQuality`, 25 Sep 2025.)

**SVG shadows, clips, images.** `feDropShadow` takes `dx`/`dy` (default 2), `stdDeviation` (default 2), `flood-color`, `flood-opacity`. No spread. (MDN `feDropShadow`, 28 Oct 2025; Filter Effects Module Level 1.) `clipPath` + `clip-path` clips rendering, not the element's geometry. (MDN `clipPath`, 7 Nov 2025; CSS Masking Module Level 1.) SVG can be used as an image (`<img>`, CSS `background-image`, `drawImage`). In that image context, external resources cannot be loaded; they must be inlined as `data:` URLs. Those restrictions do not apply to live inline SVG in the page. (MDN "SVG as an image", 13 May 2025.)

**Preview vs Export.** A Canvas preview that is the same bitmap later passed to `toBlob` matches by construction (HTML LS serializing bitmaps). A DOM preview plus html2canvas does not: the library says so. A DOM preview plus html-to-image paints a clone inside `foreignObject`, then draws that SVG onto a new canvas — not the live preview pixels. An SVG preview plus raster Export must inline every Screenshot before `drawImage`, or the image-context restrictions drop the pixels.

## 2. Pixel pipeline and taint

**Object URL.** `URL.createObjectURL` accepts a `Blob` (including `File`) and returns a `blob:` URL. The URL's origin is the creating environment. The mapping keeps the `Blob` alive until `revokeObjectURL` or the creating document unloads. (File API §8, W3C; MDN `createObjectURL`, 23 Jul 2025.)

**ImageBitmap.** `createImageBitmap` accepts a `Blob` (hence a user `File`) and returns a `Promise<ImageBitmap>` that `drawImage` accepts. An `ImageBitmap` has an origin-clean flag, initially true; `createImageBitmap` sets it false if the source is not origin-clean. `close()` releases the bitmap data. (HTML LS §8.11.2, 18 Aug 2026; MDN `createImageBitmap`, 23 Jun 2025.)

**Origin-clean.** Canvas bitmaps start origin-clean true. `toDataURL`, `toBlob`, and `getImageData` throw `SecurityError` if the flag is false. Drawing any data loaded from another origin without CORS approval taints the canvas. `HTMLImageElement.crossOrigin = "anonymous"` requests a CORS fetch. (HTML LS canvas element / drawing images; MDN "Use cross-origin images in a canvas", 18 Sep 2025.)

**What that means here.** A Screenshot the user uploads or pastes is a same-origin `File`/`Blob`. `createObjectURL` + `<img>`, or `createImageBitmap` + `drawImage`, does not taint. Remote Background URLs can. html2canvas: `useCORS` defaults false, `allowTaint` defaults false, optional `proxy`. (html2canvas configuration.) html-to-image inlines images as data URLs before the `foreignObject` step; a tainted nested canvas still fails. (README.) Rasterizing a live SVG via `drawImage` puts it in the image context: `blob:` hrefs will not load unless rewritten to `data:`.

## 3. Export formats and 1x / 2x scale

**Platform serialize.** `HTMLCanvasElement.toBlob(callback, type = "image/png", quality)` and `toDataURL` default to PNG. If the given type is not supported, PNG is used. `quality` is 0.0–1.0 for types that support variable quality; the spec's example is `image/jpeg`. (HTML LS canvas element, 18 Aug 2026.) MDN also names `image/webp` as a lossy `type` string. (MDN `toBlob`, 12 Feb 2026.) Feature-detect: if the result still starts with `data:image/png`, the requested type was not supported. (HTML LS.)

**Libraries.** html-to-image exposes `toPng`, `toJpeg`, `toBlob`, `toSvg`, `toCanvas`, `toPixelData`. JPEG `quality` option. `pixelRatio` defaults to `devicePixelRatio`. `type` defaults to `image/png`. (README; `src/index.ts`.) html2canvas `scale` defaults to `window.devicePixelRatio`. (configuration.)

**Retina is extra work.** `devicePixelRatio` is physical pixels / CSS pixels; `2` is typical HiDPI. A sharp canvas sets `canvas.width` / `height` to CSS size × ratio and draws in that larger bitmap. (MDN `devicePixelRatio`, 17 Dec 2025.) A 2x Export is the same choice: pick a scale (device ratio, or a fixed 2), size the bitmap, serialize. Not free on any raster path.

**SVG file.** `toSvg` / `XMLSerializer` can write an SVG file. That is not a PNG/JPEG/WebP Export. html-to-image's SVG is a `<foreignObject>` wrapper around cloned HTML, not a semantic drawing.

**Offscreen.** `OffscreenCanvas.convertToBlob` serializes from a worker. (MDN `OffscreenCanvas`, 26 Oct 2024; HTML LS.)

## 4. Libraries, licenses, large PNGs

**Who needs a library.** Canvas 2D and live SVG: none. DOM snapshot: a library.

**html-to-image 1.11.13.** MIT. No runtime `dependencies` (devDependencies only). (package.json; LICENSE, Copyright (c) 2017-2026 W.Y.)

**html2canvas 1.4.1.** MIT. Runtime dependencies: `css-line-break`, `text-segmentation`. (package.json; LICENSE, Copyright (c) 2012 Niklas von Hertzen.)

**Comparable studio (how it draws, not product scope).** screenshot.rocks previews in React DOM and exports with `dom-to-image` (`toPng` / `toJpeg` / `toSvg`) — the same foreignObject family as html-to-image. Uploads are separately resized on a canvas, default max 3200×3200. (`package.json` depends on `dom-to-image` ^2.6.0; `src/utils/image.ts` `downloadImage`, `resizeImage`.)

**Size limits.** html-to-image, unless `skipAutoScale`, shrinks a canvas whose width or height exceeds 16384. (`src/util.ts` `checkCanvasDimensions`; comment cites MDN canvas maximum size.) MDN: maximum canvas size is browser- and device-dependent; often above 10,000×10,000; iOS devices notably 4,096×4,096; exceeding the limit makes drawing a no-op. (MDN `<canvas>`, "Maximum canvas size".) html-to-image also warns that huge DOMs fail the data-URI size limit. (README.)

**Memory.** The platform does not publish a budget. A decoded bitmap is width × height × 4 bytes, plus the encoded Blob; a 2× Export multiplies the bitmap. Un-revoked `blob:` URLs pin the original `File`. (`ImageBitmap.close` and `URL.revokeObjectURL` are the release valves.)

# Unresolved

- The exact HTML drawing-model order of shadow versus clip (shadow generated from the unclipped shape, then both clipped — or the shape clipped first). The spec says a `drawImage` is subject to both. Treat "clip, then draw with shadow" as unsafe for a drop shadow that must extend outside the rounded rect.
- Whether every current engine accepts `image/webp` in `toBlob`. The spec only guarantees PNG and fallback-to-PNG. Feature-detect.
- No measurement of encode time or peak memory for large PNGs. No primary source states a number.
- Default SVG filter region (whether `feDropShadow` is clipped unless `x`/`y`/`width`/`height` are expanded). Filter Effects text was not extracted.
- Closed-source studios (shots.so and similar) were not inspected.

# Sources

- HTML Living Standard, canvas chapter, last updated 18 Aug 2026 — https://html.spec.whatwg.org/multipage/canvas.html
- HTML Living Standard, ImageBitmap, last updated 18 Aug 2026 — https://html.spec.whatwg.org/multipage/imagebitmap-and-animations.html
- File API (W3C), §8 Blob URLs — https://w3c.github.io/FileAPI/#blob-url
- MDN: `box-shadow` (23 May 2026), `shadowBlur` (25 Sep 2025), `clip` (1 Jan 2026), `roundRect` (17 Dec 2025), `drawImage` (25 Sep 2025), `imageSmoothingEnabled` / `imageSmoothingQuality` (25 Sep 2025), `toBlob` (12 Feb 2026), `createImageBitmap` (23 Jun 2025), `createObjectURL` (23 Jul 2025), `devicePixelRatio` (17 Dec 2025), `OffscreenCanvas` (26 Oct 2024), `foreignObject` (6 Jun 2025), `feDropShadow` (28 Oct 2025), `clipPath` (7 Nov 2025), "SVG as an image" (13 May 2025), "Use cross-origin images in a canvas" (18 Sep 2025), `<canvas>` maximum size
- html-to-image 1.11.13 — README, LICENSE, package.json, `src/index.ts`, `src/util.ts` — https://github.com/bubkoo/html-to-image
- html2canvas 1.4.1 — `docs/documentation.md`, `docs/features.md`, configuration page, LICENSE, package.json — https://github.com/niklasvh/html2canvas — https://html2canvas.hertzen.com/features/ — https://html2canvas.hertzen.com/configuration/
- screenshot.rocks — `package.json`, `src/utils/image.ts` — https://github.com/daveearley/screenshot.rocks
