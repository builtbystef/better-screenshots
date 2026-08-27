import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { StudioSession } from "@/features/studio/composition/session";
import { useExport } from "@/features/studio/hooks/use-export";
import { usePlaceScreenshot } from "@/features/studio/hooks/use-place-screenshot";
import { cn } from "@/lib/utils";
import { Download } from "lucide-react";
import { useId, type ChangeEvent } from "react";

export function ActionsInspector({ session }: { session: StudioSession }) {
  const pickerId = useId();
  const place = usePlaceScreenshot(session);
  const { exporting, exportPng } = useExport(session);
  const occupied = session.composition.screenshot !== null;
  const exportDisabled = !occupied || exporting;

  function onPickerChange(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files === null ? [] : Array.from(event.target.files);
    event.target.value = "";
    if (files.length === 0) {
      return;
    }
    void place("picker", files);
  }

  return (
    <div className="flex items-center gap-2">
      <input
        id={pickerId}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={onPickerChange}
      />
      {occupied ? (
        <Label
          htmlFor={pickerId}
          className={cn(buttonVariants({ variant: "outline" }), "flex-1 cursor-pointer")}
        >
          Replace
        </Label>
      ) : null}
      <Button
        className="flex-1"
        disabled={exportDisabled}
        onClick={() => {
          if (exportDisabled) {
            return;
          }
          void exportPng();
        }}
      >
        <Download aria-hidden="true" />
        Export
      </Button>
    </div>
  );
}
