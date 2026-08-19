---
id: su8i9j
title: Upload, apply, and remove Background images
state: done
assignee: agent
priority: medium
depends_on:
    - m8b0jw
    - 866rvo
parent: 3toux4
created: 2026-08-19T19:38:34Z
updated: 2026-08-19T20:40:33Z
---

## What to build

The Inspector Background section lists uploaded images. Add persists one and applies it. A refused upload says whether the file, the quota, or storage failed. Remove is an X, disabled while that image is current.

## Acceptance criteria

- [ ] Group labeled Image. Newest first. Each row is a thumbnail, the filename, and an X. Click applies `{ type: "image", id }`.
- [ ] Add is a one-file `image/*` picker on the list. A successful upload is then applied (`uploadBackground`, then `setBackground`).
- [ ] X is visible and disabled on the current image. No confirm.
- [ ] A refused upload is one inline line under the list, cleared by the next Add or a successful upload. `undecodable` → `That file isn't an image.` `quota` → `Not enough storage for that image.` `unavailable` → `Can't store images in this browser.`
- [ ] Add is disabled while `storage` is `"unavailable"`.

## Notes

**agent** — 2026-08-19T20:37:45Z

Seam: uploadLine in chrome.ts (input → refuse copy), same shape as placeLine and exportLine. Page is not a test seam; do not mount it. Newest-first, apply, remove, and Add disable are page glue over session.uploadedBackgrounds / uploadBackground / setBackground / removeBackground / storage.

**agent** — 2026-08-19T20:40:33Z

Inspector Background Image group lists uploaded images newest first. Each row is a thumbnail, the filename, and an X. Click applies { type: "image", id }. Add is a one-file image/* picker: uploadBackground then setBackground. X is visible and disabled on the current image, no confirm. Add is disabled while storage is unavailable.

Seam: uploadLine in chrome.ts. undecodable → That file isn't an image. quota → Not enough storage for that image. unavailable → Can't store images in this browser. Line sits under the list and clears on the next Add or a successful upload.

Page is not a test seam. No new decisions.
