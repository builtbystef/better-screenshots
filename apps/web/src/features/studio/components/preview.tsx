import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { StudioSession } from "@/features/studio/composition/session";
import { cn } from "@/lib/utils";
import { useFileDrop } from "@/features/studio/hooks/use-file-drop";
import { usePlaceScreenshot } from "@/features/studio/hooks/use-place-screenshot";
import { usePreviewCanvas } from "@/features/studio/hooks/use-preview-canvas";
import { useScreenshotDrag } from "@/features/studio/hooks/use-screenshot-drag";
import { Upload } from "lucide-react";
import { useId, type ChangeEvent } from "react";

export function Preview({
  session,
  sessionVersion,
}: {
  session: StudioSession;
  sessionVersion: number;
}) {
  const pickerId = useId();
  const occupied = session.composition.screenshot !== null;

  const hostRef = usePreviewCanvas(session, sessionVersion);
  const place = usePlaceScreenshot(session);

  const fileDrag = useFileDrop(place);
  const { dragging, overScreenshot, handlers } = useScreenshotDrag({
    session,
    hostRef,
    occupied,
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
    <div
      className={cn(
        "relative h-full min-h-0 w-full",
        fileDrag && "ring-2 ring-inset ring-ring",
        occupied && "touch-none",
        dragging ? "cursor-grabbing" : overScreenshot && "cursor-grab",
      )}
      {...handlers}
    >
      <input
        id={pickerId}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={onPickerChange}
      />
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
          className="pointer-events-none absolute inset-0 flex items-center justify-center p-8"
        >
          {/* The hit box repeats the box that `usePreviewCanvas` gives the
              canvas, so the pointer turns over the Frame and stays an arrow
              on the surface around it. */}
          <span
            className="pointer-events-auto flex h-full max-w-full cursor-pointer items-center justify-center"
            style={{
              aspectRatio: `${String(session.composition.width)} / ${String(session.composition.height)}`,
            }}
          >
            {/* The Composition renders behind this prompt, and its Background is
                the user's to choose, so the prompt states its own surface. */}
            <span className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-10 py-8 text-center text-card-foreground shadow-lg">
              <span className="flex size-11 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm">
                <Upload className="size-4" aria-hidden="true" />
              </span>
              <span className="flex flex-col items-center gap-1">
                <span className="text-base font-medium tracking-tight">Drop a screenshot</span>
                <span className="text-sm text-muted-foreground">or paste (Ctrl/Cmd+V)</span>
              </span>
              <span className={buttonVariants()}>Choose a file</span>
            </span>
          </span>
        </Label>
      )}
    </div>
  );
}
