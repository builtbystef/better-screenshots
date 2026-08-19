---
id: 3ycq6b
title: Place a Screenshot and derive placement
state: todo
priority: high
depends_on:
    - hbbrwg
    - efoqxv
parent: erb9py
created: 2026-08-19T06:07:54Z
updated: 2026-08-19T06:07:54Z
---

## What to build

The user places one Screenshot. The session walks the given Blobs and keeps the first decodable image whose intrinsic size is not `0×0`. A successful place replaces the current Screenshot and keeps Padding, Scale, Position, and Effects. An empty list or nothing decodable is refused and the Composition does not change. After a successful place, `placement` is derived from the current Composition and that Screenshot’s intrinsic size.

## Acceptance criteria

- [ ] `placeScreenshot` of one decodable image returns `"ok"` and sets `screenshot` to that Blob.
- [ ] A second successful place swaps the Screenshot and leaves Padding, Scale, Position, shadow, border, and radius unchanged.
- [ ] An empty list, an undecodable Blob, a `0×0` image, or a list whose only images are those, returns `"refuse"` and leaves the Composition unchanged.
- [ ] Given several Blobs, the first decodable non-`0×0` image is the one placed; earlier bad sources are skipped.
- [ ] Default frame 1920×1080, padding 120, no Screenshot → `placement` is null. After placing an `800×600` Screenshot at scale 1 and Position `0, 0`: `inner` is `{ x: 120, y: 120, width: 1680, height: 840 }`, `fitted` is `{ width: 1120, height: 840 }`, `drawn` is `{ x: 400, y: 120, width: 1120, height: 840 }`.
- [ ] `setPadding(10000)` then the same Screenshot: effective padding is `539.5`, `inner` is `{ x: 539.5, y: 539.5, width: 841, height: 1 }`, stored `padding` stays `10000`.
- [ ] Same default inner, Screenshot `800×600`, `setScale(2)`, Position `0, 0`: `drawn` is `{ x: -160, y: -300, width: 2240, height: 1680 }`.
- [ ] Same default inner and Screenshot, scale 1, `setPosition(100, -50)`: `drawn` is `{ x: 500, y: 70, width: 1120, height: 840 }`.
