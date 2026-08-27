import { StudioPage } from "@/features/studio";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: StudioRoute,
});

function StudioRoute() {
  return <StudioPage />;
}
