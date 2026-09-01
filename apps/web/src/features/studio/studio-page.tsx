import { StudioShell } from "@/features/studio/components/studio-shell";
import { catalogDefaultSolid } from "@/features/studio/composition/catalog";
import { applySavedComposition } from "@/features/studio/composition/saved-composition";
import { createSession, type StudioSession } from "@/features/studio/composition/session";
import { createIndexedDbStore } from "@/features/studio/platform/indexed-db-store";
import { createSavedCompositionStore } from "@/features/studio/platform/saved-composition-store";
import { useEffect, useState } from "react";

export function StudioPage() {
  const [session, setSession] = useState<StudioSession | null>(null);

  useEffect(() => {
    let disposed = false;
    let unsubscribe: (() => void) | null = null;
    const savedStore = createSavedCompositionStore();
    void createSession({
      defaultSolid: catalogDefaultSolid,
      store: createIndexedDbStore(),
    }).then((created) => {
      if (disposed) {
        return;
      }
      // Restore the Saved composition before the first paint, then keep it
      // current: every commit rewrites the saved value.
      const saved = savedStore.load();
      if (saved !== "none" && saved !== "unavailable") {
        applySavedComposition(created, saved);
      }
      unsubscribe = created.subscribe(() => savedStore.save(created.composition));
      setSession(created);
    });
    return () => {
      disposed = true;
      unsubscribe?.();
    };
  }, []);

  return session === null ? null : <StudioShell session={session} />;
}
