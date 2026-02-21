import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faTrash, faStop, faRotate } from "@fortawesome/free-solid-svg-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ToolStatus } from "@/types/tool";

interface Props {
  toolId: string;
  status: ToolStatus | null;
  loading: boolean;
  onInstall: () => void;
  onUninstall: () => void;
  onKill: () => void;
  onRefresh: () => void;
}

export function ToolStatusCard({ toolId, status, loading, onInstall, onUninstall, onKill, onRefresh }: Props) {
  const { t } = useTranslation();

  return (
    <div className="p-5 rounded-2xl glass-card space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-base font-semibold tracking-tight">{toolId === "claude-code" ? "Claude Code" : "Codex"}</span>
          {status && (
            <Badge 
              variant={status.installed ? "default" : "secondary"} 
              className={`text-[10px] px-2 py-0.5 h-5 rounded-md border-none ${status.installed ? "bg-primary/20 text-primary hover:bg-primary/30" : ""}`}
            >
              {status.installed ? t("tools.installed") : t("tools.notInstalled")}
            </Badge>
          )}
          {status?.running && (
            <Badge variant="outline" className="text-[10px] px-2 py-0.5 h-5 rounded-md text-emerald-500 border-emerald-500/30 bg-emerald-500/10 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
              {t("tools.running")}
            </Badge>
          )}
        </div>
        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors" onClick={onRefresh} disabled={loading}>
          <FontAwesomeIcon icon={faRotate} className={`text-xs ${loading ? "animate-spin text-primary" : ""}`} />
        </Button>
      </div>

      <div className="space-y-1.5">
        {status?.version && (
          <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground/70">{t("tools.version")}:</span> <span className="font-mono">{status.version}</span></p>
        )}
        {status?.path && (
          <p className="text-xs text-muted-foreground truncate"><span className="font-medium text-foreground/70">{t("tools.path")}:</span> <span className="font-mono">{status.path}</span></p>
        )}
      </div>

      <div className="flex gap-2.5 pt-2">
        {!status?.installed ? (
          <Button size="sm" className="rounded-lg h-9 bg-primary/90 hover:bg-primary" onClick={onInstall} disabled={loading}>
            <FontAwesomeIcon icon={faDownload} className="mr-2 text-xs" />
            {t("tools.install")}
          </Button>
        ) : (
          <Button size="sm" variant="outline" className="rounded-lg h-9 border-border/50 hover:bg-accent/50" onClick={onUninstall} disabled={loading}>
            <FontAwesomeIcon icon={faTrash} className="mr-2 text-xs text-muted-foreground" />
            {t("tools.uninstall")}
          </Button>
        )}
        {status?.running && (
          <Button size="sm" variant="destructive" className="rounded-lg h-9 bg-destructive/90 hover:bg-destructive" onClick={onKill} disabled={loading}>
            <FontAwesomeIcon icon={faStop} className="mr-2 text-xs" />
            {t("tools.kill")}
          </Button>
        )}
      </div>
    </div>
  );
}
