---
id: y7ac9r
title: What is the Composition data shape for the first ship?
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
updated: 2026-08-19T02:14:00Z
---

Grill session, limited to the first-ship Composition data shape. The cut is closed in bdkac8: one Screenshot, one Background (solid, gradient, or user-uploaded image), position, scale, padding, shadow, border, rounded corners.

Settle with the user:

- The fields of a Composition, and the fields of its Screenshot placement and of its Background.
- Units and coordinate space (pixels vs fractions of the Background; origin).
- What is stored vs what is derived at draw time.
- How a user-uploaded Background image is referenced (not how the file is stored — that is the persistence node).

Do not design the Studio chrome, the draw path, or the Export file contract.

Pointers: bdkac8 note; `docs/GLOSSARY.md` (Composition, Screenshot, Background, Padding, Effect, Export).

## Notes

**agent** — 2026-08-19T02:13:47Z

# Question

What is the Composition data shape for the first ship?

# Answer

An in-memory Composition with an explicit CSS-pixel frame (default 1920×1080), a required Background value (solid hex, linear gradient, or IndexedDB id), an optional Screenshot handle, and Padding / Scale / Position / Effects on the Composition. Not hug-the-Screenshot. Not a catalog id. Not persisted.

# Cut

**Frame.** Stored `width` and `height`, CSS pixels, both `> 0`. Default `1920×1080`. Origin is the center. `+x` is right, `+y` is down. First ship does not expose a size control. Presets later write these fields. Export scale (`cx9cwz`) multiplies this size.

**Background.** Required tagged value, not a catalog id:

- `solid` + `#RRGGBB`
- `gradient` + CSS-degree angle (`0` is up, `90` is right) + two or more stops (`offset` in `[0, 1]`, `#RRGGBB`)
- `image` + the IndexedDB id from `w0i92g` (not the Blob, not the filename)

An `image` Background is cover, cropped from the center — not a stored field. The catalog (`dt8gtk`) is a picker that writes a value. Draw never looks up a preset. The default solid waits on `dt8gtk`.

**Screenshot.** Optional in-memory `File`/`Blob` handle. Absent on an empty Studio. Replace keeps Padding, Scale, Position, and Effects, and swaps the handle. A `0×0` or undecodable file is refused; the Composition does not change.

**Placement** (stored on the Composition even while the Screenshot is absent; applies only when one is present):

- **Padding:** one number, CSS pixels, `≥ 0`. Default `120`. Uniform. Clamp so the inner rect is at least `1×1`.
- **Scale:** unitless, `> 0`. Default `1`. `1` is the size that fits the Screenshot inside the padded rect. Refuse `0` and negative.
- **Position:** `x`, `y` in CSS pixels from the center. Default `0,0`. Unbounded. The frame clips.

**Effects.** Present on the Composition. Knobs are `eivufq`.

**Derived at draw time.** Intrinsic Screenshot size, `ImageBitmap`, object URL. Inner rect = frame inset by Padding (after clamp). Fitted size = Screenshot contained in that rect, aspect kept. Drawn size = fitted × Scale. Drawn center = frame center + Position.

# Reason

Solids and gradients have no intrinsic size; an uploaded wallpaper's pixels are the wrong Export size. A stable frame lets the Screenshot move without the Composition jumping. Values instead of catalog ids keep draw free of the picker and leave `dt8gtk` as a writer. Placement on the Composition makes replace-keeps-numbers the default and gives later drag a field to write. Uniform Padding plus Scale-as-fit matches a two-minute sitting; Position exists so chrome can drag later.

# Glossary

Added **Position** and **Scale**.

# Not this node

Export format, filename, and 1x/2x (`cx9cwz`). Effect knobs (`eivufq`). Default solid/gradient (`dt8gtk`). Studio chrome. Draw path (already Canvas 2D). Persistence of this object (already out).
