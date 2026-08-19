---
id: dt8gtk
title: Which solids and gradients ship, and can the user author a color or gradient?
state: done
assignee: agent
priority: medium
labels:
    - roadmap:pfdjl3
    - session:grill
depends_on:
    - bdkac8
parent: pfdjl3
created: 2026-08-19T00:44:14Z
updated: 2026-08-19T03:11:32Z
---

Grill session, limited to the built-in Background catalog. bdkac8 settled the kinds: solid, gradient, and user-uploaded image. Patterns wait. Uploaded images are the persistence node.

Settle with the user:

- A finite set of solids, a finite set of gradients, or both.
- Whether the user can pick an arbitrary solid color, and whether they can author a gradient (stops, angle) or only choose from the set.
- Rough size of the set (a handful vs a large catalog). Do not pick the actual colors in this node.

Do not design the picker chrome, uploaded-image persistence, or patterns.

Pointers: bdkac8 note; `docs/GLOSSARY.md` (Background).

## Notes

**agent** — 2026-08-19T03:11:32Z

# Question

Which solids and gradients ship, and can the user author a color or gradient?

# Answer

Both a handful of solids and a handful of gradients. Custom solid in (`#RRGGBB`). Custom gradient out. The empty Studio starts with one catalog solid. A custom hex is Composition-only.

# Cut

**Catalog.** Finite set of solids and finite set of gradients. Each item is a value the picker writes onto the Composition. Draw never looks one up (y7ac9r).

**Size.** A handful of each — under a dozen solids, under a dozen gradients. Not a large catalog. Actual colors wait with visual identity.

**Default.** One catalog solid. Not a gradient. Not an unpublished hex.

**Custom solid.** In. Any `#RRGGBB` (no alpha — already the Composition shape). Lives on the in-memory Composition only. Not a persisted "my colors" list. A refresh drops it, same as the rest of the Composition.

**Custom gradient.** Out. No stops control, no angle control. Gradients exist only as catalog items. A specific look is an upload (w0i92g).

# Reason

The sitting is two minutes. One hex is a single value the model already stores. Stops and angle are a graphics-editor surface. Gradients still ship, as a closed set — otherwise the kind is unreachable. A handful is enough: custom solid covers "I have a hex," upload covers "I have a look." A saved-colors store is a second persistence feature next to uploaded images; first ship already refused Composition drafts.

# Glossary

Added **Catalog**.

# Not this node

Picker chrome. The actual colors. Uploaded images (w0i92g). Patterns (already waiting).
