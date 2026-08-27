import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useDraft } from "@/hooks/use-draft";
import { inspectorField } from "@/features/studio/components/inspector/styles";

export function KnobRow({
  label,
  value,
  min,
  max,
  step,
  parse,
  onWrite,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format?: (value: number) => string;
  parse: (raw: string) => number | "refuse";
  onWrite: (value: number) => void;
}) {
  const { draft, setDraft, onBlur, onKeyDown } = useDraft(value, parse, onWrite, format);

  return (
    <div className="grid grid-cols-[3.75rem_1fr_3rem] items-center gap-2">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <Slider
        value={value}
        min={min}
        max={max}
        step={step}
        aria-label={label}
        onValueChange={(next) => {
          onWrite(next);
        }}
      />
      <Input
        type="number"
        value={draft}
        step="any"
        spellCheck={false}
        autoComplete="off"
        aria-label={label}
        className={inspectorField({ field: "number" })}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
      />
    </div>
  );
}
