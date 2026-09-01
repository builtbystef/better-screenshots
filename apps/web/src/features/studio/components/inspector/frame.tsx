import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { aspectPresetFor, aspectPresets } from "@/features/studio/composition/catalog";
import type { StudioSession } from "@/features/studio/composition/session";
import { cn } from "@/lib/utils";
import { chipGroup, chipItem } from "@/features/studio/components/inspector/styles";

export function FrameInspector({ session }: { session: StudioSession }) {
  const { width, height } = session.composition;
  const selected = aspectPresetFor(width, height);
  const auto = session.autoFrame;
  const onAuto = auto !== null && width === auto.width && height === auto.height;

  function writePreset(nextWidth: number, nextHeight: number) {
    session.setSize(nextWidth, nextHeight);
  }

  return (
    <ToggleGroup
      className={cn(chipGroup, "grid-cols-4")}
      value={[...(onAuto ? ["auto"] : []), ...(selected === undefined ? [] : [selected.name])]}
    >
      <ToggleGroupItem
        value="auto"
        disabled={auto === null}
        title={
          auto === null
            ? "Add a screenshot first — Auto measures it"
            : `${String(auto.width)}×${String(auto.height)} — the screenshot's own shape, with the current padding`
        }
        aria-label={
          auto === null
            ? "Auto, unavailable until a screenshot is added"
            : `Auto, ${String(auto.width)}×${String(auto.height)}`
        }
        // The base Toggle drops pointer events when disabled, which would take
        // the title with them; the tooltip is the only thing saying why.
        className={cn(chipItem({ chip: "text" }), "disabled:pointer-events-auto")}
        onPressedChange={(pressed) => {
          if (pressed && auto !== null) {
            writePreset(auto.width, auto.height);
          }
        }}
      >
        Auto
      </ToggleGroupItem>
      {aspectPresets.map((preset) => (
        <ToggleGroupItem
          key={preset.name}
          value={preset.name}
          title={`${String(preset.width)}×${String(preset.height)} — ${preset.note}`}
          aria-label={`${preset.name}, ${String(preset.width)}×${String(preset.height)}`}
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
