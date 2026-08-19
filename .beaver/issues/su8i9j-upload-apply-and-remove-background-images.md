---
id: su8i9j
title: Upload, apply, and remove Background images
state: todo
priority: medium
depends_on:
    - m8b0jw
    - 866rvo
parent: 3toux4
created: 2026-08-19T19:38:34Z
updated: 2026-08-19T19:38:34Z
---

## What to build

The Inspector Background section lists uploaded images. Add persists one and applies it. A refused upload says whether the file, the quota, or storage failed. Remove is an X, disabled while that image is current.

## Acceptance criteria

- [ ] Group labeled Image. Newest first. Each row is a thumbnail, the filename, and an X. Click applies `{ type: "image", id }`.
- [ ] Add is a one-file `image/*` picker on the list. A successful upload is then applied (`uploadBackground`, then `setBackground`).
- [ ] X is visible and disabled on the current image. No confirm.
- [ ] A refused upload is one inline line under the list, cleared by the next Add or a successful upload. `undecodable` → `That file isn't an image.` `quota` → `Not enough storage for that image.` `unavailable` → `Can't store images in this browser.`
- [ ] Add is disabled while `storage` is `"unavailable"`.
