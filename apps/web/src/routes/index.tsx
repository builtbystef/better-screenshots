import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { createFileRoute } from "@tanstack/react-router";
import { cva } from "class-variance-authority";
import { Download, Plus, Upload, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ChangeEvent,
  type PointerEvent,
  type ReactNode,
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
import { useDraft } from "../hooks/use-draft";
import { createIndexedDbStore } from "../indexed-db-store";
import {
  changeLine,
  exportLine,
  placeLine,
  uploadLine,
  type PlaceOutcome,
  type PlaceSource,
} from "../messages";
import {
  formatScale,
  parseHex,
  parseInteger,
  parseNonNegativeInteger,
  parseOpacityPercent,
  parseScale,
} from "../parse";
import {
  createSession,
  type Border,
  type BrowserWindow,
  type GradientBackground,
  type HexColor,
  type Point,
  type Shadow,
  type StudioSession,
} from "../session";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const [session, setSession] = useState<StudioSession | null>(null);

  useEffect(() => {
    void createSession({
      defaultSolid: catalogDefaultSolid,
      store: createIndexedDbStore(),
    }).then(setSession);
  }, []);

  return session === null ? null : <Studio session={session} />;
}

function Studio({ session }: { session: StudioSession }) {
  const sessionVersion = useSyncExternalStore(
    session.subscribe,
    () => session.version,
    () => session.version,
  );

  return (
    <main className="flex h-svh min-h-svh min-w-[48rem] bg-background">
      <h1 className="sr-only">Better Screenshots</h1>
      <section className="min-h-0 min-w-0 flex-1">
        <Preview session={session} sessionVersion={sessionVersion} />
      </section>
      <aside className="flex w-80 shrink-0 flex-col overflow-y-auto overscroll-contain border-l border-border bg-card text-card-foreground">
        <InspectorSection title="Frame">
          <FrameInspector session={session} />
        </InspectorSection>
        <Separator />
        <InspectorSection title="Background">
          <BackgroundInspector session={session} />
        </InspectorSection>
        <Separator />
        <InspectorSection title="Placement">
          <PlacementInspector session={session} />
        </InspectorSection>
        <Separator />
        <InspectorSection title="Window">
          <WindowInspector session={session} />
        </InspectorSection>
        <Separator />
        <InspectorSection title="Effects">
          <EffectsInspector session={session} />
        </InspectorSection>
      </aside>
    </main>
  );
}

function InspectorSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="shrink-0 rounded-none bg-transparent py-5 ring-0">
      <CardHeader>
        <CardTitle className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          <h2>{title}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function previewCanvas(host: HTMLDivElement | null): HTMLCanvasElement | null {
  const child = host?.firstElementChild;
  return child instanceof HTMLCanvasElement ? child : null;
}

function Preview({ session, sessionVersion }: { session: StudioSession; sessionVersion: number }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    origin: Point;
    start: Point;
    previewWidth: number;
  } | null>(null);
  const pickerId = useId();
  const [line, setLine] = useState<string | null>(null);
  const [fileDrag, setFileDrag] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [overScreenshot, setOverScreenshot] = useState(false);
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
        "block max-h-full max-w-full border border-border object-contain shadow-[0_28px_80px_-28px_rgba(0,0,0,0.45)]";
      canvas.style.aspectRatio = `${String(session.composition.width)} / ${String(session.composition.height)}`;
      host.replaceChildren(canvas);
    });
    return () => {
      cancelled = true;
    };
  }, [session, sessionVersion]);

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
        clientTop: canvas.clientTop,
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
    setOverScreenshot(true);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary) {
      return;
    }
    const drag = dragRef.current;
    if (drag === null) {
      setOverScreenshot(occupied && screenshotHit(event.clientX, event.clientY));
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
    const outcome = session.setPosition(next.x, next.y);
    setLine(changeLine(outcome));
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
    setOverScreenshot(occupied && screenshotHit(event.clientX, event.clientY));
  }

  function onPointerCancel(event: PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary) {
      return;
    }
    endDrag();
    setOverScreenshot(false);
  }

  function onPointerLeave() {
    if (dragRef.current === null) {
      setOverScreenshot(false);
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
            void onExport();
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

function gradientCss(value: GradientBackground): string {
  const stops = value.stops.map((stop) => `${stop.color} ${stop.offset * 100}%`).join(", ");
  return `linear-gradient(${value.angle}deg, ${stops})`;
}

const inspectorField = cva("font-mono", {
  variants: {
    field: {
      number:
        "px-1.5 py-1 text-right text-xs tabular-nums md:text-xs [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
      hex: "flex-1 rounded-none border-0 bg-transparent focus-visible:ring-0",
    },
  },
});

const chipGroup = "grid w-full items-stretch gap-2 p-0.5";

const chipItem = cva(
  "h-auto w-full rounded-md border border-border ring-offset-card transition-[box-shadow] data-pressed:ring-2 data-pressed:ring-ring data-pressed:ring-offset-2 not-data-pressed:hover:ring-2 not-data-pressed:hover:ring-ring/40 not-data-pressed:hover:ring-offset-2",
  {
    variants: {
      chip: {
        swatch: "aspect-square p-0",
        text: "px-2 py-1.5 text-[11px] not-data-pressed:text-muted-foreground",
      },
    },
  },
);

function BackgroundInspector({ session }: { session: StudioSession }) {
  const pickerId = useId();
  const background = session.composition.background;
  const currentSolid = background.type === "solid" ? background.color : null;
  const currentImageId = background.type === "image" ? background.id : null;
  const selectedSolid = currentSolid === null ? undefined : catalogSolidFor(currentSolid);
  const selectedGradient =
    background.type === "gradient" ? catalogGradientFor(background) : undefined;
  const addDisabled = session.storage === "unavailable";
  const images = session.uploadedBackgrounds.toReversed();
  const [lastSolid, setLastSolid] = useState(currentSolid ?? "#000000");
  const [line, setLine] = useState<string | null>(null);
  const {
    draft: hexDraft,
    setDraft: setHexDraft,
    onBlur: commitHex,
    onKeyDown: onHexKeyDown,
  } = useDraft(currentSolid ?? "", parseHex, writeSolid);

  function writeSolid(color: HexColor) {
    if (session.setBackground({ type: "solid", color }) === "ok") {
      setLastSolid(color);
    }
  }

  function writeGradient(value: GradientBackground) {
    session.setBackground(value);
  }

  function onNativeChange(event: ChangeEvent<HTMLInputElement>) {
    const color = parseHex(event.target.value);
    if (color !== "refuse") {
      writeSolid(color);
    }
  }

  function writeImage(id: string) {
    session.setBackground({ type: "image", id });
  }

  async function removeImage(id: string) {
    setLine(changeLine(await session.removeBackground(id)));
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
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h3 className="text-[11px] text-muted-foreground">Solid</h3>
        <ToggleGroup
          className={cn(chipGroup, "grid-cols-4")}
          value={selectedSolid === undefined ? [] : [selectedSolid.name]}
        >
          {catalogSolids.map((entry) => (
            <ToggleGroupItem
              key={entry.color}
              value={entry.name}
              title={entry.name}
              aria-label={entry.name}
              className={chipItem({ chip: "swatch" })}
              style={{ backgroundColor: entry.color }}
              onPressedChange={(pressed) => {
                if (pressed) {
                  writeSolid(entry.color);
                }
              }}
            />
          ))}
        </ToggleGroup>
        <div className="flex overflow-hidden rounded-md border border-input">
          <Input
            value={hexDraft}
            placeholder="#RRGGBB"
            spellCheck={false}
            autoComplete="off"
            aria-label="Background color"
            className={inspectorField({ field: "hex", className: "text-sm" })}
            onChange={(event) => setHexDraft(event.target.value)}
            onBlur={commitHex}
            onKeyDown={onHexKeyDown}
          />
          <input
            type="color"
            value={currentSolid ?? lastSolid}
            disabled={currentSolid === null}
            aria-label="Background color picker"
            className={cn(
              "studio-swatch size-8 shrink-0 border-0 border-l border-input",
              currentSolid === null ? "cursor-default" : "cursor-pointer",
            )}
            onChange={onNativeChange}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-[11px] text-muted-foreground">Gradient</h3>
        <ToggleGroup
          className={cn(chipGroup, "grid-cols-4")}
          value={selectedGradient === undefined ? [] : [selectedGradient.name]}
        >
          {catalogGradients.map((entry) => (
            <ToggleGroupItem
              key={entry.name}
              value={entry.name}
              title={entry.name}
              aria-label={entry.name}
              className={chipItem({ chip: "swatch" })}
              style={{ backgroundImage: gradientCss(entry.value) }}
              onPressedChange={(pressed) => {
                if (pressed) {
                  writeGradient(entry.value);
                }
              }}
            />
          ))}
        </ToggleGroup>
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-[11px] text-muted-foreground">Image</h3>
        <ul className="grid grid-cols-3 gap-2">
          {images.map((record) => {
            const current = record.id === currentImageId;
            return (
              <li key={record.id} className="relative">
                <Button
                  variant="ghost"
                  title={record.filename}
                  aria-label={record.filename}
                  className={cn(
                    "h-auto w-full overflow-hidden rounded-md p-0",
                    current
                      ? "ring-2 ring-ring ring-offset-2 ring-offset-card"
                      : "border-border hover:bg-transparent",
                  )}
                  onClick={() => writeImage(record.id)}
                >
                  <ImageThumbnail blob={record.blob} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Remove ${record.filename}`}
                  disabled={current}
                  className="absolute top-1 right-1 size-5 rounded-sm bg-card/90 shadow-sm"
                  onClick={() => {
                    void removeImage(record.id);
                  }}
                >
                  <X className="size-3" aria-hidden="true" />
                </Button>
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
            <Label
              htmlFor={pickerId}
              className={cn(
                "flex aspect-square flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border text-[11px]",
                addDisabled
                  ? "cursor-default text-muted-foreground"
                  : "cursor-pointer transition-colors hover:bg-accent",
              )}
            >
              <Plus className="size-3.5" aria-hidden="true" />
              Add
            </Label>
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

function FrameInspector({ session }: { session: StudioSession }) {
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

const windowSchemes: ReadonlyArray<{ name: string; value: BrowserWindow }> = [
  { name: "None", value: "none" },
  { name: "Light", value: "light" },
  { name: "Dark", value: "dark" },
];

function WindowInspector({ session }: { session: StudioSession }) {
  const { browserWindow, url } = session.composition;
  const [line, setLine] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <ToggleGroup className={cn(chipGroup, "grid-cols-3")} value={[browserWindow]}>
        {windowSchemes.map((entry) => (
          <ToggleGroupItem
            key={entry.value}
            value={entry.value}
            aria-label={entry.name}
            className={chipItem({ chip: "text" })}
            onPressedChange={(pressed) => {
              if (pressed) {
                session.setBrowserWindow(entry.value);
              }
            }}
          >
            {entry.name}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <Input
        value={url}
        placeholder="example.com"
        spellCheck={false}
        autoComplete="off"
        aria-label="URL"
        className="font-mono text-sm"
        onChange={(event) => {
          setLine(changeLine(session.setUrl(event.target.value)));
        }}
      />
      {line === null ? null : <p className="text-sm text-muted-foreground">{line}</p>}
    </div>
  );
}

function PlacementInspector({ session }: { session: StudioSession }) {
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

function EffectsInspector({ session }: { session: StudioSession }) {
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

function KnobRow({
  label,
  value,
  min,
  max,
  step,
  parse,
  onWrite,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format?: (value: number) => string;
  parse: (raw: string) => number | "refuse";
  onWrite: (value: number) => void;
}) {
  const { draft, setDraft, onBlur, onKeyDown } = useDraft(value, parse, onWrite, format);

  return (
    <div className="grid grid-cols-[3.75rem_1fr_3rem] items-center gap-2">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <Slider
        value={value}
        min={min}
        max={max}
        step={step}
        aria-label={label}
        onValueChange={(next) => {
          onWrite(next);
        }}
      />
      <Input
        type="number"
        value={draft}
        step="any"
        spellCheck={false}
        autoComplete="off"
        aria-label={label}
        className={inspectorField({ field: "number" })}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={onBlur}
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
  const {
    draft: xDraft,
    setDraft: setXDraft,
    onBlur: commitX,
    onKeyDown: onXKeyDown,
  } = useDraft(x, parseInteger, (nextX) => onWrite(nextX, y));
  const {
    draft: yDraft,
    setDraft: setYDraft,
    onBlur: commitY,
    onKeyDown: onYKeyDown,
  } = useDraft(y, parseInteger, (nextY) => onWrite(x, nextY));

  return (
    <div className="grid grid-cols-[3.75rem_auto_1fr_auto_1fr] items-center gap-2">
      <span className="text-[11px] text-muted-foreground">Position</span>
      <span className="text-[11px] text-muted-foreground">X</span>
      <Input
        type="number"
        value={xDraft}
        step="any"
        spellCheck={false}
        autoComplete="off"
        aria-label="X"
        className={inspectorField({ field: "number" })}
        onChange={(event) => setXDraft(event.target.value)}
        onBlur={commitX}
        onKeyDown={onXKeyDown}
      />
      <span className="text-[11px] text-muted-foreground">Y</span>
      <Input
        type="number"
        value={yDraft}
        step="any"
        spellCheck={false}
        autoComplete="off"
        aria-label="Y"
        className={inspectorField({ field: "number" })}
        onChange={(event) => setYDraft(event.target.value)}
        onBlur={commitY}
        onKeyDown={onYKeyDown}
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
  const {
    draft: hexDraft,
    setDraft: setHexDraft,
    onBlur: commitHex,
    onKeyDown: onHexKeyDown,
  } = useDraft(color, parseHex, onWrite);

  return (
    <div className="grid grid-cols-[3.75rem_1fr] items-center gap-2">
      <span className="text-[11px] text-muted-foreground">Color</span>
      <div className="flex overflow-hidden rounded-md border border-input">
        <Input
          value={hexDraft}
          placeholder="#RRGGBB"
          spellCheck={false}
          autoComplete="off"
          aria-label="Border color"
          className={inspectorField({ field: "hex", className: "h-7 px-2 text-xs md:text-xs" })}
          onChange={(event) => setHexDraft(event.target.value)}
          onBlur={commitHex}
          onKeyDown={onHexKeyDown}
        />
        <input
          type="color"
          value={color}
          aria-label="Border color picker"
          className="studio-swatch size-7 shrink-0 cursor-pointer border-0 border-l border-input"
          onChange={(event) => {
            const next = parseHex(event.target.value);
            if (next !== "refuse") {
              onWrite(next);
            }
          }}
        />
      </div>
    </div>
  );
}
