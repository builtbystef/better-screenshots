---
id: hbbrwg
title: 'Prototype: decode a Blob and get a Canvas 2D bitmap under vp test'
state: todo
priority: high
labels:
    - research
parent: erb9py
created: 2026-08-19T06:07:51Z
updated: 2026-08-19T06:07:51Z
---

## What to build

A verdict on how `vp test` decodes an image Blob and produces a Canvas 2D bitmap that can write `image/png`. Later slices call `placeScreenshot`, `uploadBackground`, `render`, and `exportPng` through that environment. Use the prototype skill. Closure waits for user review.

## Acceptance criteria

- [ ] Under `vp test`, a decodable PNG Blob of a known intrinsic size can be decoded.
- [ ] Under `vp test`, an `HTMLCanvasElement` can be created, painted, and turned into an `image/png` Blob.
- [ ] The verdict names the environment and any new dependency. No production draw library is added.
