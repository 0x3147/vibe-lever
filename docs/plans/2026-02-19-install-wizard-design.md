# Install Wizard Design

**Goal:** 优化安装管理页面，引入 SQLite 缓存、3步安装向导、流式输出进度。

**Architecture:**
- DB 新增 `tool_cache` 表缓存安装状态，避免每次进入页面重复 shell 检测
- Rust 新增 `install_tool_streaming` 命令，使用 `tokio::process::Command` 异步流式推送安装日志
- 前端重构为两个视图：已安装视图（状态+卸载）和安装向导（3步）

**Tech Stack:** Rust/Tauri v2, tokio, rusqlite, React 19, TypeScript, Tailwind CSS v4

---

## Section 1: DB 缓存

新增 `tool_cache` 表：
```sql
CREATE TABLE IF NOT EXISTS tool_cache (
    tool        TEXT PRIMARY KEY,
    installed   INTEGER NOT NULL DEFAULT 0,
    version     TEXT,
    path        TEXT,
    checked_at  TEXT DEFAULT (datetime('now'))
);
```

读取逻辑（`check_tool_status`）：
1. 读 DB → 有记录 → 直接返回缓存
2. 无记录 → shell 检测 → 写 DB → 返回

写入时机：
- 首次检测后写入
- 安装成功后更新 `installed=1`
- 卸载成功后更新 `installed=0`

## Section 2: 流式安装命令

新增 `install_tool_streaming(app, tool, method)` Tauri 命令：
- 使用 `tokio::process::Command::spawn()` 异步启动子进程
- 分别读取 stdout/stderr，逐行 `app.emit("install-log", line)`
- 完成后 `app.emit("install-done", { success: bool })`
- 安装成功后更新 DB cache

事件格式：
```
install-log  → String (单行输出)
install-done → { success: bool, message: String }
```

## Section 3: 前端向导 UI

**已安装视图：**
```
[工具名] ● 已安装  [运行中]
版本: v1.x.x
路径: /usr/local/bin/claude
              [卸载]  [终止进程]
```

**安装向导（未安装时）：**

步骤条：`① 选择方式` → `② 安装中` → `③ 完成`

Step 1 - 选择方式：
- 卡片式选择：npm / 官方脚本 / Homebrew（macOS only）
- 点击卡片 → 进入 Step 2

Step 2 - 安装中：
- indeterminate 进度条（动画）
- 滚动日志区域（监听 install-log 事件追加）
- 自动执行，无取消

Step 3 - 结果：
- 成功：绿色✓ + 版本信息 → 3秒后自动切换到已安装视图
- 失败：红色✗ + 错误摘要 + [重试] 按钮（回到 Step 1）

## 文件变更清单

- `src-tauri/src/db/schema.rs` — 新增 tool_cache 表
- `src-tauri/src/services/tool_cache_service.rs` — 新增缓存读写服务
- `src-tauri/src/services/tool_service.rs` — check_status 读缓存，install/uninstall 更新缓存
- `src-tauri/src/commands/tool.rs` — 新增 install_tool_streaming 命令
- `src-tauri/src/lib.rs` — 注册新命令
- `src/pages/tools/index.tsx` — 重构为向导+已安装两视图
- `src/locales/zh.json` + `en.json` — 新增向导相关 i18n 键
