# Glossary

The project's shared language. The rules: use one term for each concept — the rejected synonyms go under _Avoid_. A definition is one or two sentences that say what the term IS, not what it does. Only terms specific to this project belong here — general concepts from programming do not. No implementation details. Group the terms under subheadings when clusters appear.

## Language

**Studio**:
The browser app where the user makes a Composition.
_Avoid_: editor, app, site

**Session**:
The live Composition and its writers, opened when the Studio loads.
_Avoid_: store, state, model

**Refuse**:
The result a writer returns when it will not accept a value.
_Avoid_: error, reject, fail

**Inspector**:
The single Studio panel for Frame, Background, placement, Browser window, and Effects.
_Avoid_: sidebar, properties, settings (when this panel is meant)

**Preview**:
The Studio surface that displays the Composition bitmap.
_Avoid_: canvas, stage, viewport (when this surface is meant)

**Screenshot**:
The source image the user brings into the Studio.
_Avoid_: capture, shot, image (when the upload is meant)

**Background**:
The surface a Composition's Screenshot sits on.
_Avoid_: canvas, backdrop, scene

**Uploaded background**:
A Background image the user supplied, stored in the browser and listed in the Inspector's Image group. It is distinct from a Catalog value and from a Screenshot.
_Avoid_: custom background, user image

**Catalog**:
The finite set of built-in Background values and Aspect presets the Inspector can write.
_Avoid_: palette, theme, presets (when the built-in Background set is meant)

**Composition**:
One arranged result: a Frame, a Background, the Screenshot on it, its Padding, its Effects, and an optional Browser window.
_Avoid_: design, mockup, poster

**Saved composition**:
A Composition's settings without its Screenshot, kept in the browser and restored when the Studio next loads.
_Avoid_: draft, autosave, persisted state

**Frame**:
The stored width and height of a Composition.
_Avoid_: canvas size, output size, artboard

**Aspect preset**:
A named Frame size in the Catalog.
_Avoid_: social size, ratio (when the named Frame is meant)

**Browser window**:
The Chrome-style title and address bar drawn around a Screenshot. The two are placed as one, so Padding, Position, and Scale act on both.
_Avoid_: browser chrome, device frame, chrome (when this wrap is meant)

**Padding**:
The inset of the Screenshot on the Background.
_Avoid_: framing, margin, gap

**Position**:
The offset of the Screenshot from the center of the Composition.
_Avoid_: translation, location, offset (when the placement is meant)

**Scale**:
The size of the Screenshot relative to the size that fits it inside the Padding.
_Avoid_: zoom, magnification

**Effect**:
A visual change applied to a Screenshot — shadow, border, or rounded corners.
_Avoid_: treatment, filter, style

**Export**:
The PNG file written from a Composition.
_Avoid_: download, render, output
