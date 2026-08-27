import { StudioShell } from "@/features/studio/components/studio-shell";
import { catalogDefaultSolid } from "@/features/studio/composition/catalog";
import { createSession, type StudioSession } from "@/features/studio/composition/session";
import { createIndexedDbStore } from "@/features/studio/platform/indexed-db-store";
import { useEffect, useState } from "react";

export function StudioPage() {
  const [session, setSession] = useState<StudioSession | null>(null);

  useEffect(() => {
    void createSession({
      defaultSolid: catalogDefaultSolid,
      store: createIndexedDbStore(),
    }).then(setSession);
  }, []);

  return session === null ? null : <StudioShell session={session} />;
}
