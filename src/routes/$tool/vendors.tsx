import { createFileRoute } from "@tanstack/react-router";
import { VendorsPage } from "@/pages/vendors";
import type { ToolId } from "@/types/tool";

export const Route = createFileRoute("/$tool/vendors")({
  component: () => {
    const { tool } = Route.useParams();
    return <VendorsPage tool={tool as ToolId} />;
  },
});
