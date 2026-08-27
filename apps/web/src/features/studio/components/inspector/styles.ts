import { cva } from "class-variance-authority";

export const inspectorField = cva("font-mono", {
  variants: {
    field: {
      number:
        "px-1.5 py-1 text-right text-xs tabular-nums md:text-xs [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
      hex: "flex-1 rounded-none border-0 bg-transparent focus-visible:ring-0",
    },
  },
});

export const chipGroup = "grid w-full items-stretch gap-2 p-0.5";

export const chipItem = cva(
  "h-auto w-full rounded-md border border-border ring-offset-sidebar transition-[box-shadow] data-pressed:ring-2 data-pressed:ring-ring data-pressed:ring-offset-2 not-data-pressed:hover:ring-2 not-data-pressed:hover:ring-ring/40 not-data-pressed:hover:ring-offset-2",
  {
    variants: {
      chip: {
        swatch: "aspect-square p-0",
        text: "px-2 py-1.5 text-[11px] not-data-pressed:text-muted-foreground",
      },
    },
  },
);
