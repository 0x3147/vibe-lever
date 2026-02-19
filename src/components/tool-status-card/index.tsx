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
    <div className="p-4 rounded-lg border border-border bg-card space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{toolId === "claude-code" ? "Claude Code" : "Codex"}</span>
          {status && (
            <Badge variant={status.installed ? "default" : "secondary"} className="text-xs">
              {status.installed ? t("tools.installed") : t("tools.notInstalled")}
            </Badge>
          )}
          {status?.running && (
            <Badge variant="outline" className="text-xs text-green-600 border-green-600">
              {t("tools.running")}
            </Badge>
          )}
        </div>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onRefresh} disabled={loading}>
          <FontAwesomeIcon icon={faRotate} className={`text-xs ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {status?.version && (
        <p className="text-xs text-muted-foreground">{t("tools.version")}: {status.version}</p>
      )}
      {status?.path && (
        <p className="text-xs text-muted-foreground truncate">{t("tools.path")}: {status.path}</p>
      )}

      <div className="flex gap-2">
        {!status?.installed ? (
          <Button size="sm" onClick={onInstall} disabled={loading}>
            <FontAwesomeIcon icon={faDownload} className="mr-1.5 text-xs" />
            {t("tools.install")}
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={onUninstall} disabled={loading}>
            <FontAwesomeIcon icon={faTrash} className="mr-1.5 text-xs" />
            {t("tools.uninstall")}
          </Button>
        )}
        {status?.running && (
          <Button size="sm" variant="destructive" onClick={onKill} disabled={loading}>
            <FontAwesomeIcon icon={faStop} className="mr-1.5 text-xs" />
            {t("tools.kill")}
          </Button>
        )}
      </div>
    </div>
  );
}
