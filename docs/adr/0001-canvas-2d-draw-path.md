# Draw the Composition and write the Export with Canvas 2D

The Studio must preview a Composition honestly and write that same image as the Export, with no backend and no extra library. First ship is one Screenshot plus shadow, border, and rounded corners — not text, annotations, or device frames.

Preview and Export share one Canvas 2D bitmap (`toBlob`). Shadows have offset, blur, and color, not spread. The draw is two-pass so a rounded clip does not cut the drop shadow.

DOM snapshot libraries do not paint the live preview (html2canvas skips `box-shadow`; html-to-image rasters a clone). SVG still rasterizes through canvas and must inline `blob:` hrefs. A split path cannot be pixel-identical.
