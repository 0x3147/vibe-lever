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
  return (
    <div className="flex items-center justify-between p-4 rounded-xl glass-card-hover group">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5 mb-1">
          <span className="text-sm font-semibold truncate tracking-tight">{server.name}</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-secondary text-secondary-foreground border-none shrink-0 rounded-sm">
            {server.server_type}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground/80 truncate font-mono">
          {server.command ?? server.url ?? ""}
        </p>
      </div>
      <Button 
        size="icon" 
        variant="ghost" 
        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0 ml-4 opacity-70 group-hover:opacity-100" 
        onClick={() => onDelete(server.name)}
      >
        <FontAwesomeIcon icon={faTrash} className="text-xs" />
      </Button>
    </div>
  );
}
