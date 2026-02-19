import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import { ToolStatusCard } from "@/components/tool-status-card";
import type { ToolStatus, ToolId } from "@/types/tool";

interface Props {
  tool: ToolId;
}

export function ToolsPage({ tool }: Props) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<ToolStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const s = await invoke<ToolStatus>("check_tool_status", { tool });
      setStatus(s);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, [tool]);

  const handleInstall = async () => {
    setLoading(true);
    try {
      await invoke("install_tool", { tool, method: "npm" });
      await refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleUninstall = async () => {
    setLoading(true);
    try {
      await invoke("uninstall_tool", { tool });
      await refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleKill = async () => {
    setLoading(true);
    try {
      await invoke("kill_tool_process", { tool });
      await refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold">{t("tools.title")}</h2>
      <ToolStatusCard
        toolId={tool}
        status={status}
        loading={loading}
        onInstall={handleInstall}
        onUninstall={handleUninstall}
        onKill={handleKill}
        onRefresh={refresh}
      />
    </div>
  );
}
