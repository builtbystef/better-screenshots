import { createFileRoute } from "@tanstack/react-router";
import { Download, Plus, Upload, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import {
  aspectPresetFor,
  aspectPresets,
  catalogDefaultSolid,
  catalogGradientFor,
  catalogGradients,
  catalogSolidFor,
  catalogSolids,
} from "../catalog";
import { filesFrom, hitsDrawn, isFileDrag, isTextFieldTarget, positionFromDrag } from "../drag";
import { createIndexedDbStore } from "../indexed-db-store";
import {
  exportLine,
  placeLine,
  uploadLine,
  type PlaceOutcome,
  type PlaceSource,
} from "../messages";
import {
  formatInteger,
  formatScale,
  parseHex,
  parseInteger,
  parseNonNegativeInteger,
  parseOpacityPercent,
  parseScale,
} from "../parse";
import {
  createSession,
  type BrowserWindow,
  type GradientBackground,
  type HexColor,
  type StudioSession,
} from "../session";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const [session, setSession] = useState<StudioSession | null>(null);
  const [revision, setRevision] = useState(0);
  const bump = useCallback(() => setRevision((current) => current + 1), []);

  useEffect(() => {
    void createSession({
      defaultSolid: catalogDefaultSolid,
      store: createIndexedDbStore(),
    }).then(setSession);
  }, []);

  if (session === null) {
    return null;
  }

  return (
    <main className="flex h-svh min-h-svh min-w-[48rem] bg-background">
      <h1 className="sr-only">Better Screenshots</h1>
      <section className="min-h-0 min-w-0 flex-1">
        <Preview session={session} revision={revision} onPlaced={bump} />
      </section>
      <aside className="flex w-80 shrink-0 flex-col overflow-y-auto overscroll-contain border-l border-border bg-card text-card-foreground">
        <section className="border-b border-border px-4 py-5">
          <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Frame
          </h2>
          <FrameInspector session={session} onChange={bump} />
        </section>
        <section className="border-b border-border px-4 py-5">
          <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Background
          </h2>
          <BackgroundInspector session={session} onChange={bump} />
        </section>
        <section className="border-b border-border px-4 py-5">
          <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Placement
          </h2>
          <PlacementInspector session={session} onChange={bump} />
        </section>
        <section className="border-b border-border px-4 py-5">
          <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Window
          </h2>
          <WindowInspector session={session} onChange={bump} />
        </section>
        <section className="px-4 py-5">
          <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Effects
          </h2>
          <EffectsInspector session={session} onChange={bump} />
        </section>
      </aside>
    </main>
  );
}

function previewCanvas(host: HTMLDivElement | null): HTMLCanvasElement | null {
  const child = host?.firstElementChild;
  return child instanceof HTMLCanvasElement ? child : null;
}

function Preview({
  session,
  revision,
  onPlaced,
}: {
  session: StudioSession;
  revision: number;
  onPlaced: () => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    origin: { x: number; y: number };
    start: { x: number; y: number };
    previewWidth: number;
  } | null>(null);
  const pickerId = useId();
  const [line, setLine] = useState<string | null>(null);
  const [fileDrag, setFileDrag] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [overShot, setOverShot] = useState(false);
  const occupied = session.composition.screenshot !== null;
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
      if (outcome === "ok") {
        onPlaced();
      }
    },
    [onPlaced, session],
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
        "block max-h-full max-w-full border border-border object-contain shadow-[0_28px_80px_-28px_rgba(0,0,0,0.45)]";
      canvas.style.aspectRatio = `${String(session.composition.width)} / ${String(session.composition.height)}`;
      host.replaceChildren(canvas);
    });
    return () => {
      cancelled = true;
    };
  }, [revision, session]);

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

  async function onExport() {
    if (exportDisabled) {
      return;
    }
    setLine(null);
    setExporting(true);
    try {
      const result = await session.exportPng(new Date());
      setLine(exportLine(result === "refuse" ? "refuse" : "ok"));
      if (result === "refuse") {
        return;
      }
      const url = URL.createObjectURL(result.blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = result.filename;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  function screenshotHit(clientX: number, clientY: number): boolean {
    const canvas = previewCanvas(hostRef.current);
    const drawn = session.placement?.drawn;
    if (canvas === null || drawn === undefined || canvas.clientWidth === 0) {
      return false;
    }
    const bounds = canvas.getBoundingClientRect();
    return hitsDrawn({
      point: { x: clientX, y: clientY },
      rect: {
        left: bounds.left,
        top: bounds.top,
        clientWidth: canvas.clientWidth,
        clientLeft: canvas.clientLeft,
      },
      drawn,
      compositionWidth: session.composition.width,
    });
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || event.button !== 0 || !occupied) {
      return;
    }
    if (!screenshotHit(event.clientX, event.clientY)) {
      return;
    }
    const canvas = previewCanvas(hostRef.current);
    if (canvas === null || canvas.clientWidth === 0) {
      return;
    }
    dragRef.current = {
      origin: { ...session.composition.position },
      start: { x: event.clientX, y: event.clientY },
      previewWidth: canvas.clientWidth,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setOverShot(true);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary) {
      return;
    }
    const drag = dragRef.current;
    if (drag === null) {
      setOverShot(occupied && screenshotHit(event.clientX, event.clientY));
      return;
    }
    if (event.clientX === drag.start.x && event.clientY === drag.start.y) {
      return;
    }
    setDragging(true);
    const next = positionFromDrag({
      origin: drag.origin,
      start: drag.start,
      current: { x: event.clientX, y: event.clientY },
      previewWidth: drag.previewWidth,
      compositionWidth: session.composition.width,
    });
    if (session.setPosition(next.x, next.y) === "ok") {
      onPlaced();
    }
  }

  function endDrag() {
    if (dragRef.current === null) {
      return;
    }
    dragRef.current = null;
    setDragging(false);
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary) {
      return;
    }
    endDrag();
    setOverShot(occupied && screenshotHit(event.clientX, event.clientY));
  }

  function onPointerCancel(event: PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary) {
      return;
    }
    endDrag();
    setOverShot(false);
  }

  function onPointerLeave() {
    if (dragRef.current === null) {
      setOverShot(false);
    }
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
          <label
            htmlFor={pickerId}
            className="inline-flex cursor-pointer items-center rounded-md px-3 py-1.5 text-sm text-secondary-foreground transition-colors hover:bg-accent"
          >
            Replace
          </label>
        ) : null}
        <button
          type="button"
          disabled={exportDisabled}
          className={
            exportDisabled
              ? "inline-flex cursor-default items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground"
              : "inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground transition-opacity hover:opacity-90"
          }
          onClick={() => {
            void onExport();
          }}
        >
          <Download className="size-3.5" aria-hidden="true" />
          Export
        </button>
      </div>
      <div
        className={
          "studio-well relative min-h-0 flex-1" +
          (fileDrag ? " ring-2 ring-inset ring-ring" : "") +
          (occupied ? " touch-none" : "") +
          (dragging ? " cursor-grabbing" : overShot ? " cursor-grab" : "")
        }
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onPointerLeave={onPointerLeave}
      >
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div ref={hostRef} className="flex h-full w-full items-center justify-center" />
        </div>
        {fileDrag ? (
          <div className="pointer-events-none absolute inset-5 rounded-xl border-2 border-dashed border-ring" />
        ) : null}
        {occupied ? null : (
          <label
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
              <span className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground">
                Choose a file
              </span>
            </span>
          </label>
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

function gradientCss(value: GradientBackground): string {
  const stops = value.stops.map((stop) => `${stop.color} ${stop.offset * 100}%`).join(", ");
  return `linear-gradient(${value.angle}deg, ${stops})`;
}

function chipClass(selected: boolean): string {
  return selected
    ? "aspect-square w-full rounded-md border border-border ring-2 ring-ring ring-offset-2 ring-offset-card"
    : "aspect-square w-full rounded-md border border-border transition-[box-shadow] hover:ring-2 hover:ring-ring/40 hover:ring-offset-2 hover:ring-offset-card";
}

function BackgroundInspector({
  session,
  onChange,
}: {
  session: StudioSession;
  onChange: () => void;
}) {
  const pickerId = useId();
  const background = session.composition.background;
  const currentSolid = background.type === "solid" ? background.color : null;
  const currentImageId = background.type === "image" ? background.id : null;
  const selectedSolid = currentSolid === null ? undefined : catalogSolidFor(currentSolid);
  const selectedGradient =
    background.type === "gradient" ? catalogGradientFor(background) : undefined;
  const addDisabled = session.storage === "unavailable";
  const images = session.uploadedBackgrounds.toReversed();
  const [hexDraft, setHexDraft] = useState(currentSolid ?? "");
  const [lastSolid, setLastSolid] = useState(currentSolid ?? "#000000");
  const [line, setLine] = useState<string | null>(null);

  function writeSolid(color: HexColor) {
    if (session.setBackground({ type: "solid", color }) !== "ok") {
      return;
    }
    setLastSolid(color);
    setHexDraft(color);
    onChange();
  }

  function writeGradient(value: GradientBackground) {
    if (session.setBackground(value) !== "ok") {
      return;
    }
    setHexDraft("");
    onChange();
  }

  function commitHex() {
    const parsed = parseHex(hexDraft);
    if (parsed === "refuse") {
      setHexDraft(currentSolid ?? "");
      return;
    }
    writeSolid(parsed);
  }

  function onHexKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") {
      return;
    }
    event.preventDefault();
    commitHex();
  }

  function onNativeChange(event: ChangeEvent<HTMLInputElement>) {
    writeSolid(event.target.value);
  }

  function writeImage(id: string) {
    if (session.setBackground({ type: "image", id }) !== "ok") {
      return;
    }
    setHexDraft("");
    onChange();
  }

  async function removeImage(id: string) {
    await session.removeBackground(id);
    onChange();
  }

  async function onAddChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file === undefined) {
      return;
    }
    const result = await session.uploadBackground(file, file.name);
    if (result === "undecodable" || result === "quota" || result === "unavailable") {
      setLine(uploadLine(result));
      return;
    }
    setLine(null);
    writeImage(result.id);
  }

  return (
    <div className="mt-4 flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h3 className="text-[11px] text-muted-foreground">Solid</h3>
        <div className="grid grid-cols-4 gap-2 p-0.5">
          {catalogSolids.map((entry) => {
            const selected = selectedSolid?.name === entry.name;
            return (
              <button
                key={entry.color}
                type="button"
                title={entry.name}
                aria-label={entry.name}
                className={chipClass(selected)}
                style={{ backgroundColor: entry.color }}
                onClick={() => {
                  if (selected) {
                    return;
                  }
                  writeSolid(entry.color);
                }}
              />
            );
          })}
        </div>
        <div className="flex overflow-hidden rounded-md border border-input">
          <input
            type="text"
            value={hexDraft}
            placeholder="#RRGGBB"
            spellCheck={false}
            autoComplete="off"
            aria-label="Background color"
            className="min-w-0 flex-1 border-0 bg-transparent px-2.5 py-1.5 font-mono text-sm outline-none"
            onChange={(event) => setHexDraft(event.target.value)}
            onBlur={commitHex}
            onKeyDown={onHexKeyDown}
          />
          <input
            type="color"
            value={currentSolid ?? lastSolid}
            disabled={currentSolid === null}
            aria-label="Background color picker"
            className={
              currentSolid === null
                ? "studio-swatch size-8 shrink-0 cursor-default border-0 border-l border-input"
                : "studio-swatch size-8 shrink-0 cursor-pointer border-0 border-l border-input"
            }
            onChange={onNativeChange}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-[11px] text-muted-foreground">Gradient</h3>
        <div className="grid grid-cols-4 gap-2 p-0.5">
          {catalogGradients.map((entry) => {
            const selected = selectedGradient?.name === entry.name;
            return (
              <button
                key={entry.name}
                type="button"
                title={entry.name}
                aria-label={entry.name}
                className={chipClass(selected)}
                style={{ backgroundImage: gradientCss(entry.value) }}
                onClick={() => {
                  if (selected) {
                    return;
                  }
                  writeGradient(entry.value);
                }}
              />
            );
          })}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-[11px] text-muted-foreground">Image</h3>
        <ul className="grid grid-cols-3 gap-2">
          {images.map((record) => {
            const current = record.id === currentImageId;
            return (
              <li key={record.id} className="relative">
                <button
                  type="button"
                  title={record.filename}
                  aria-label={record.filename}
                  className={
                    current
                      ? "block w-full overflow-hidden rounded-md ring-2 ring-ring ring-offset-2 ring-offset-card"
                      : "block w-full overflow-hidden rounded-md border border-border"
                  }
                  onClick={() => writeImage(record.id)}
                >
                  <ImageThumbnail blob={record.blob} />
                </button>
                <button
                  type="button"
                  aria-label={`Remove ${record.filename}`}
                  disabled={current}
                  className={
                    current
                      ? "absolute top-1 right-1 flex size-5 cursor-default items-center justify-center rounded-sm bg-card/90 text-muted-foreground"
                      : "absolute top-1 right-1 flex size-5 cursor-pointer items-center justify-center rounded-sm bg-card/90 text-foreground shadow-sm"
                  }
                  onClick={() => {
                    void removeImage(record.id);
                  }}
                >
                  <X className="size-3" aria-hidden="true" />
                </button>
              </li>
            );
          })}
          <li>
            <input
              id={pickerId}
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={addDisabled}
              onClick={() => setLine(null)}
              onChange={(event) => {
                void onAddChange(event);
              }}
            />
            <label
              htmlFor={pickerId}
              className={
                addDisabled
                  ? "flex aspect-square cursor-default flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border text-[11px] text-muted-foreground"
                  : "flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border text-[11px] transition-colors hover:bg-accent"
              }
            >
              <Plus className="size-3.5" aria-hidden="true" />
              Add
            </label>
          </li>
        </ul>
        {line === null ? null : <p className="text-sm text-muted-foreground">{line}</p>}
      </div>
    </div>
  );
}

function ImageThumbnail({ blob }: { blob: Blob }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    const url = URL.createObjectURL(blob);
    setSrc(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [blob]);

  if (src === "") {
    return <span className="block aspect-square w-full bg-muted" />;
  }
  return <img src={src} alt="" className="block aspect-square w-full object-cover" />;
}

const numberChromeClass =
  "min-w-0 rounded-md border border-input bg-background px-1.5 py-1 text-right font-mono text-xs tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";
const numberFieldClass = `${numberChromeClass} w-12`;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function textChipClass(selected: boolean): string {
  return selected
    ? "rounded-md border border-border bg-background px-2 py-1.5 text-center text-[11px] font-medium ring-2 ring-ring ring-offset-2 ring-offset-card"
    : "rounded-md border border-border px-2 py-1.5 text-center text-[11px] text-muted-foreground transition-[box-shadow] hover:ring-2 hover:ring-ring/40 hover:ring-offset-2 hover:ring-offset-card";
}

function FrameInspector({ session, onChange }: { session: StudioSession; onChange: () => void }) {
  const selected = aspectPresetFor(session.composition.width, session.composition.height);

  function writePreset(width: number, height: number) {
    if (session.setSize(width, height) === "ok") {
      onChange();
    }
  }

  return (
    <div className="mt-4 grid grid-cols-4 gap-2 p-0.5">
      {aspectPresets.map((preset) => {
        const isSelected = selected?.name === preset.name;
        return (
          <button
            key={preset.name}
            type="button"
            title={`${String(preset.width)}×${String(preset.height)}`}
            aria-label={`${preset.name} ${String(preset.width)}×${String(preset.height)}`}
            className={textChipClass(isSelected)}
            onClick={() => {
              if (isSelected) {
                return;
              }
              writePreset(preset.width, preset.height);
            }}
          >
            {preset.name}
          </button>
        );
      })}
    </div>
  );
}

const windowSchemes: ReadonlyArray<{ name: string; value: BrowserWindow }> = [
  { name: "None", value: "none" },
  { name: "Light", value: "light" },
  { name: "Dark", value: "dark" },
];

function WindowInspector({ session, onChange }: { session: StudioSession; onChange: () => void }) {
  const { browserWindow, url } = session.composition;

  return (
    <div className="mt-4 flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2 p-0.5">
        {windowSchemes.map((entry) => {
          const selected = browserWindow === entry.value;
          return (
            <button
              key={entry.value}
              type="button"
              aria-label={entry.name}
              className={textChipClass(selected)}
              onClick={() => {
                if (selected) {
                  return;
                }
                if (session.setBrowserWindow(entry.value) === "ok") {
                  onChange();
                }
              }}
            >
              {entry.name}
            </button>
          );
        })}
      </div>
      <input
        type="text"
        value={url}
        placeholder="example.com"
        spellCheck={false}
        autoComplete="off"
        aria-label="URL"
        className="min-w-0 rounded-md border border-input bg-background px-2.5 py-1.5 font-mono text-sm outline-none"
        onChange={(event) => {
          session.setUrl(event.target.value);
          onChange();
        }}
      />
    </div>
  );
}

function PlacementInspector({
  session,
  onChange,
}: {
  session: StudioSession;
  onChange: () => void;
}) {
  const { padding, scale, position } = session.composition;

  return (
    <div className="mt-4 flex flex-col gap-3">
      <KnobRow
        label="Padding"
        value={padding}
        min={0}
        max={400}
        step={1}
        format={formatInteger}
        parse={parseNonNegativeInteger}
        onWrite={(value) => {
          if (session.setPadding(value) === "ok") {
            onChange();
          }
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
          if (session.setScale(value) === "ok") {
            onChange();
          }
        }}
      />
      <PositionRow
        x={position.x}
        y={position.y}
        onWrite={(x, y) => {
          if (session.setPosition(x, y) === "ok") {
            onChange();
          }
        }}
      />
    </div>
  );
}

function EffectsInspector({ session, onChange }: { session: StudioSession; onChange: () => void }) {
  const { shadow, border, radius } = session.composition;

  function writeShadow(next: { offset?: number; blur?: number; opacity?: number }) {
    if (
      session.setShadow(
        next.offset ?? shadow.offset,
        next.blur ?? shadow.blur,
        next.opacity ?? shadow.opacity,
      ) === "ok"
    ) {
      onChange();
    }
  }

  function writeBorder(next: { width?: number; color?: HexColor }) {
    if (session.setBorder(next.width ?? border.width, next.color ?? border.color) === "ok") {
      onChange();
    }
  }

  return (
    <div className="mt-4 flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <h3 className="text-[11px] text-muted-foreground">Shadow</h3>
        <KnobRow
          label="Offset"
          value={shadow.offset}
          min={0}
          max={64}
          step={1}
          format={formatInteger}
          parse={parseNonNegativeInteger}
          onWrite={(offset) => writeShadow({ offset })}
        />
        <KnobRow
          label="Blur"
          value={shadow.blur}
          min={0}
          max={80}
          step={1}
          format={formatInteger}
          parse={parseNonNegativeInteger}
          onWrite={(blur) => writeShadow({ blur })}
        />
        <KnobRow
          label="Opacity"
          value={Math.round(shadow.opacity * 100)}
          min={0}
          max={100}
          step={1}
          format={formatInteger}
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
          format={formatInteger}
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
        format={formatInteger}
        parse={parseNonNegativeInteger}
        onWrite={(value) => {
          if (session.setRadius(value) === "ok") {
            onChange();
          }
        }}
      />
    </div>
  );
}

function KnobRow({
  label,
  value,
  min,
  max,
  step,
  format,
  parse,
  onWrite,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  parse: (raw: string) => number | "refuse";
  onWrite: (value: number) => void;
}) {
  const [draft, setDraft] = useState(format(value));

  useEffect(() => {
    setDraft(format(value));
  }, [format, value]);

  function commit() {
    const parsed = parse(draft);
    if (parsed === "refuse") {
      setDraft(format(value));
      return;
    }
    onWrite(parsed);
    setDraft(format(parsed));
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      return;
    }
    if (event.key !== "Enter") {
      return;
    }
    event.preventDefault();
    commit();
  }

  const thumb = clamp(value, min, max);
  const fill = max === min ? 0 : ((thumb - min) / (max - min)) * 100;

  return (
    <div className="grid grid-cols-[3.75rem_1fr_3rem] items-center gap-2">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={thumb}
        aria-label={label}
        className="studio-slider w-full"
        style={{
          background: `linear-gradient(to right, var(--foreground) ${fill}%, var(--muted) ${fill}%)`,
        }}
        onChange={(event) => onWrite(Number(event.target.value))}
      />
      <input
        type="number"
        value={draft}
        step="any"
        spellCheck={false}
        autoComplete="off"
        aria-label={label}
        className={numberFieldClass}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={onKeyDown}
      />
    </div>
  );
}

function PositionRow({
  x,
  y,
  onWrite,
}: {
  x: number;
  y: number;
  onWrite: (x: number, y: number) => void;
}) {
  const [xDraft, setXDraft] = useState(formatInteger(x));
  const [yDraft, setYDraft] = useState(formatInteger(y));

  useEffect(() => {
    setXDraft(formatInteger(x));
  }, [x]);
  useEffect(() => {
    setYDraft(formatInteger(y));
  }, [y]);

  function commitX() {
    const parsed = parseInteger(xDraft);
    if (parsed === "refuse") {
      setXDraft(formatInteger(x));
      return;
    }
    onWrite(parsed, y);
    setXDraft(formatInteger(parsed));
  }

  function commitY() {
    const parsed = parseInteger(yDraft);
    if (parsed === "refuse") {
      setYDraft(formatInteger(y));
      return;
    }
    onWrite(x, parsed);
    setYDraft(formatInteger(parsed));
  }

  function onFieldKeyDown(commit: () => void) {
    return (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault();
        return;
      }
      if (event.key !== "Enter") {
        return;
      }
      event.preventDefault();
      commit();
    };
  }

  return (
    <div className="grid grid-cols-[3.75rem_auto_1fr_auto_1fr] items-center gap-2">
      <span className="text-[11px] text-muted-foreground">Position</span>
      <span className="text-[11px] text-muted-foreground">X</span>
      <input
        type="number"
        value={xDraft}
        step="any"
        spellCheck={false}
        autoComplete="off"
        aria-label="X"
        className={`${numberChromeClass} min-w-0 w-full`}
        onChange={(event) => setXDraft(event.target.value)}
        onBlur={commitX}
        onKeyDown={onFieldKeyDown(commitX)}
      />
      <span className="text-[11px] text-muted-foreground">Y</span>
      <input
        type="number"
        value={yDraft}
        step="any"
        spellCheck={false}
        autoComplete="off"
        aria-label="Y"
        className={`${numberChromeClass} min-w-0 w-full`}
        onChange={(event) => setYDraft(event.target.value)}
        onBlur={commitY}
        onKeyDown={onFieldKeyDown(commitY)}
      />
    </div>
  );
}

function BorderColorRow({
  color,
  onWrite,
}: {
  color: HexColor;
  onWrite: (color: HexColor) => void;
}) {
  const [hexDraft, setHexDraft] = useState(color);

  useEffect(() => {
    setHexDraft(color);
  }, [color]);

  function commitHex() {
    const parsed = parseHex(hexDraft);
    if (parsed === "refuse") {
      setHexDraft(color);
      return;
    }
    onWrite(parsed);
    setHexDraft(parsed);
  }

  function onHexKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") {
      return;
    }
    event.preventDefault();
    commitHex();
  }

  return (
    <div className="grid grid-cols-[3.75rem_1fr] items-center gap-2">
      <span className="text-[11px] text-muted-foreground">Color</span>
      <div className="flex overflow-hidden rounded-md border border-input">
        <input
          type="text"
          value={hexDraft}
          placeholder="#RRGGBB"
          spellCheck={false}
          autoComplete="off"
          aria-label="Border color"
          className="min-w-0 flex-1 border-0 bg-transparent px-2 py-1 font-mono text-xs outline-none"
          onChange={(event) => setHexDraft(event.target.value)}
          onBlur={commitHex}
          onKeyDown={onHexKeyDown}
        />
        <input
          type="color"
          value={color}
          aria-label="Border color picker"
          className="studio-swatch size-7 shrink-0 cursor-pointer border-0 border-l border-input"
          onChange={(event) => onWrite(event.target.value)}
        />
      </div>
    </div>
  );
}
