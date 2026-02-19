import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import { ToolStatusCard } from "@/components/tool-status-card";
import type { ToolStatus, ToolId } from "@/types/tool";
import type { NodeStatus } from "@/types/tool";

interface Props { tool: ToolId; }

const INSTALL_METHODS: Record<ToolId, { value: string; labelKey: string; platforms?: string[] }[]> = {
  "claude-code": [
    { value: "npm", labelKey: "tools.methodNpm" },
    { value: "native", labelKey: "tools.methodNative" },
    { value: "brew", labelKey: "tools.methodBrew", platforms: ["macos"] },
  ],
  "codex": [
    { value: "npm", labelKey: "tools.methodNpm" },
  ],
};

export function ToolsPage({ tool }: Props) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<ToolStatus | null>(null);
  const [nodeStatus, setNodeStatus] = useState<NodeStatus | null>(null);
  const [method, setMethod] = useState("npm");
  const [loading, setLoading] = useState(false);
  const [platform, setPlatform] = useState("");

  useEffect(() => {
    invoke<{ platform: string }>("get_platform_info").then(p => setPlatform(p.platform));
  }, []);

  const refresh = async () => {
    setLoading(true);
    try {
      const [s, n] = await Promise.all([
        invoke<ToolStatus>("check_tool_status", { tool }),
        invoke<NodeStatus>("check_node_status"),
      ]);
      setStatus(s);
      setNodeStatus(n);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, [tool]);

  const withRefresh = (fn: () => Promise<unknown>) => async () => {
    setLoading(true);
    try { await fn(); } catch (e) { console.error(e); }
    await refresh();
  };

  const handleInstall = withRefresh(() => invoke("install_tool", { tool, method }));
  const handleUninstall = withRefresh(() => invoke("uninstall_tool", { tool }));
  const handleKill = withRefresh(() => invoke("kill_tool_process", { tool }));
  const handleInstallNvm = withRefresh(() => invoke("install_nvm"));
  const handleInstallNode = withRefresh(() => invoke("install_node_lts"));

  const availableMethods = (INSTALL_METHODS[tool] ?? []).filter(
    m => !m.platforms || m.platforms.includes(platform)
  );

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold">{t("tools.title")}</h2>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{t("tools.installMethod")}:</span>
        <div className="flex gap-1">
          {availableMethods.map(m => (
            <button
              key={m.value}
              onClick={() => setMethod(m.value)}
              className={`px-3 py-1 text-xs rounded-md border transition-colors ${
                method === m.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:bg-accent"
              }`}
            >
              {t(m.labelKey)}
            </button>
          ))}
        </div>
      </div>

      <ToolStatusCard
        toolId={tool}
        status={status}
        loading={loading}
        onInstall={handleInstall}
        onUninstall={handleUninstall}
        onKill={handleKill}
        onRefresh={refresh}
      />

      <div className="rounded-lg border border-border p-4 space-y-3">
        <h3 className="text-sm font-medium">{t("tools.nodeSection")}</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="space-y-1">
            <div className="text-muted-foreground">{t("tools.nodeVersion")}</div>
            <div className={nodeStatus?.node_installed ? "text-green-500" : "text-muted-foreground"}>
              {nodeStatus?.node_version ?? (nodeStatus?.node_installed ? t("tools.nodeInstalled") : t("tools.nodeNotInstalled"))}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">NVM</div>
            <div className={nodeStatus?.nvm_installed ? "text-green-500" : "text-muted-foreground"}>
              {nodeStatus?.nvm_version ?? (nodeStatus?.nvm_installed ? t("tools.nvmInstalled") : t("tools.nvmNotInstalled"))}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {!nodeStatus?.nvm_installed && (
            <button
              onClick={handleInstallNvm}
              disabled={loading}
              className="px-3 py-1.5 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {t("tools.installNvm")}
            </button>
          )}
          {nodeStatus?.nvm_installed && !nodeStatus?.node_installed && (
            <button
              onClick={handleInstallNode}
              disabled={loading}
              className="px-3 py-1.5 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {t("tools.installNode")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
