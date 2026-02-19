# Install Wizard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为安装管理页面添加 SQLite 缓存、异步流式安装命令和 3 步安装向导 UI。

**Architecture:** Rust 后端新增 `tool_cache` 表缓存安装状态，新增 `install_tool_streaming` 命令通过 tokio 异步流式推送安装日志；前端重构为已安装视图和 3 步向导（选择方式 → 安装中 → 结果）。

**Tech Stack:** Rust/Tauri v2, tokio, rusqlite, React 19, TypeScript, Tailwind CSS v4

---

### Task 1: DB schema — 新增 tool_cache 表

**Files:**
- Modify: `src-tauri/src/db/schema.rs`

**Step 1: 在 execute_batch SQL 中追加 tool_cache 表**

```rust
CREATE TABLE IF NOT EXISTS tool_cache (
    tool        TEXT PRIMARY KEY,
    installed   INTEGER NOT NULL DEFAULT 0,
    version     TEXT,
    path        TEXT,
    checked_at  TEXT DEFAULT (datetime('now'))
);
```

在 `schema.rs` 的 `execute_batch` 字符串末尾（`settings` 表之后）追加上述 SQL。

**Step 2: 验证编译**

```bash
cargo build -p vibe-lever-lib 2>&1 | tail -5
```

Expected: 无错误

**Step 3: Commit**

```bash
git add src-tauri/src/db/schema.rs
git commit -m "feat: add tool_cache table to schema"
```

---

### Task 2: tool_cache_service — 缓存读写

**Files:**
- Create: `src-tauri/src/services/tool_cache_service.rs`
- Modify: `src-tauri/src/services/mod.rs`

**Step 1: 创建 tool_cache_service.rs**

```rust
use crate::db::Database;
use crate::models::tool::ToolStatus;

pub struct ToolCacheService;

impl ToolCacheService {
    pub fn get(db: &Database, tool: &str) -> Option<ToolStatus> {
        let conn = db.conn.lock().unwrap();
        conn.query_row(
            "SELECT installed, version, path FROM tool_cache WHERE tool = ?1",
            [tool],
            |row| {
                let installed: bool = row.get::<_, i64>(0)? != 0;
                Ok(ToolStatus {
                    installed,
                    version: row.get(1)?,
                    path: row.get(2)?,
                    install_method: None,
                    running: false,
                })
            },
        )
        .ok()
    }

    pub fn set(db: &Database, tool: &str, status: &ToolStatus) {
        let conn = db.conn.lock().unwrap();
        let _ = conn.execute(
            "INSERT OR REPLACE INTO tool_cache (tool, installed, version, path, checked_at)
             VALUES (?1, ?2, ?3, ?4, datetime('now'))",
            rusqlite::params![
                tool,
                status.installed as i64,
                status.version,
                status.path,
            ],
        );
    }
}
```

**Step 2: 在 mod.rs 中注册模块**

检查 `src-tauri/src/services/mod.rs`，追加：
```rust
pub mod tool_cache_service;
```

**Step 3: 验证编译**

```bash
cargo build -p vibe-lever-lib 2>&1 | tail -5
```

**Step 4: Commit**

```bash
git add src-tauri/src/services/tool_cache_service.rs src-tauri/src/services/mod.rs
git commit -m "feat: add tool_cache_service for install status caching"
```

---

### Task 3: tool_service — check_status 读缓存

**Files:**
- Modify: `src-tauri/src/services/tool_service.rs`
- Modify: `src-tauri/src/commands/tool.rs`

**Step 1: 修改 check_status 签名，接受 db 参数**

在 `tool_service.rs` 中将：
```rust
pub fn check_status(tool: &str) -> Result<ToolStatus, AppError> {
```
改为：
```rust
pub fn check_status(tool: &str, db: &crate::db::Database) -> Result<ToolStatus, AppError> {
```

在函数体开头插入缓存读取逻辑：
```rust
use crate::services::tool_cache_service::ToolCacheService;
if let Some(cached) = ToolCacheService::get(db, tool) {
    return Ok(cached);
}
```

在函数末尾 `Ok(status)` 之前插入缓存写入：
```rust
ToolCacheService::set(db, tool, &status);
```

**Step 2: 修改 commands/tool.rs 中的 check_tool_status**

```rust
#[tauri::command]
pub async fn check_tool_status(
    tool: String,
    db: tauri::State<'_, crate::db::Database>,
) -> Result<ToolStatus, AppError> {
    ToolService::check_status(&tool, &db)
}
```

同样修改 `install_tool` 和 `uninstall_tool`，在操作成功后调用 `ToolCacheService::set` 更新缓存（install 后 installed=true，uninstall 后 installed=false）。

对于 `install_tool`，在返回前：
```rust
if result.success {
    // 重新检测写入缓存
    if let Ok(s) = ToolService::check_status(&tool, &db) {
        // check_status 内部已写缓存
        let _ = s;
    }
}
```

对于 `uninstall_tool`，在成功后：
```rust
use crate::services::tool_cache_service::ToolCacheService;
use crate::models::tool::ToolStatus;
ToolCacheService::set(&db, &tool, &ToolStatus {
    installed: false, version: None, path: None,
    install_method: None, running: false,
});
```

**Step 3: 验证编译**

```bash
cargo build -p vibe-lever-lib 2>&1 | tail -10
```

**Step 4: Commit**

```bash
git add src-tauri/src/services/tool_service.rs src-tauri/src/commands/tool.rs
git commit -m "feat: check_status reads from cache, install/uninstall update cache"
```

---

### Task 4: install_tool_streaming — 异步流式安装命令

**Files:**
- Modify: `src-tauri/src/commands/tool.rs`
- Modify: `src-tauri/src/lib.rs`

**Step 1: 在 Cargo.toml 确认 tokio 依赖**

检查 `src-tauri/Cargo.toml`，确认有：
```toml
tokio = { version = "1", features = ["process", "io-util"] }
```
若无则添加。

**Step 2: 在 commands/tool.rs 末尾添加流式命令**

```rust
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command as TokioCommand;

#[tauri::command]
pub async fn install_tool_streaming(
    app: tauri::AppHandle,
    db: tauri::State<'_, crate::db::Database>,
    tool: String,
    method: String,
) -> Result<(), AppError> {
    let mut cmd = build_install_cmd(&tool, &method)?;
    cmd.stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped());

    let mut child = cmd.spawn()
        .map_err(|e| AppError::ShellCommand(e.to_string()))?;

    let stdout = child.stdout.take().unwrap();
    let stderr = child.stderr.take().unwrap();

    let app2 = app.clone();
    tokio::spawn(async move {
        let mut lines = BufReader::new(stderr).lines();
        while let Ok(Some(line)) = lines.next_line().await {
            let _ = app2.emit("install-log", line);
        }
    });

    let mut lines = BufReader::new(stdout).lines();
    while let Ok(Some(line)) = lines.next_line().await {
        let _ = app.emit("install-log", line);
    }

    let status = child.wait().await
        .map_err(|e| AppError::ShellCommand(e.to_string()))?;

    let success = status.success();
    if success {
        use crate::services::tool_cache_service::ToolCacheService;
        if let Ok(s) = ToolService::check_status(&tool, &db) {
            let _ = s;
        }
    }
    app.emit("install-done", serde_json::json!({ "success": success }))
        .map_err(|e| AppError::ShellCommand(e.to_string()))?;
    Ok(())
}

fn build_install_cmd(tool: &str, method: &str) -> Result<TokioCommand, AppError> {
    let mut cmd = match (tool, method) {
        (_, "npm") => {
            let pkg = match tool {
                "claude-code" => "@anthropic-ai/claude-code",
                "codex" => "@openai/codex",
                _ => return Err(AppError::ShellCommand(format!("Unknown tool: {}", tool))),
            };
            if cfg!(windows) {
                let mut c = TokioCommand::new("cmd");
                c.args(["/c", "npm", "install", "-g", pkg]);
                c
            } else {
                let mut c = TokioCommand::new("npm");
                c.args(["install", "-g", pkg]);
                c
            }
        }
        ("claude-code", "native") => {
            if cfg!(windows) {
                let mut c = TokioCommand::new("powershell");
                c.args(["-Command", "irm https://claude.ai/install.ps1 | iex"]);
                c
            } else {
                let mut c = TokioCommand::new("bash");
                c.args(["-c", "curl -fsSL https://claude.ai/install.sh | bash"]);
                c
            }
        }
        ("claude-code", "brew") => {
            let mut c = TokioCommand::new("brew");
            c.args(["install", "claude"]);
            c
        }
        _ => return Err(AppError::ShellCommand(format!("Unsupported: {} via {}", tool, method))),
    };
    Ok(cmd)
}
```

**Step 3: 在 lib.rs 注册新命令**

在 `invoke_handler` 的 tool commands 区块末尾追加：
```rust
commands::tool::install_tool_streaming,
```

**Step 4: 验证编译**

```bash
cargo build -p vibe-lever-lib 2>&1 | tail -10
```

**Step 5: Commit**

```bash
git add src-tauri/src/commands/tool.rs src-tauri/src/lib.rs src-tauri/Cargo.toml
git commit -m "feat: add install_tool_streaming command with tokio async streaming"
```

---

### Task 5: i18n — 新增向导相关键

**Files:**
- Modify: `src/locales/zh.json`
- Modify: `src/locales/en.json`

**Step 1: 在 zh.json tools 对象末尾追加**

```json
"wizardStep1": "选择方式",
"wizardStep2": "安装中",
"wizardStep3": "完成",
"wizardSelectMethod": "选择安装方式",
"wizardInstalling": "正在安装，请稍候...",
"wizardSuccess": "安装成功",
"wizardFailed": "安装失败",
"wizardRetry": "重试",
"wizardViewInstalled": "查看已安装"
```

**Step 2: 在 en.json tools 对象末尾追加**

```json
"wizardStep1": "Select Method",
"wizardStep2": "Installing",
"wizardStep3": "Done",
"wizardSelectMethod": "Choose installation method",
"wizardInstalling": "Installing, please wait...",
"wizardSuccess": "Installation successful",
"wizardFailed": "Installation failed",
"wizardRetry": "Retry",
"wizardViewInstalled": "View installed"
```

**Step 3: Commit**

```bash
git add src/locales/zh.json src/locales/en.json
git commit -m "feat: add wizard i18n keys"
```

---

### Task 6: 前端重构 — 3 步安装向导 + 已安装视图

**Files:**
- Modify: `src/pages/tools/index.tsx`

**Step 1: 重写 ToolsPage**

完整替换 `src/pages/tools/index.tsx` 内容：

```tsx
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
  // wizard: 0=select, 1=installing, 2=done
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

  // 进入页面时若未安装则显示向导 step 0
  useEffect(() => {
    if (status !== null) {
      setStep(status.installed ? null : 0);
    }
  }, [status?.installed]);

  // 自动滚动日志
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

  // 已安装视图
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
        <NodeSection
          nodeStatus={nodeStatus}
          loading={loading}
          onInstallNvm={handleInstallNvm}
          onInstallNode={handleInstallNode}
          t={t}
        />
      </div>
    );
  }

  // 向导视图
  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold">{t("tools.title")}</h2>

      {/* 步骤条 */}
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

      {/* Step 0: 选择方式 */}
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

      {/* Step 1: 安装中 */}
      {step === 1 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{t("tools.wizardInstalling")}</p>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary animate-[progress_1.5s_ease-in-out_infinite]" style={{ width: "40%" }} />
          </div>
          <div className="rounded-md bg-muted/50 border border-border p-2 h-40 overflow-y-auto font-mono text-xs space-y-0.5">
            {logs.map((line, i) => <div key={i}>{line}</div>)}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}

      {/* Step 2: 结果 */}
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

      <NodeSection
        nodeStatus={nodeStatus}
        loading={loading}
        onInstallNvm={handleInstallNvm}
        onInstallNode={handleInstallNode}
        t={t}
      />
    </div>
  );
}

function NodeSection({ nodeStatus, loading, onInstallNvm, onInstallNode, t }: {
  nodeStatus: NodeStatus | null;
  loading: boolean;
  onInstallNvm: () => void;
  onInstallNode: () => void;
  t: (key: string) => string;
}) {
  return (
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
          <button onClick={onInstallNvm} disabled={loading}
            className="px-3 py-1.5 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {t("tools.installNvm")}
          </button>
        )}
        {nodeStatus?.nvm_installed && !nodeStatus?.node_installed && (
          <button onClick={onInstallNode} disabled={loading}
            className="px-3 py-1.5 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {t("tools.installNode")}
          </button>
        )}
      </div>
    </div>
  );
}
```

**Step 2: 验证 TypeScript 编译**

```bash
npx tsc --noEmit 2>&1 | head -20
```

**Step 3: Commit**

```bash
git add src/pages/tools/index.tsx
git commit -m "feat: rewrite ToolsPage with 3-step install wizard and installed view"
```

---

### Task 7: 全量构建验证

**Step 1: Rust 构建**

```bash
cargo build -p vibe-lever-lib 2>&1 | tail -5
```

Expected: `Finished` 无错误

**Step 2: 前端构建**

```bash
npm run build 2>&1 | tail -10
```

Expected: 无错误

**Step 3: Commit（若有修复）**

```bash
git add -A
git commit -m "fix: build fixes after install wizard integration"
```
