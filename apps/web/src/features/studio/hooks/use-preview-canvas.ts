import type { StudioSession } from "@/features/studio/composition/session";
import { useEffect, useRef, type RefObject } from "react";

export function usePreviewCanvas(
  session: StudioSession,
  sessionVersion: number,
): RefObject<HTMLDivElement | null> {
  const hostRef = useRef<HTMLDivElement>(null);

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

  return hostRef;
}
