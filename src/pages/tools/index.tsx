import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
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
  const [loading, setLoading] = useState(false);
  const [platform, setPlatform] = useState("");
  const [opError, setOpError] = useState<string | null>(null);
  const [step, setStep] = useState<0 | 1 | 2 | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [installSuccess, setInstallSuccess] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (status !== null) {
      setStep(status.installed ? null : 0);
    }
  }, [status?.installed]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const withRefresh = (fn: () => Promise<unknown>) => async () => {
    setLoading(true);
    setOpError(null);
    try { await fn(); } catch (e) { setOpError(String(e)); }
    await refresh();
  };

  const handleUninstall = withRefresh(() => invoke("uninstall_tool", { tool }));
  const handleKill = withRefresh(() => invoke("kill_tool_process", { tool }));
  const handleInstallNvm = withRefresh(() => invoke("install_nvm"));
  const handleInstallNode = withRefresh(() => invoke("install_node_lts"));

  const startInstall = async (method: string) => {
    setStep(1);
    setLogs([]);
    setInstallSuccess(false);

    const unlistenLog = await listen<string>("install-log", e => {
      setLogs(prev => [...prev, e.payload]);
    });
    const unlistenDone = await listen<{ success: boolean }>("install-done", async e => {
      unlistenLog();
      unlistenDone();
      setInstallSuccess(e.payload.success);
      setStep(2);
      if (e.payload.success) {
        await refresh();
        setTimeout(() => setStep(null), 3000);
      }
    });

    try {
      await invoke("install_tool_streaming", { tool, method });
    } catch (e) {
      unlistenLog();
      unlistenDone();
      setLogs(prev => [...prev, String(e)]);
      setInstallSuccess(false);
      setStep(2);
    }
  };

  const availableMethods = (INSTALL_METHODS[tool] ?? []).filter(
    m => !m.platforms || m.platforms.includes(platform)
  );

  const stepLabels = [t("tools.wizardStep1"), t("tools.wizardStep2"), t("tools.wizardStep3")];

  const nodeSection = (
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
          <button onClick={handleInstallNvm} disabled={loading}
            className="px-3 py-1.5 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {t("tools.installNvm")}
          </button>
        )}
        {nodeStatus?.nvm_installed && !nodeStatus?.node_installed && (
          <button onClick={handleInstallNode} disabled={loading}
            className="px-3 py-1.5 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {t("tools.installNode")}
          </button>
        )}
      </div>
    </div>
  );

  if (step === null && status?.installed) {
    return (
      <div className="space-y-4">
        <h2 className="text-base font-semibold">{t("tools.title")}</h2>
        {opError && <p className="text-xs text-destructive">{opError}</p>}
        <ToolStatusCard
          toolId={tool}
          status={status}
          loading={loading}
          onInstall={() => setStep(0)}
          onUninstall={handleUninstall}
          onKill={handleKill}
          onRefresh={refresh}
        />
        {nodeSection}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold">{t("tools.title")}</h2>

      {step !== null && (
        <div className="flex items-center gap-2 text-xs">
          {stepLabels.map((label, i) => (
            <div key={i} className="flex items-center gap-1">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                i === step ? "bg-primary text-primary-foreground" :
                i < step ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
              }`}>{i + 1}</span>
              <span className={i === step ? "text-foreground" : "text-muted-foreground"}>{label}</span>
              {i < stepLabels.length - 1 && <span className="text-muted-foreground mx-1">→</span>}
            </div>
          ))}
        </div>
      )}

      {step === 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{t("tools.wizardSelectMethod")}</p>
          <div className="grid grid-cols-1 gap-2">
            {availableMethods.map(m => (
              <button
                key={m.value}
                onClick={() => startInstall(m.value)}
                className="p-3 rounded-lg border border-border hover:border-primary hover:bg-accent text-left text-sm transition-colors"
              >
                {t(m.labelKey)}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{t("tools.wizardInstalling")}</p>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary animate-pulse" style={{ width: "40%" }} />
          </div>
          <div className="rounded-md bg-muted/50 border border-border p-2 h-40 overflow-y-auto font-mono text-xs space-y-0.5">
            {logs.map((line, i) => <div key={i}>{line}</div>)}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <div className={`flex items-center gap-2 text-sm font-medium ${installSuccess ? "text-green-500" : "text-destructive"}`}>
            <span>{installSuccess ? "✓" : "✗"}</span>
            <span>{installSuccess ? t("tools.wizardSuccess") : t("tools.wizardFailed")}</span>
          </div>
          {!installSuccess && (
            <>
              <div className="rounded-md bg-muted/50 border border-border p-2 h-32 overflow-y-auto font-mono text-xs space-y-0.5">
                {logs.slice(-20).map((line, i) => <div key={i}>{line}</div>)}
              </div>
              <button
                onClick={() => setStep(0)}
                className="px-3 py-1.5 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {t("tools.wizardRetry")}
              </button>
            </>
          )}
        </div>
      )}

      {nodeSection}
    </div>
  );
}
