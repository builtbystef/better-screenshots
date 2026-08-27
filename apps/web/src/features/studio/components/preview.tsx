import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  placeLine,
  type PlaceOutcome,
  type PlaceSource,
} from "@/features/studio/composition/messages";
import type { StudioSession } from "@/features/studio/composition/session";
import { cn } from "@/lib/utils";
import { useExport } from "@/features/studio/hooks/use-export";
import { useFileDrop } from "@/features/studio/hooks/use-file-drop";
import { usePreviewCanvas } from "@/features/studio/hooks/use-preview-canvas";
import { useScreenshotDrag } from "@/features/studio/hooks/use-screenshot-drag";
import { Download, Upload } from "lucide-react";
import { useCallback, useId, useState, type ChangeEvent } from "react";

export function Preview({
  session,
  sessionVersion,
}: {
  session: StudioSession;
  sessionVersion: number;
}) {
  const pickerId = useId();
  const [line, setLine] = useState<string | null>(null);
  const occupied = session.composition.screenshot !== null;

  const hostRef = usePreviewCanvas(session, sessionVersion);
  const { exporting, exportPng } = useExport(session, setLine);
  const exportDisabled = !occupied || exporting;

  const place = useCallback(
    async (source: PlaceSource, files: readonly Blob[]) => {
      setLine(null);
      const outcome: PlaceOutcome =
        files.length === 0
          ? "empty"
          : (await session.placeScreenshot(files)) === "ok"
            ? "ok"
            : "refuse";
      setLine(placeLine(source, outcome));
    },
    [session],
  );

  const fileDrag = useFileDrop(place);
  const { dragging, overScreenshot, handlers } = useScreenshotDrag({
    session,
    hostRef,
    occupied,
    onLine: setLine,
  });

  function onPickerChange(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files === null ? [] : Array.from(event.target.files);
    event.target.value = "";
    if (files.length === 0) {
      return;
    }
    void place("picker", files);
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="flex shrink-0 items-center justify-end gap-2 px-5 py-3">
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
            className={cn(buttonVariants({ variant: "ghost" }), "cursor-pointer")}
          >
            Replace
          </Label>
        ) : null}
        <Button
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
      <div
        className={cn(
          "studio-well relative min-h-0 flex-1",
          fileDrag && "ring-2 ring-inset ring-ring",
          occupied && "touch-none",
          dragging ? "cursor-grabbing" : overScreenshot && "cursor-grab",
        )}
        {...handlers}
      >
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div ref={hostRef} className="flex h-full w-full items-center justify-center" />
        </div>
        {fileDrag ? (
          <div className="pointer-events-none absolute inset-5 rounded-xl border-2 border-dashed border-ring" />
        ) : null}
        {occupied ? null : (
          <Label
            htmlFor={pickerId}
            aria-label="Drop a screenshot or paste (Ctrl/Cmd+V). Choose a file"
            className="absolute inset-0 flex cursor-pointer items-center justify-center"
          >
            <span className="flex flex-col items-center gap-3 text-center">
              <span className="flex size-11 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm">
                <Upload className="size-4" aria-hidden="true" />
              </span>
              <span className="flex flex-col items-center gap-1">
                <span className="text-base font-medium tracking-tight">Drop a screenshot</span>
                <span className="text-sm text-muted-foreground">or paste (Ctrl/Cmd+V)</span>
              </span>
              <span className={buttonVariants()}>Choose a file</span>
            </span>
          </Label>
        )}
        {line === null ? null : (
          <p className="pointer-events-none absolute inset-x-0 bottom-4 px-5 text-center text-sm text-muted-foreground">
            {line}
          </p>
        )}
      </div>
    </div>
  );
}
