import {
  placeLine,
  type PlaceOutcome,
  type PlaceSource,
} from "@/features/studio/composition/messages";
import type { StudioSession } from "@/features/studio/composition/session";
import { notifyRefusal } from "@/features/studio/platform/notify";
import { useCallback } from "react";

export function usePlaceScreenshot(session: StudioSession) {
  return useCallback(
    async (source: PlaceSource, files: readonly Blob[]) => {
      const outcome: PlaceOutcome =
        files.length === 0
          ? "empty"
          : (await session.placeScreenshot(files)) === "ok"
            ? "ok"
            : "refuse";
      notifyRefusal(placeLine(source, outcome));
    },
    [session],
  );
}
