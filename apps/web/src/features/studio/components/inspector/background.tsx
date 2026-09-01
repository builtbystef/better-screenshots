import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  catalogGradientFor,
  catalogGradients,
  catalogSolidFor,
  catalogSolids,
} from "@/features/studio/composition/catalog";
import { changeLine, uploadLine } from "@/features/studio/composition/messages";
import { parseHex } from "@/features/studio/composition/parse";
import type {
  GradientBackground,
  HexColor,
  StudioSession,
} from "@/features/studio/composition/session";
import { notifyRefusal } from "@/features/studio/platform/notify";
import { useDraft } from "@/hooks/use-draft";
import { cn } from "@/lib/utils";
import { gradientCss } from "@/features/studio/components/inspector/gradient-css";
import { ImageThumbnail } from "@/features/studio/components/inspector/image-thumbnail";
import { chipGroup, chipItem, inspectorField } from "@/features/studio/components/inspector/styles";
import { Plus, X } from "lucide-react";
import { useId, useState, type ChangeEvent } from "react";

export function BackgroundInspector({ session }: { session: StudioSession }) {
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
    notifyRefusal(changeLine(await session.removeBackground(id)));
  }

  async function onAddChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file === undefined) {
      return;
    }
    const result = await session.uploadBackground(file, file.name);
    if (result === "undecodable" || result === "quota" || result === "unavailable") {
      notifyRefusal(uploadLine(result));
      return;
    }
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
                      ? "ring-2 ring-ring ring-offset-2 ring-offset-sidebar"
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
                  // Disabled while this image is the Background, so the title
                  // says why instead of leaving a button that looks dead.
                  title={
                    current
                      ? "In use as the Background — pick another one first"
                      : `Remove ${record.filename}`
                  }
                  disabled={current}
                  className="absolute top-1 right-1 size-5 rounded-sm bg-sidebar/90 shadow-sm"
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
      </div>
    </div>
  );
}
