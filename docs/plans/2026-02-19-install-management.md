# Installation Management Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将"工具管理"升级为"安装管理"，支持 npm/native/brew 多种安装方式，并提供 NVM 管理 Node 版本的能力。

**Architecture:** Rust 后端新增 NodeStatus 模型和 NVM 相关命令；前端 ToolsPage 重新设计，展示安装方式选择器和 Node/NVM 管理面板；平台感知（brew 仅 macOS 显示）。

**Tech Stack:** Rust (Tauri v2), React 19, TypeScript, Tailwind CSS v4, i18next

---

### Task 1: i18n 重命名

**Files:**
- Modify: `src/locales/zh.json`
- Modify: `src/locales/en.json`

**Step 1: 修改 zh.json**

将以下两处 `"工具管理"` 改为 `"安装管理"`：
```json
"sidebar": { "tools": "安装管理" }
"tools": { "title": "安装管理" }
```
同时在 `tools` 节点新增键：
```json
"installMethod": "安装方式",
"methodNpm": "npm 全局安装",
"methodNative": "官方脚本安装",
"methodBrew": "Homebrew 安装",
"nodeSection": "Node.js 环境",
"nodeInstalled": "Node.js 已安装",
"nodeNotInstalled": "Node.js 未安装",
"nvmInstalled": "NVM 已安装",
"nvmNotInstalled": "NVM 未安装",
"installNvm": "安装 NVM",
"installNode": "安装 Node.js LTS",
"nodeVersion": "Node 版本"
```

**Step 2: 修改 en.json**（同结构英文翻译）

**Step 3: Commit**
```bash
git add src/locales/
git commit -m "feat: rename tool management to install management, add i18n keys"
```

---

### Task 2: Rust 新增 NodeStatus 模型

**Files:**
- Modify: `src-tauri/src/models/tool.rs`

**Step 1: 在 tool.rs 末尾追加**
```rust
#[derive(Debug, Serialize, Deserialize)]
pub struct NodeStatus {
    pub node_installed: bool,
    pub node_version: Option<String>,
    pub nvm_installed: bool,
    pub nvm_version: Option<String>,
}
```

**Step 2: Commit**
```bash
git add src-tauri/src/models/tool.rs
git commit -m "feat: add NodeStatus model"
```

---

### Task 3: Rust 扩展 tool_service.rs — native/brew 安装

**Files:**
- Modify: `src-tauri/src/services/tool_service.rs`

**Step 1: 在 `install()` 的 match 中新增分支**

在现有 `("codex", "npm")` 分支后添加：
```rust
("claude-code", "native") => {
    if cfg!(windows) {
        ("powershell", vec!["-Command", "irm https://claude.ai/install.ps1 | iex"])
    } else {
        ("bash", vec!["-c", "curl -fsSL https://claude.ai/install.sh | bash"])
    }
}
("claude-code", "brew") => ("brew", vec!["install", "claude"]),
```

注意：native 分支需要根据平台动态构建，需将 match 改为 if/else 或使用辅助函数。实际代码：

```rust
("claude-code", "native") => {
    let output = if cfg!(windows) {
        shell::run_command("powershell", &["-Command", "irm https://claude.ai/install.ps1 | iex"])?
    } else {
        shell::run_command("bash", &["-c", "curl -fsSL https://claude.ai/install.sh | bash"])?
    };
    return Ok(InstallResult {
        success: output.success,
        message: if output.success { "安装成功".to_string() } else { output.stderr.clone() },
        output: Some(format!("{}\n{}", output.stdout, output.stderr)),
    });
}
("claude-code", "brew") => ("brew", vec!["install", "claude"]),
```

**Step 2: Commit**
```bash
git add src-tauri/src/services/tool_service.rs
git commit -m "feat: support native and brew install methods"
```

---

### Task 4: Rust 新增 NVM/Node 命令

**Files:**
- Modify: `src-tauri/src/services/tool_service.rs`
- Modify: `src-tauri/src/commands/tool.rs`
- Modify: `src-tauri/src/lib.rs`

**Step 1: 在 tool_service.rs 末尾新增 NodeService**
```rust
pub struct NodeService;

impl NodeService {
    pub fn check_status() -> NodeStatus {
        let node_version = shell::run_command("node", &["--version"])
            .ok()
            .and_then(|o| if o.success { Some(o.stdout.trim().to_string()) } else { None });

        let nvm_version = if cfg!(windows) {
            shell::run_command("nvm", &["version"]).ok()
                .and_then(|o| if o.success { Some(o.stdout.trim().to_string()) } else { None })
        } else {
            shell::run_command("bash", &["-c", "source ~/.nvm/nvm.sh && nvm --version"]).ok()
                .and_then(|o| if o.success { Some(o.stdout.trim().to_string()) } else { None })
        };

        NodeStatus {
            node_installed: node_version.is_some(),
            node_version,
            nvm_installed: nvm_version.is_some(),
            nvm_version,
        }
    }

    pub fn install_nvm() -> Result<InstallResult, AppError> {
        let output = if cfg!(windows) {
            shell::run_command("powershell", &["-Command", "irm https://github.com/coreybutler/nvm-windows/releases/latest/download/nvm-setup.exe -OutFile nvm-setup.exe; Start-Process nvm-setup.exe -Wait"])?
        } else {
            shell::run_command("bash", &["-c", "curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash"])?
        };
        Ok(InstallResult {
            success: output.success,
            message: if output.success { "NVM 安装成功".to_string() } else { output.stderr.clone() },
            output: Some(format!("{}\n{}", output.stdout, output.stderr)),
        })
    }

    pub fn install_node_lts() -> Result<InstallResult, AppError> {
        let output = if cfg!(windows) {
            shell::run_command("nvm", &["install", "lts"])?
        } else {
            shell::run_command("bash", &["-c", "source ~/.nvm/nvm.sh && nvm install --lts"])?
        };
        Ok(InstallResult {
            success: output.success,
            message: if output.success { "Node.js LTS 安装成功".to_string() } else { output.stderr.clone() },
            output: Some(format!("{}\n{}", output.stdout, output.stderr)),
        })
    }
}
```

**Step 2: 在 commands/tool.rs 末尾新增命令**
```rust
use crate::services::tool_service::NodeService;
use crate::models::tool::NodeStatus;

#[tauri::command]
pub async fn check_node_status() -> NodeStatus {
    NodeService::check_status()
}

#[tauri::command]
pub async fn install_nvm() -> Result<InstallResult, AppError> {
    NodeService::install_nvm()
}

#[tauri::command]
pub async fn install_node_lts() -> Result<InstallResult, AppError> {
    NodeService::install_node_lts()
}
```

**Step 3: 在 lib.rs invoke_handler 中注册新命令**

在 `commands::tool::kill_tool_process,` 后添加：
```rust
commands::tool::check_node_status,
commands::tool::install_nvm,
commands::tool::install_node_lts,
```

**Step 4: Commit**
```bash
git add src-tauri/src/
git commit -m "feat: add NodeService with NVM and Node.js install commands"
```

---

### Task 5: 前端类型更新

**Files:**
- Modify: `src/types/tool.ts`（如存在）或新增类型

**Step 1: 查找并更新 tool 类型文件**

运行：`find src/types -name "tool*"`

在类型文件中新增：
```ts
export interface NodeStatus {
  node_installed: boolean;
  node_version: string | null;
  nvm_installed: boolean;
  nvm_version: string | null;
}
```

**Step 2: Commit**
```bash
git add src/types/
git commit -m "feat: add NodeStatus type"
```

---

### Task 6: 前端 ToolsPage 重新设计

**Files:**
- Modify: `src/pages/tools/index.tsx`

**Step 1: 重写 ToolsPage**

```tsx
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

  const handleInstall = async () => {
    setLoading(true);
    try { await invoke("install_tool", { tool, method }); await refresh(); }
    finally { setLoading(false); }
  };

  const handleUninstall = async () => {
    setLoading(true);
    try { await invoke("uninstall_tool", { tool }); await refresh(); }
    finally { setLoading(false); }
  };

  const handleKill = async () => {
    setLoading(true);
    try { await invoke("kill_tool_process", { tool }); await refresh(); }
    finally { setLoading(false); }
  };

  const handleInstallNvm = async () => {
    setLoading(true);
    try { await invoke("install_nvm"); await refresh(); }
    finally { setLoading(false); }
  };

  const handleInstallNode = async () => {
    setLoading(true);
    try { await invoke("install_node_lts"); await refresh(); }
    finally { setLoading(false); }
  };

  const availableMethods = (INSTALL_METHODS[tool] ?? []).filter(
    m => !m.platforms || m.platforms.includes(platform)
  );

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold">{t("tools.title")}</h2>

      {/* 安装方式选择 */}
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

      {/* Node.js 环境面板 */}
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
```

**Step 2: Commit**
```bash
git add src/pages/tools/
git commit -m "feat: redesign ToolsPage with method selector and Node/NVM panel"
```

---

### Task 7: 验证构建

**Step 1: 运行前端类型检查**
```bash
npm run typecheck
```
Expected: 无类型错误

**Step 2: 运行 Rust 编译检查**
```bash
cd src-tauri && cargo check
```
Expected: `Finished` 无错误

**Step 3: 如有错误，修复后重新检查**

**Step 4: Final commit**
```bash
git add -A
git commit -m "feat: complete install management feature"
```
