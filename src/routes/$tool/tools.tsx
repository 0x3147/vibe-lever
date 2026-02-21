import { createFileRoute } from "@tanstack/react-router";
import { ToolsPage } from "@/pages/tools";
import type { ToolId } from "@/types/tool";

export const Route = createFileRoute("/$tool/tools")({
  component: () => {
    const { tool } = Route.useParams();
    return <ToolsPage tool={tool as ToolId} />;
  },
});
