import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { aspectPresetFor, aspectPresets } from "@/features/studio/composition/catalog";
import type { StudioSession } from "@/features/studio/composition/session";
import { cn } from "@/lib/utils";
import { chipGroup, chipItem } from "@/features/studio/components/inspector/styles";

export function FrameInspector({ session }: { session: StudioSession }) {
  const selected = aspectPresetFor(session.composition.width, session.composition.height);

  function writePreset(width: number, height: number) {
    session.setSize(width, height);
  }

  return (
    <ToggleGroup
      className={cn(chipGroup, "grid-cols-2")}
      value={selected === undefined ? [] : [selected.name]}
    >
      {aspectPresets.map((preset) => (
        <ToggleGroupItem
          key={preset.name}
          value={preset.name}
          title={`${String(preset.width)}×${String(preset.height)} — ${preset.note}`}
          aria-label={`${preset.name} ${preset.ratio}, ${String(preset.width)}×${String(preset.height)}`}
          // The base Toggle is nowrap/shrink-0; these let a two-word name wrap
          // inside its grid cell instead of overflowing into the next chip.
          className={cn(
            chipItem({ chip: "text" }),
            "min-w-0 shrink text-center leading-tight text-balance whitespace-normal",
          )}
          onPressedChange={(pressed) => {
            if (pressed) {
              writePreset(preset.width, preset.height);
            }
          }}
        >
          {preset.name} ({preset.ratio})
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
