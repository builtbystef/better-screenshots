import { createFileRoute } from "@tanstack/react-router";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { catalogDefaultSolid, catalogGradients, catalogSolids } from "../catalog";
import {
  exportLine,
  isFileDrag,
  isTextFieldTarget,
  matchingGradient,
  matchingSolid,
  parseHex,
  parseInteger,
  parseOpacityPercent,
  parseScale,
  placeLine,
  uploadLine,
  type PlaceOutcome,
  type PlaceSource,
} from "../chrome";
import { createIndexedDbStore } from "../indexed-db-store";
import {
  createSession,
  type GradientBackground,
  type HexColor,
  type StudioSession,
} from "../session";

const catalogSolidColors = catalogSolids.map((entry) => entry.color);
const catalogGradientValues = catalogGradients.map((entry) => entry.value);

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
    <main className="flex h-svh min-h-svh min-w-[48rem] gap-6 p-6">
      <section className="min-h-0 min-w-0 flex-1">
        <Preview session={session} revision={revision} onPlaced={bump} />
      </section>
      <aside className="flex w-80 shrink-0 flex-col gap-6 overflow-y-auto rounded-lg border border-border bg-card p-4 text-card-foreground">
        <section>
          <h2 className="text-sm font-medium">Background</h2>
          <BackgroundInspector session={session} onChange={bump} />
        </section>
        <section>
          <h2 className="text-sm font-medium">Placement</h2>
          <PlacementInspector session={session} onChange={bump} />
        </section>
        <section>
          <h2 className="text-sm font-medium">Effects</h2>
          <EffectsInspector session={session} onChange={bump} />
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
  const pickerId = useId();
  const [line, setLine] = useState<string | null>(null);
  const [fileDrag, setFileDrag] = useState(false);
  const [exporting, setExporting] = useState(false);
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
        "block max-h-full max-w-full border border-border object-contain [aspect-ratio:16/9]";
      host.replaceChildren(canvas);
    });
    return () => {
      cancelled = true;
      host.replaceChildren();
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

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="mb-2 flex shrink-0 justify-end gap-2">
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
            className="cursor-pointer rounded-lg px-3 py-1.5 text-sm text-secondary-foreground"
          >
            Replace
          </label>
        ) : null}
        <button
          type="button"
          disabled={exportDisabled}
          className={
            exportDisabled
              ? "cursor-default rounded-lg px-3 py-1.5 text-sm text-muted-foreground"
              : "cursor-pointer rounded-lg bg-primary px-3 py-1.5 text-sm text-primary-foreground"
          }
          onClick={() => {
            void onExport();
          }}
        >
          Export
        </button>
      </div>
      <div
        className={
          fileDrag ? "relative min-h-0 flex-1 ring-2 ring-ring" : "relative min-h-0 flex-1"
        }
      >
        <div ref={hostRef} className="h-full w-full" />
        {occupied ? null : (
          <label
            htmlFor={pickerId}
            className="absolute inset-0 flex cursor-pointer items-center justify-center"
          >
            <span className="flex flex-col items-center gap-2 text-center">
              <span className="text-base font-medium">Drop a screenshot</span>
              <span className="text-sm text-muted-foreground">or paste (Ctrl/Cmd+V)</span>
              <span className="rounded-lg bg-primary px-3 py-1.5 text-sm text-primary-foreground">
                Choose a file
              </span>
            </span>
          </label>
        )}
      </div>
      {line === null ? null : <p className="mt-2 text-sm text-muted-foreground">{line}</p>}
    </div>
  );
}

function gradientCss(value: GradientBackground): string {
  const stops = value.stops.map((stop) => `${stop.color} ${stop.offset * 100}%`).join(", ");
  return `linear-gradient(${value.angle}deg, ${stops})`;
}

function chipClass(selected: boolean): string {
  return selected
    ? "size-7 shrink-0 rounded-none border border-border ring-2 ring-ring ring-offset-2 ring-offset-card"
    : "size-7 shrink-0 rounded-none border border-border";
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
  const selectedSolid =
    currentSolid === null ? null : matchingSolid(currentSolid, catalogSolidColors);
  const selectedGradient =
    background.type === "gradient" ? matchingGradient(background, catalogGradientValues) : null;
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
    <div className="mt-3 flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-medium text-muted-foreground">Solid</h3>
        <div className="flex flex-wrap gap-1.5 p-1">
          {catalogSolids.map((entry) => {
            const selected = selectedSolid === entry.color;
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
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={hexDraft}
            placeholder="#RRGGBB"
            spellCheck={false}
            autoComplete="off"
            className="min-w-0 flex-1 border border-input bg-background px-2 py-1 text-sm"
            onChange={(event) => setHexDraft(event.target.value)}
            onBlur={commitHex}
            onKeyDown={onHexKeyDown}
          />
          <input
            type="color"
            value={currentSolid ?? lastSolid}
            className="size-7 shrink-0 cursor-pointer border border-input bg-background p-0"
            onChange={onNativeChange}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-medium text-muted-foreground">Gradient</h3>
        <div className="flex flex-wrap gap-1.5 p-1">
          {catalogGradients.map((entry) => {
            const selected = selectedGradient === entry.value;
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
        <h3 className="text-xs font-medium text-muted-foreground">Image</h3>
        <ul className="flex flex-col gap-1.5">
          {images.map((record) => {
            const current = record.id === currentImageId;
            return (
              <li key={record.id} className="flex items-center gap-2">
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm"
                  onClick={() => writeImage(record.id)}
                >
                  <ImageThumbnail blob={record.blob} />
                  <span className="min-w-0 truncate">{record.filename}</span>
                </button>
                <button
                  type="button"
                  aria-label={`Remove ${record.filename}`}
                  disabled={current}
                  className={
                    current
                      ? "shrink-0 cursor-default px-1 text-sm text-muted-foreground"
                      : "shrink-0 cursor-pointer px-1 text-sm"
                  }
                  onClick={() => {
                    void removeImage(record.id);
                  }}
                >
                  X
                </button>
              </li>
            );
          })}
        </ul>
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
            addDisabled ? "cursor-default text-sm text-muted-foreground" : "cursor-pointer text-sm"
          }
        >
          Add
        </label>
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
    return <span className="size-7 shrink-0 border border-border bg-background" />;
  }
  return <img src={src} alt="" className="size-7 shrink-0 border border-border object-cover" />;
}

const numberChromeClass =
  "min-w-0 border border-input bg-background px-1.5 py-1 text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";
const numberFieldClass = `${numberChromeClass} w-14`;

function parseNonNegativeInteger(raw: string): number | "refuse" {
  const parsed = parseInteger(raw);
  return parsed === "refuse" || parsed < 0 ? "refuse" : parsed;
}

function formatInteger(value: number): string {
  return String(value);
}

function formatScale(value: number): string {
  return value.toFixed(2);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
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
    <div className="mt-3 flex flex-col gap-2">
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
    <div className="mt-3 flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-medium text-muted-foreground">Shadow</h3>
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
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-medium text-muted-foreground">Border</h3>
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

  return (
    <div className="grid grid-cols-[4.5rem_1fr_3.5rem] items-center gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={clamp(value, min, max)}
        aria-label={label}
        className="w-full accent-primary"
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
    <div className="grid grid-cols-[4.5rem_1fr_1fr] items-center gap-2">
      <span className="text-xs text-muted-foreground">Position</span>
      <input
        type="number"
        value={xDraft}
        step="any"
        spellCheck={false}
        autoComplete="off"
        aria-label="X"
        className={`${numberChromeClass} w-full`}
        onChange={(event) => setXDraft(event.target.value)}
        onBlur={commitX}
        onKeyDown={onFieldKeyDown(commitX)}
      />
      <input
        type="number"
        value={yDraft}
        step="any"
        spellCheck={false}
        autoComplete="off"
        aria-label="Y"
        className={`${numberChromeClass} w-full`}
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
    <div className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-2">
      <span className="text-xs text-muted-foreground">Color</span>
      <input
        type="text"
        value={hexDraft}
        placeholder="#RRGGBB"
        spellCheck={false}
        autoComplete="off"
        aria-label="Border color"
        className="min-w-0 border border-input bg-background px-2 py-1 text-sm"
        onChange={(event) => setHexDraft(event.target.value)}
        onBlur={commitHex}
        onKeyDown={onHexKeyDown}
      />
      <input
        type="color"
        value={color}
        aria-label="Border color picker"
        className="size-7 shrink-0 cursor-pointer border border-input bg-background p-0"
        onChange={(event) => onWrite(event.target.value)}
      />
    </div>
  );
}
