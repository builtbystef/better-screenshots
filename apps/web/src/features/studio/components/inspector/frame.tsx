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
      className={cn(chipGroup, "grid-cols-4")}
      value={selected === undefined ? [] : [selected.name]}
    >
      {aspectPresets.map((preset) => (
        <ToggleGroupItem
          key={preset.name}
          value={preset.name}
          title={`${String(preset.width)}×${String(preset.height)}`}
          aria-label={`${preset.name} ${String(preset.width)}×${String(preset.height)}`}
          className={chipItem({ chip: "text" })}
          onPressedChange={(pressed) => {
            if (pressed) {
              writePreset(preset.width, preset.height);
            }
          }}
        >
          {preset.name}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
