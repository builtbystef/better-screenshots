import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { StudioSession } from "@/features/studio/composition/session";
import { BackgroundInspector } from "@/features/studio/components/inspector/background";
import { EffectsInspector } from "@/features/studio/components/inspector/effects";
import { FrameInspector } from "@/features/studio/components/inspector/frame";
import { PlacementInspector } from "@/features/studio/components/inspector/placement";
import { WindowInspector } from "@/features/studio/components/inspector/window";
import { Preview } from "@/features/studio/components/preview";
import { useSyncExternalStore, type ReactNode } from "react";

export function StudioShell({ session }: { session: StudioSession }) {
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
