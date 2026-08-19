---
id: w0i92g
title: How are uploaded Background images persisted across visits?
state: done
assignee: agent
priority: high
labels:
    - roadmap:pfdjl3
    - session:grill
depends_on:
    - bdkac8
parent: pfdjl3
created: 2026-08-19T00:44:14Z
updated: 2026-08-19T01:47:12Z
---

Grill session, limited to persisting user-uploaded Background images. bdkac8 settled the cut: those images survive a refresh; the in-progress Composition does not; pixels do not go in localStorage.

Settle with the user:

- IndexedDB or OPFS (or a split: metadata in one, Blobs in the other).
- What is stored besides the Blob (name, added-at, dimensions).
- What happens when quota is exceeded.
- Whether the user can remove an uploaded Background in the first ship (in or out — not the chrome).

Do not design Composition drafts, the Background catalog of solids and gradients, or the Studio picker chrome.

Pointers: bdkac8 note (persistence cut, and why localStorage is out); `docs/GLOSSARY.md` (Background, Studio).

## Notes

**agent** — 2026-08-19T01:46:56Z

# Question

How are uploaded Background images persisted across visits?

# Answer

IndexedDB only. One object store. Each record is a generated id, the original filename, added-at, width, height, byte length, and the original Blob. The write happens on a successful upload. Remove is in. Quota, a non-image, and a closed IndexedDB all refuse and store nothing.

# Cut

**Store.** IndexedDB only. The Blob is a field on the record. Not OPFS, not a split (metadata in one, bytes in the other), not localStorage.

**Record.** Generated id, original filename, added-at, width, height (intrinsic pixel size), byte length, original Blob. No rename. No thumbnail pixels.

**Write.** Immediately on a successful upload (decoded, quota accepted). Not deferred to placing it on a Composition, and not to Export. A refresh after upload, with no Export, still has it.

**Refuse, store nothing** when: the file is not decodable; origin quota is exceeded; or IndexedDB cannot be opened. On quota failure, leave what is already stored. No auto-evict. No navigator.storage.persist() in the first ship. No count cap and no per-file size limit here — huge uploads stay on the Frontier.

**Duplicates** are two records.

**Remove is in** (capability, not chrome). Refuse remove of the Background the current Composition is using — pick another first. Persistence does not invent a fallback solid.

**Tabs.** No live sync. Each tab reads IndexedDB when it needs the list (load, after its own upload, after its own remove). Tab B can be stale until it next reads.

**IndexedDB cannot be opened.** The user cannot add an uploaded Background. Solids and gradients still work. No in-memory catalog that looks persisted.

# Reason

The catalog is a handful of whole images with structured fields, not a filesystem. IndexedDB stores Blobs natively; a split with OPFS is two APIs and orphan files. Auto-evict would drop a custom backdrop the user still wants. persist() is a permission prompt and still loses to "clear site data." Remove is required so a bad or huge upload is not stuck until they clear site data. The live Composition always has a Background; snapping to a default solid waits on the catalog node. An in-memory fake catalog would vanish on refresh and look like a bug.

# Not this node

Composition drafts. The solid/gradient catalog. Picker chrome. How a Composition references the id (y7ac9r). Huge-upload and memory failure modes.
