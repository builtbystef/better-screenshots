import { Input } from "@/components/ui/input";
import { parseInteger } from "@/features/studio/composition/parse";
import { useDraft } from "@/hooks/use-draft";
import { inspectorField } from "@/features/studio/components/inspector/styles";

export function PositionRow({
  x,
  y,
  onWrite,
}: {
  x: number;
  y: number;
  onWrite: (x: number, y: number) => void;
}) {
  const {
    draft: xDraft,
    setDraft: setXDraft,
    onBlur: commitX,
    onKeyDown: onXKeyDown,
  } = useDraft(x, parseInteger, (nextX) => onWrite(nextX, y));
  const {
    draft: yDraft,
    setDraft: setYDraft,
    onBlur: commitY,
    onKeyDown: onYKeyDown,
  } = useDraft(y, parseInteger, (nextY) => onWrite(x, nextY));

  return (
    <div className="grid grid-cols-[3.75rem_auto_1fr_auto_1fr] items-center gap-2">
      <span className="text-[11px] text-muted-foreground">Position</span>
      <span className="text-[11px] text-muted-foreground">X</span>
      <Input
        type="number"
        value={xDraft}
        step="any"
        spellCheck={false}
        autoComplete="off"
        aria-label="X"
        className={inspectorField({ field: "number" })}
        onChange={(event) => setXDraft(event.target.value)}
        onBlur={commitX}
        onKeyDown={onXKeyDown}
      />
      <span className="text-[11px] text-muted-foreground">Y</span>
      <Input
        type="number"
        value={yDraft}
        step="any"
        spellCheck={false}
        autoComplete="off"
        aria-label="Y"
        className={inspectorField({ field: "number" })}
        onChange={(event) => setYDraft(event.target.value)}
        onBlur={commitY}
        onKeyDown={onYKeyDown}
      />
    </div>
  );
}
