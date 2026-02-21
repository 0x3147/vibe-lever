import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotate } from "@fortawesome/free-solid-svg-icons";
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
    <div className="rounded-2xl glass-card p-5 space-y-4">
      <h3 className="text-sm font-semibold tracking-tight">{t("tools.nodeSection")}</h3>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="space-y-1.5 p-3 rounded-xl bg-muted/30 border border-border/50">
          <div className="text-muted-foreground text-xs">{t("tools.nodeVersion")}</div>
          <div className={`font-mono ${nodeStatus?.node_installed ? "text-emerald-500 font-medium" : "text-muted-foreground"}`}>
            {nodeStatus?.node_version ?? (nodeStatus?.node_installed ? t("tools.nodeInstalled") : t("tools.nodeNotInstalled"))}
          </div>
        </div>
        <div className="space-y-1.5 p-3 rounded-xl bg-muted/30 border border-border/50">
          <div className="text-muted-foreground text-xs">NVM</div>
          <div className={`font-mono ${nodeStatus?.nvm_installed ? "text-emerald-500 font-medium" : "text-muted-foreground"}`}>
            {nodeStatus?.nvm_version ?? (nodeStatus?.nvm_installed ? t("tools.nvmInstalled") : t("tools.nvmNotInstalled"))}
          </div>
        </div>
      </div>
      <div className="flex gap-2.5 pt-1">
        {!nodeStatus?.nvm_installed && (
          <button onClick={handleInstallNvm} disabled={loading}
            className="px-4 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {t("tools.installNvm")}
          </button>
        )}
        {nodeStatus?.nvm_installed && !nodeStatus?.node_installed && (
          <button onClick={handleInstallNode} disabled={loading}
            className="px-4 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {t("tools.installNode")}
          </button>
        )}
      </div>
    </div>
  );

  if (step === null && status?.installed) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out fill-mode-both">
        <h2 className="text-xl font-semibold tracking-tight">{t("tools.title")}</h2>
        {opError && <p className="text-xs text-destructive p-3 bg-destructive/10 rounded-lg border border-destructive/20">{opError}</p>}
        {/* We reuse the glass-card ToolStatusCard */}
        <ToolStatusCard
          toolId={tool}
          status={status}
          loading={loading}
          onInstall={() => setStep(0)}
          onUninstall={handleUninstall}
          onKill={handleKill}
          onRefresh={refresh}
        />
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150 fill-mode-both">
          {nodeSection}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out fill-mode-both">
      <h2 className="text-xl font-semibold tracking-tight">{t("tools.title")}</h2>

      {step !== null && (
        <div className="flex items-center gap-3 text-xs mb-8">
          {stepLabels.map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm transition-colors duration-300 ${
                i === step ? "bg-primary text-primary-foreground shadow-[0_0_10px_rgba(var(--primary),0.3)] ring-2 ring-primary/20 ring-offset-2 ring-offset-background" :
                i < step ? "bg-emerald-500 text-white" : "bg-muted border border-border/50 text-muted-foreground"
              }`}>{i < step ? "✓" : i + 1}</span>
              <span className={`font-medium transition-colors duration-300 ${i === step ? "text-foreground" : i < step ? "text-emerald-500" : "text-muted-foreground"}`}>{label}</span>
              {i < stepLabels.length - 1 && <div className={`w-6 h-px mx-1 ${i < step ? "bg-emerald-500/50" : "bg-border"}`} />}
            </div>
          ))}
        </div>
      )}

      {step === 0 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500 fill-mode-both">
          <p className="text-sm text-muted-foreground">{t("tools.wizardSelectMethod")}</p>
          <div className="grid grid-cols-1 gap-3">
            {availableMethods.map(m => (
              <button
                key={m.value}
                onClick={() => startInstall(m.value)}
                className="p-4 rounded-xl glass-card-hover group text-left transition-colors relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="font-medium relative">{t(m.labelKey)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500 fill-mode-both">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <FontAwesomeIcon icon={faRotate} className="animate-spin text-primary text-xs" />
            {t("tools.wizardInstalling")}
          </p>
          <div className="h-2 rounded-full bg-muted overflow-hidden border border-border/50">
            <div className="h-full bg-primary animate-pulse transition-all duration-300" style={{ width: "40%" }} />
          </div>
          <div className="rounded-xl glass-card p-3 h-48 overflow-y-auto font-mono text-[11px] space-y-1 shadow-inner bg-black/5 dark:bg-black/20">
            {logs.map((line, i) => <div key={i} className="text-muted-foreground/80 break-all">{line}</div>)}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500 fill-mode-both">
          <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium border ${installSuccess ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-destructive/10 border-destructive/20 text-destructive"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${installSuccess ? "bg-emerald-500/20" : "bg-destructive/20"}`}>
              {installSuccess ? "✓" : "✗"}
            </div>
            <span>{installSuccess ? t("tools.wizardSuccess") : t("tools.wizardFailed")}</span>
          </div>
          {!installSuccess && (
            <>
              <div className="rounded-xl glass-card p-3 h-40 overflow-y-auto font-mono text-[11px] space-y-1 shadow-inner bg-black/5 dark:bg-black/20">
                {logs.slice(-20).map((line, i) => <div key={i} className="text-muted-foreground/80 break-all">{line}</div>)}
              </div>
              <button
                onClick={() => setStep(0)}
                className="px-4 py-2 mt-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
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
