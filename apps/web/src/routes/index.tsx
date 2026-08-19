import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { createIndexedDbStore } from "../indexed-db-store";
import { createSession, type StudioSession } from "../session";

const CATALOG_DEFAULT_SOLID = { type: "solid" as const, color: "#E4E4E7" };

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const [session, setSession] = useState<StudioSession | null>(null);

  useEffect(() => {
    void createSession({
      defaultSolid: CATALOG_DEFAULT_SOLID,
      store: createIndexedDbStore(),
    }).then(setSession);
  }, []);

  if (session === null) {
    return null;
  }

  return (
    <main className="flex h-svh min-h-svh min-w-[48rem] gap-6 p-6">
      <section className="min-h-0 min-w-0 flex-1">
        <Preview session={session} />
      </section>
      <aside className="flex w-80 shrink-0 flex-col gap-6 overflow-y-auto rounded-lg border border-border bg-card p-4 text-card-foreground">
        <section>
          <h2 className="text-sm font-medium">Background</h2>
        </section>
        <section>
          <h2 className="text-sm font-medium">Placement</h2>
        </section>
        <section>
          <h2 className="text-sm font-medium">Effects</h2>
        </section>
      </aside>
    </main>
  );
}

function Preview({ session }: { session: StudioSession }) {
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
        "block max-h-full max-w-full border border-border object-contain [aspect-ratio:16/9]";
      host.replaceChildren(canvas);
    });
    return () => {
      cancelled = true;
      host.replaceChildren();
    };
  }, [session]);

  return <div ref={hostRef} className="h-full w-full" />;
}
