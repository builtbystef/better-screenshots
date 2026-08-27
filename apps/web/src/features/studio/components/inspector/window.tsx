import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { changeLine } from "@/features/studio/composition/messages";
import type { BrowserWindow, StudioSession } from "@/features/studio/composition/session";
import { notifyRefusal } from "@/features/studio/platform/notify";
import { cn } from "@/lib/utils";
import { chipGroup, chipItem } from "@/features/studio/components/inspector/styles";

const windowSchemes: ReadonlyArray<{ name: string; value: BrowserWindow }> = [
  { name: "None", value: "none" },
  { name: "Light", value: "light" },
  { name: "Dark", value: "dark" },
];

export function WindowInspector({ session }: { session: StudioSession }) {
  const { browserWindow, url } = session.composition;

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
          notifyRefusal(changeLine(session.setUrl(event.target.value)));
        }}
      />
    </div>
  );
}
