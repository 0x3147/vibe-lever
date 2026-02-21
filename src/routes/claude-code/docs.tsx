import { createFileRoute } from "@tanstack/react-router";
import { ClaudeMdPage } from "@/pages/claude-md";

export const Route = createFileRoute("/claude-code/docs")({
  component: ClaudeMdPage,
});
