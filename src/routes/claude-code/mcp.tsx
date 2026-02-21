import { createFileRoute } from "@tanstack/react-router";
import { McpServersPage } from "@/pages/mcp-servers";

export const Route = createFileRoute("/claude-code/mcp")({
  component: McpServersPage,
});
