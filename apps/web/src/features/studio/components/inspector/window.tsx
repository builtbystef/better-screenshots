import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { changeLine } from "@/features/studio/composition/messages";
import type { BrowserWindow, StudioSession } from "@/features/studio/composition/session";
import { cn } from "@/lib/utils";
import { chipGroup, chipItem } from "@/features/studio/components/inspector/styles";
import { useState } from "react";

const windowSchemes: ReadonlyArray<{ name: string; value: BrowserWindow }> = [
  { name: "None", value: "none" },
  { name: "Light", value: "light" },
  { name: "Dark", value: "dark" },
];

export function WindowInspector({ session }: { session: StudioSession }) {
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
