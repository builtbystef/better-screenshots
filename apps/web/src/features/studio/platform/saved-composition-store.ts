import {
  parseSavedComposition,
  serializeSavedComposition,
  type SavedComposition,
} from "@/features/studio/composition/saved-composition";
import type { Composition } from "@/features/studio/composition/session";

const STORAGE_KEY = "better-screenshots.saved-composition";

export type SavedCompositionStore = {
  load(): SavedComposition | "none" | "unavailable";
  save(composition: Composition): "ok" | "unavailable";
};

// localStorage adapter for the Saved composition. Storage exceptions — a
// blocked storage area, a full quota — become "unavailable" and never cross
// the seam. A stored value that does not parse loads as "none": the Studio
// opens on its defaults rather than refusing to open.
export function createSavedCompositionStore(
  storage: () => Storage = () => globalThis.localStorage,
): SavedCompositionStore {
  return {
    load() {
      try {
        const raw = storage().getItem(STORAGE_KEY);
        if (raw === null) {
          return "none";
        }
        const parsed = parseSavedComposition(raw);
        return parsed === "refuse" ? "none" : parsed;
      } catch {
        return "unavailable";
      }
    },
    save(composition) {
      try {
        storage().setItem(STORAGE_KEY, serializeSavedComposition(composition));
        return "ok";
      } catch {
        return "unavailable";
      }
    },
  };
}
