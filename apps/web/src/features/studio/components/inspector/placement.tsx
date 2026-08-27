import {
  formatScale,
  parseNonNegativeInteger,
  parseScale,
} from "@/features/studio/composition/parse";
import type { StudioSession } from "@/features/studio/composition/session";
import { KnobRow } from "@/features/studio/components/inspector/knob-row";
import { PositionRow } from "@/features/studio/components/inspector/position-row";

export function PlacementInspector({ session }: { session: StudioSession }) {
  const { padding, scale, position } = session.composition;

  return (
    <div className="flex flex-col gap-3">
      <KnobRow
        label="Padding"
        value={padding}
        min={0}
        max={400}
        step={1}
        parse={parseNonNegativeInteger}
        onWrite={(value) => {
          session.setPadding(value);
        }}
      />
      <KnobRow
        label="Scale"
        value={scale}
        min={0.25}
        max={2}
        step={0.05}
        format={formatScale}
        parse={parseScale}
        onWrite={(value) => {
          session.setScale(value);
        }}
      />
      <PositionRow
        x={position.x}
        y={position.y}
        onWrite={(x, y) => {
          session.setPosition(x, y);
        }}
      />
    </div>
  );
}
