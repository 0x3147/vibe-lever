import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { McpServer } from "@/types/mcp";

interface Props {
  server: McpServer;
  onDelete: (name: string) => void;
}

export function McpServerCard({ server, onDelete }: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{server.name}</span>
          <Badge variant="secondary" className="text-xs shrink-0">{server.server_type}</Badge>
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {server.command ?? server.url ?? ""}
        </p>
      </div>
      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive shrink-0 ml-2" onClick={() => onDelete(server.name)}>
        <FontAwesomeIcon icon={faTrash} className="text-xs" />
      </Button>
    </div>
  );
}
