import { parseNonNegativeInteger, parseOpacityPercent } from "@/features/studio/composition/parse";
import type { Border, Shadow, StudioSession } from "@/features/studio/composition/session";
import { BorderColorRow } from "@/features/studio/components/inspector/border-color-row";
import { KnobRow } from "@/features/studio/components/inspector/knob-row";

export function EffectsInspector({ session }: { session: StudioSession }) {
  const { shadow, border, radius } = session.composition;

  function writeShadow(patch: Partial<Shadow>) {
    session.setShadow(patch);
  }

  function writeBorder(patch: Partial<Border>) {
    session.setBorder(patch);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <h3 className="text-[11px] text-muted-foreground">Shadow</h3>
        <KnobRow
          label="Offset"
          value={shadow.offset}
          min={0}
          max={64}
          step={1}
          parse={parseNonNegativeInteger}
          onWrite={(offset) => writeShadow({ offset })}
        />
        <KnobRow
          label="Blur"
          value={shadow.blur}
          min={0}
          max={80}
          step={1}
          parse={parseNonNegativeInteger}
          onWrite={(blur) => writeShadow({ blur })}
        />
        <KnobRow
          label="Opacity"
          value={Math.round(shadow.opacity * 100)}
          min={0}
          max={100}
          step={1}
          parse={parseOpacityPercent}
          onWrite={(percent) => writeShadow({ opacity: percent / 100 })}
        />
      </div>
      <div className="flex flex-col gap-3">
        <h3 className="text-[11px] text-muted-foreground">Border</h3>
        <KnobRow
          label="Width"
          value={border.width}
          min={0}
          max={24}
          step={1}
          parse={parseNonNegativeInteger}
          onWrite={(width) => writeBorder({ width })}
        />
        <BorderColorRow color={border.color} onWrite={(color) => writeBorder({ color })} />
      </div>
      <KnobRow
        label="Radius"
        value={radius}
        min={0}
        max={64}
        step={1}
        parse={parseNonNegativeInteger}
        onWrite={(value) => {
          session.setRadius(value);
        }}
      />
    </div>
  );
}
