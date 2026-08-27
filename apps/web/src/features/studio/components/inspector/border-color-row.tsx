import { Input } from "@/components/ui/input";
import { parseHex } from "@/features/studio/composition/parse";
import type { HexColor } from "@/features/studio/composition/session";
import { useDraft } from "@/hooks/use-draft";
import { inspectorField } from "@/features/studio/components/inspector/styles";

export function BorderColorRow({
  color,
  onWrite,
}: {
  color: HexColor;
  onWrite: (color: HexColor) => void;
}) {
  const {
    draft: hexDraft,
    setDraft: setHexDraft,
    onBlur: commitHex,
    onKeyDown: onHexKeyDown,
  } = useDraft(color, parseHex, onWrite);

  return (
    <div className="grid grid-cols-[3.75rem_1fr] items-center gap-2">
      <span className="text-[11px] text-muted-foreground">Color</span>
      <div className="flex overflow-hidden rounded-md border border-input">
        <Input
          value={hexDraft}
          placeholder="#RRGGBB"
          spellCheck={false}
          autoComplete="off"
          aria-label="Border color"
          className={inspectorField({ field: "hex", className: "h-7 px-2 text-xs md:text-xs" })}
          onChange={(event) => setHexDraft(event.target.value)}
          onBlur={commitHex}
          onKeyDown={onHexKeyDown}
        />
        <input
          type="color"
          value={color}
          aria-label="Border color picker"
          className="studio-swatch size-7 shrink-0 cursor-pointer border-0 border-l border-input"
          onChange={(event) => {
            const next = parseHex(event.target.value);
            if (next !== "refuse") {
              onWrite(next);
            }
          }}
        />
      </div>
    </div>
  );
}
