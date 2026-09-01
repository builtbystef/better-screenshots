# Draw the Composition and write the Export with Canvas 2D

The Studio must preview a Composition honestly and write that same image as the Export, with no backend and no extra library.

Preview and Export run the same draw path; `exportPng` runs it at 2x and calls `toBlob` on that canvas, while the Preview runs the same passes at the scale that fills its box, capped at 2x — fewer pixels, since the display cannot show more anyway (amended from "the same 2x scale" when full-resolution repaints proved too heavy for live slider drags). Shadows have offset, blur, and opacity over black — not spread, not an arbitrary colour. The draw is two-pass so a rounded clip does not cut the drop shadow.

DOM snapshot libraries do not paint the live preview (html2canvas skips `box-shadow`; html-to-image rasters a clone). SVG still rasterizes through canvas and must inline `blob:` hrefs. A split path cannot be pixel-identical.
