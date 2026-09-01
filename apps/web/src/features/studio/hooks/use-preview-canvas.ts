import type { StudioSession } from "@/features/studio/composition/session";
import { PAINT_SCALE } from "@/features/studio/platform/paint";
import { useEffect, useRef, useState, type RefObject } from "react";

// The Preview holds one canvas for its whole life and repaints it in place, so
// a slider drag never swaps DOM nodes. It paints at the scale that fills its
// box (capped at the Export's scale), and repaints when the Session changes or
// the box resizes. Paints are chained so two never interleave on the canvas,
// and a paint that another write has already superseded is skipped.
export function usePreviewCanvas(
  session: StudioSession,
  sessionVersion: number,
): RefObject<HTMLDivElement | null> {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chainRef = useRef<Promise<void>>(Promise.resolve());
  const [hostEpoch, setHostEpoch] = useState(0);

  useEffect(() => {
    const host = hostRef.current;
    if (host === null) {
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.className = "block max-h-full max-w-full object-contain";
    canvasRef.current = canvas;
    host.replaceChildren(canvas);
    const observer = new ResizeObserver(() => {
      setHostEpoch((epoch) => epoch + 1);
    });
    observer.observe(host);
    return () => {
      observer.disconnect();
      canvasRef.current = null;
      host.replaceChildren();
    };
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (host === null || canvas === null) {
      return;
    }
    const { width, height } = session.composition;
    canvas.style.aspectRatio = `${String(width)} / ${String(height)}`;
    const boxWidth = Math.min(host.clientWidth, (host.clientHeight * width) / height);
    if (boxWidth <= 0) {
      return;
    }
    const scale = Math.min(PAINT_SCALE, (boxWidth * window.devicePixelRatio) / width);
    let superseded = false;
    chainRef.current = chainRef.current.then(async () => {
      if (superseded) {
        return;
      }
      await session.render({ scale, canvas });
    });
    return () => {
      superseded = true;
    };
  }, [session, sessionVersion, hostEpoch]);

  return hostRef;
}
