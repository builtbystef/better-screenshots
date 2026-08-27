import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarProvider,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import type { StudioSession } from "@/features/studio/composition/session";
import { ActionsInspector } from "@/features/studio/components/inspector/actions";
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
    // The well backs the whole page, and the Inspector floats on top of it.
    <SidebarProvider className="studio-well h-svh min-w-[48rem]">
      <main className="min-h-0 min-w-0 flex-1">
        <Preview session={session} sessionVersion={sessionVersion} />
      </main>
      {/* `collapsible="none"` skips the variant branch that carries the floating
          look, so the Inspector states those classes itself. */}
      <Sidebar
        side="right"
        collapsible="none"
        className="my-2 mr-2 h-auto overflow-hidden rounded-lg shadow-sm ring-1 ring-sidebar-border"
      >
        <SidebarHeader className="p-4">
          <h1 className="flex items-center gap-2.5 text-lg font-medium tracking-tight">
            <BrandMark />
            Better Screenshots
          </h1>
        </SidebarHeader>
        <SidebarSeparator className="mx-0" />
        <SidebarContent>
          <InspectorSection title="Frame">
            <FrameInspector session={session} />
          </InspectorSection>
          <SidebarSeparator className="mx-0" />
          <InspectorSection title="Background">
            <BackgroundInspector session={session} />
          </InspectorSection>
          <SidebarSeparator className="mx-0" />
          <InspectorSection title="Placement">
            <PlacementInspector session={session} />
          </InspectorSection>
          <SidebarSeparator className="mx-0" />
          <InspectorSection title="Window">
            <WindowInspector session={session} />
          </InspectorSection>
          <SidebarSeparator className="mx-0" />
          <InspectorSection title="Effects">
            <EffectsInspector session={session} />
          </InspectorSection>
        </SidebarContent>
        <SidebarSeparator className="mx-0" />
        <SidebarFooter className="p-3">
          <ActionsInspector session={session} />
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );
}

// Inline rather than an <img> pair so the mark takes `currentColor` from the
// wordmark beside it, which is what keeps the two matched in either scheme.
function BrandMark() {
  return (
    <svg
      viewBox="0 0 498 498"
      fill="none"
      aria-hidden="true"
      className="size-9 shrink-0 text-foreground"
    >
      <path d="M50 114.982V50H114.982" stroke="currentColor" strokeWidth="20" />
      <path d="M50 385.018V450H114.982" stroke="currentColor" strokeWidth="20" />
      <path d="M450 114.982V50H385.018" stroke="currentColor" strokeWidth="20" />
      <path d="M450 385.018V450H385.018" stroke="currentColor" strokeWidth="20" />
      <path
        d="M256.734 344L215.405 289.533L174.076 235.066L89 344M215.405 289.533L300.5 189L409 344"
        stroke="currentColor"
        strokeWidth="20"
        strokeLinecap="round"
      />
      <circle cx="130" cy="170" r="25" fill="currentColor" />
    </svg>
  );
}

function InspectorSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <SidebarGroup className="shrink-0 gap-3 p-5">
      <SidebarGroupLabel className="h-auto p-0 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        <h2>{title}</h2>
      </SidebarGroupLabel>
      <SidebarGroupContent>{children}</SidebarGroupContent>
    </SidebarGroup>
  );
}
