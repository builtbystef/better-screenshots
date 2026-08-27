import { changeLine } from "@/features/studio/composition/messages";
import type { Point, StudioSession } from "@/features/studio/composition/session";
import { hitsDrawn, positionFromDrag } from "@/features/studio/platform/drag";
import { notifyRefusal } from "@/features/studio/platform/notify";
import { useRef, useState, type PointerEvent, type RefObject } from "react";

function previewCanvas(host: HTMLDivElement | null): HTMLCanvasElement | null {
  const child = host?.firstElementChild;
  return child instanceof HTMLCanvasElement ? child : null;
}

export function useScreenshotDrag({
  session,
  hostRef,
  occupied,
}: {
  session: StudioSession;
  hostRef: RefObject<HTMLDivElement | null>;
  occupied: boolean;
}) {
  const dragRef = useRef<{
    origin: Point;
    start: Point;
    previewWidth: number;
  } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [overScreenshot, setOverScreenshot] = useState(false);

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
    notifyRefusal(changeLine(outcome));
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

  return {
    dragging,
    overScreenshot,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onPointerLeave },
  };
}
