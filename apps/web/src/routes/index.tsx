import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  isFileDrag,
  isTextFieldTarget,
  placeLine,
  type PlaceOutcome,
  type PlaceSource,
} from "../chrome";
import { createIndexedDbStore } from "../indexed-db-store";
import { createSession, type StudioSession } from "../session";

const CATALOG_DEFAULT_SOLID = { type: "solid" as const, color: "#E4E4E7" };

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const [session, setSession] = useState<StudioSession | null>(null);

  useEffect(() => {
    void createSession({
      defaultSolid: CATALOG_DEFAULT_SOLID,
      store: createIndexedDbStore(),
    }).then(setSession);
  }, []);

  if (session === null) {
    return null;
  }

  return (
    <main className="flex h-svh min-h-svh min-w-[48rem] gap-6 p-6">
      <section className="min-h-0 min-w-0 flex-1">
        <Preview session={session} />
      </section>
      <aside className="flex w-80 shrink-0 flex-col gap-6 overflow-y-auto rounded-lg border border-border bg-card p-4 text-card-foreground">
        <section>
          <h2 className="text-sm font-medium">Background</h2>
        </section>
        <section>
          <h2 className="text-sm font-medium">Placement</h2>
        </section>
        <section>
          <h2 className="text-sm font-medium">Effects</h2>
        </section>
      </aside>
    </main>
  );
}

function filesFrom(data: DataTransfer | null): File[] {
  if (data === null) {
    return [];
  }
  if (data.files.length > 0) {
    return Array.from(data.files);
  }
  const files: File[] = [];
  for (const item of data.items) {
    if (item.kind !== "file") {
      continue;
    }
    const file = item.getAsFile();
    if (file !== null) {
      files.push(file);
    }
  }
  return files;
}

function Preview({ session }: { session: StudioSession }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [generation, setGeneration] = useState(0);
  const [line, setLine] = useState<string | null>(null);
  const [fileDrag, setFileDrag] = useState(false);
  const occupied = session.composition.screenshot !== null;

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
      if (outcome === "ok") {
        setGeneration((current) => current + 1);
      }
    },
    [session],
  );

  useEffect(() => {
    const host = hostRef.current;
    if (host === null) {
      return;
    }
    let cancelled = false;
    void session.render().then((canvas) => {
      if (cancelled) {
        return;
      }
      canvas.className =
        "block max-h-full max-w-full border border-border object-contain [aspect-ratio:16/9]";
      host.replaceChildren(canvas);
    });
    return () => {
      cancelled = true;
      host.replaceChildren();
    };
  }, [generation, session]);

  useEffect(() => {
    let dragDepth = 0;

    function hasFiles(event: DragEvent): boolean {
      return event.dataTransfer !== null && isFileDrag([...event.dataTransfer.types]);
    }

    function onDragEnter(event: DragEvent) {
      if (!hasFiles(event)) {
        return;
      }
      event.preventDefault();
      dragDepth += 1;
      setFileDrag(true);
    }

    function onDragOver(event: DragEvent) {
      if (event.dataTransfer === null || !isFileDrag([...event.dataTransfer.types])) {
        return;
      }
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
    }

    function onDragLeave(event: DragEvent) {
      if (!hasFiles(event)) {
        return;
      }
      dragDepth -= 1;
      if (dragDepth <= 0) {
        dragDepth = 0;
        setFileDrag(false);
      }
    }

    function onDrop(event: DragEvent) {
      dragDepth = 0;
      setFileDrag(false);
      const files = filesFrom(event.dataTransfer);
      if (files.length === 0) {
        return;
      }
      event.preventDefault();
      void place("drop", files);
    }

    function onPaste(event: ClipboardEvent) {
      const files = filesFrom(event.clipboardData);
      if (isTextFieldTarget(document.activeElement) && files.length === 0) {
        return;
      }
      event.preventDefault();
      void place("paste", files);
    }

    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onDrop);
    window.addEventListener("paste", onPaste);
    return () => {
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("drop", onDrop);
      window.removeEventListener("paste", onPaste);
    };
  }, [place]);

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
      <div
        className={
          fileDrag ? "relative min-h-0 flex-1 ring-2 ring-ring" : "relative min-h-0 flex-1"
        }
      >
        <div ref={hostRef} className="h-full w-full" />
        {occupied ? null : (
          <label className="absolute inset-0 flex cursor-pointer items-center justify-center">
            <span className="flex flex-col items-center gap-2 text-center">
              <span className="text-base font-medium">Drop a screenshot</span>
              <span className="text-sm text-muted-foreground">or paste (Ctrl/Cmd+V)</span>
              <span className="rounded-lg bg-primary px-3 py-1.5 text-sm text-primary-foreground">
                Choose a file
              </span>
            </span>
            <input type="file" accept="image/*" className="sr-only" onChange={onPickerChange} />
          </label>
        )}
      </div>
      {line === null ? null : <p className="mt-2 text-sm text-muted-foreground">{line}</p>}
    </div>
  );
}
