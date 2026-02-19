# VibeLever 迁移重构实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将 EasyCCSwitch (Electron) 的核心功能迁移至 VibeLever (Tauri v2)，采用全新架构重新设计实现。

**Architecture:** 重 Rust 后端 + 轻 React 前端。Rust 负责所有系统操作、SQLite 持久化和配置文件解析；React 前端仅负责 UI 渲染和用户交互，通过 Tauri `invoke()` 调用后端。

**Tech Stack:** Tauri v2, React 19, TypeScript, shadcn/ui, Tailwind CSS, TanStack Router, Zustand, FontAwesome, i18next, Rust, rusqlite, serde, thiserror, toml

---

## Task 1: 前端基础架构搭建

**Files:**
- Modify: `package.json`
- Modify: `tsconfig.json`
- Modify: `vite.config.ts`
- Modify: `src/main.tsx`
- Modify: `src/App.tsx`
- Create: `src/styles/globals.css`
- Create: `tailwind.config.ts`
- Create: `postcss.config.js`
- Create: `components.json` (shadcn/ui 配置)

**Step 1: 安装 Tailwind CSS**

```bash
pnpm add -D tailwindcss @tailwindcss/vite
```

**Step 2: 配置 Tailwind 和 Vite**

在 `vite.config.ts` 中添加 Tailwind 插件：

```typescript
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(async () => ({
  plugins: [react(), tailwindcss()],
  // ... 其他配置
}));
```

创建 `src/styles/globals.css`：
```css
@import "tailwindcss";
```

**Step 3: 安装 shadcn/ui 并初始化**

```bash
pnpm dlx shadcn@latest init
```

选择配置：
- Style: New York
- Base color: Neutral
- CSS variables: yes

**Step 4: 安装路径别名支持**

`tsconfig.json` 中添加路径别名：
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

`vite.config.ts` 中添加 resolve alias：
```typescript
import path from "path";

export default defineConfig(async () => ({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // ...
}));
```

**Step 5: 安装 TanStack Router**

```bash
pnpm add @tanstack/react-router
pnpm add -D @tanstack/router-plugin @tanstack/router-devtools
```

在 `vite.config.ts` 中添加 TanStack Router 插件：
```typescript
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

export default defineConfig(async () => ({
  plugins: [TanStackRouterVite(), react(), tailwindcss()],
  // ...
}));
```

**Step 6: 安装 Zustand、FontAwesome 和 i18next**

```bash
pnpm add zustand
pnpm add @fortawesome/fontawesome-svg-core @fortawesome/free-solid-svg-icons @fortawesome/free-brands-svg-icons @fortawesome/free-regular-svg-icons @fortawesome/react-fontawesome
pnpm add i18next react-i18next
```

**Step 7: 清理模板代码**

删除 `src/App.css`，清空 `src/App.tsx` 中的模板内容，更新 `src/main.tsx` 引入 `globals.css`。

**Step 8: 验证前端启动**

```bash
pnpm dev
```

预期：Vite 开发服务器在 `http://localhost:1420` 启动无报错。

**Step 9: 提交**

```bash
git add -A
git commit -m "feat: setup frontend foundation - tailwind, shadcn, tanstack-router, zustand, fontawesome, i18next"
```

---

## Task 2: Rust 后端基础架构搭建

**Files:**
- Modify: `src-tauri/Cargo.toml`
- Modify: `src-tauri/src/lib.rs`
- Modify: `src-tauri/src/main.rs`
- Create: `src-tauri/src/db/mod.rs`
- Create: `src-tauri/src/db/schema.rs`
- Create: `src-tauri/src/commands/mod.rs`
- Create: `src-tauri/src/services/mod.rs`
- Create: `src-tauri/src/models/mod.rs`
- Create: `src-tauri/src/utils/mod.rs`
- Create: `src-tauri/src/errors.rs`

**Step 1: 添加 Rust 依赖**

在 `Cargo.toml` 的 `[dependencies]` 中添加：

```toml
[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-opener = "2"
tauri-plugin-shell = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
rusqlite = { version = "0.31", features = ["bundled"] }
thiserror = "1"
toml = "0.8"
dirs = "5"
```

**Step 2: 创建错误处理模块**

创建 `src-tauri/src/errors.rs`：

```rust
use serde::Serialize;

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("数据库错误: {0}")]
    Database(#[from] rusqlite::Error),
    #[error("文件操作失败: {0}")]
    FileSystem(#[from] std::io::Error),
    #[error("配置解析失败: {0}")]
    ConfigParse(String),
    #[error("工具未安装: {0}")]
    ToolNotInstalled(String),
    #[error("命令执行失败: {0}")]
    ShellCommand(String),
    #[error("JSON 解析失败: {0}")]
    JsonParse(#[from] serde_json::Error),
    #[error("TOML 解析失败: {0}")]
    TomlParse(#[from] toml::de::Error),
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}
```

**Step 3: 创建数据库模块**

创建 `src-tauri/src/db/mod.rs`：

```rust
pub mod schema;

use rusqlite::Connection;
use std::sync::Mutex;
use std::path::PathBuf;

pub struct Database {
    pub conn: Mutex<Connection>,
}

impl Database {
    pub fn new(app_dir: PathBuf) -> Result<Self, rusqlite::Error> {
        std::fs::create_dir_all(&app_dir).ok();
        let db_path = app_dir.join("vibe-lever.db");
        let conn = Connection::open(db_path)?;
        let db = Database {
            conn: Mutex::new(conn),
        };
        db.init_tables()?;
        Ok(db)
    }

    fn init_tables(&self) -> Result<(), rusqlite::Error> {
        let conn = self.conn.lock().unwrap();
        schema::create_tables(&conn)?;
        Ok(())
    }
}
```

创建 `src-tauri/src/db/schema.rs`：

```rust
use rusqlite::Connection;

pub fn create_tables(conn: &Connection) -> Result<(), rusqlite::Error> {
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS vendors (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            tool        TEXT NOT NULL,
            name        TEXT NOT NULL,
            vendor_key  TEXT,
            base_url    TEXT NOT NULL,
            token       TEXT NOT NULL,
            model       TEXT,
            config_json TEXT,
            is_active   INTEGER DEFAULT 0,
            created_at  TEXT DEFAULT (datetime('now')),
            updated_at  TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS settings (
            key   TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
        "
    )?;
    Ok(())
}
```

**Step 4: 创建模块占位文件**

创建以下 `mod.rs` 文件，初始内容为空 module 声明：
- `src-tauri/src/commands/mod.rs`
- `src-tauri/src/services/mod.rs`
- `src-tauri/src/models/mod.rs`
- `src-tauri/src/utils/mod.rs`

**Step 5: 更新 `lib.rs` 入口**

```rust
mod commands;
mod db;
mod errors;
mod models;
mod services;
mod utils;

use db::Database;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let app_dir = app.path().app_data_dir().expect("failed to get app data dir");
            let db = Database::new(app_dir).expect("failed to initialize database");
            app.manage(db);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**Step 6: 验证 Rust 编译**

```bash
cd src-tauri && cargo check
```

预期：编译无错误。

**Step 7: 提交**

```bash
git add -A
git commit -m "feat: setup rust backend foundation - db, error handling, module structure"
```

---

## Task 3: Rust 数据模型与供应商 Service

**Files:**
- Create: `src-tauri/src/models/vendor.rs`
- Create: `src-tauri/src/models/settings.rs`
- Create: `src-tauri/src/models/tool.rs`
- Create: `src-tauri/src/models/mcp.rs`
- Modify: `src-tauri/src/models/mod.rs`
- Create: `src-tauri/src/services/vendor_service.rs`
- Modify: `src-tauri/src/services/mod.rs`

**Step 1: 创建 Vendor 模型**

创建 `src-tauri/src/models/vendor.rs`：

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Vendor {
    pub id: i64,
    pub tool: String,
    pub name: String,
    pub vendor_key: Option<String>,
    pub base_url: String,
    pub token: String,
    pub model: Option<String>,
    pub config_json: Option<String>,
    pub is_active: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct VendorInput {
    pub name: String,
    pub vendor_key: Option<String>,
    pub base_url: String,
    pub token: String,
    pub model: Option<String>,
    pub config_json: Option<String>,
}
```

**Step 2: 创建其他模型文件**

创建 `src-tauri/src/models/settings.rs`：

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct AppSettings {
    pub theme: String,          // "light" | "dark" | "system"
    pub language: String,       // "zh" | "en"
    pub last_tool: String,      // "claude-code" | "codex"
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            theme: "light".to_string(),
            language: "zh".to_string(),
            last_tool: "claude-code".to_string(),
        }
    }
}
```

创建 `src-tauri/src/models/tool.rs`：

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct ToolStatus {
    pub installed: bool,
    pub path: Option<String>,
    pub version: Option<String>,
    pub install_method: Option<String>,
    pub running: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InstallResult {
    pub success: bool,
    pub message: String,
    pub output: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PlatformInfo {
    pub platform: String,
    pub platform_name: String,
    pub arch: String,
}
```

创建 `src-tauri/src/models/mcp.rs`：

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct McpServer {
    pub name: String,
    pub server_type: String,  // "stdio" | "http" | "sse"
    pub command: Option<String>,
    pub args: Option<Vec<String>>,
    pub url: Option<String>,
    pub env: Option<std::collections::HashMap<String, String>>,
    pub headers: Option<std::collections::HashMap<String, String>>,
}

#[derive(Debug, Deserialize)]
pub struct McpServerInput {
    pub name: String,
    pub server_type: String,
    pub command: Option<String>,
    pub args: Option<Vec<String>>,
    pub url: Option<String>,
    pub env: Option<std::collections::HashMap<String, String>>,
    pub headers: Option<std::collections::HashMap<String, String>>,
}
```

更新 `src-tauri/src/models/mod.rs`：

```rust
pub mod mcp;
pub mod settings;
pub mod tool;
pub mod vendor;
```

**Step 3: 创建 VendorService**

创建 `src-tauri/src/services/vendor_service.rs`：

```rust
use crate::db::Database;
use crate::errors::AppError;
use crate::models::vendor::{Vendor, VendorInput};
use rusqlite::params;

pub struct VendorService;

impl VendorService {
    pub fn get_all(db: &Database, tool: &str) -> Result<Vec<Vendor>, AppError> {
        let conn = db.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, tool, name, vendor_key, base_url, token, model, config_json, is_active, created_at, updated_at
             FROM vendors WHERE tool = ? ORDER BY created_at DESC"
        )?;

        let vendors = stmt.query_map(params![tool], |row| {
            Ok(Vendor {
                id: row.get(0)?,
                tool: row.get(1)?,
                name: row.get(2)?,
                vendor_key: row.get(3)?,
                base_url: row.get(4)?,
                token: row.get(5)?,
                model: row.get(6)?,
                config_json: row.get(7)?,
                is_active: row.get(8)?,
                created_at: row.get(9)?,
                updated_at: row.get(10)?,
            })
        })?.collect::<Result<Vec<_>, _>>()?;

        Ok(vendors)
    }

    pub fn add(db: &Database, tool: &str, input: VendorInput) -> Result<Vendor, AppError> {
        let conn = db.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO vendors (tool, name, vendor_key, base_url, token, model, config_json)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![tool, input.name, input.vendor_key, input.base_url, input.token, input.model, input.config_json],
        )?;
        let id = conn.last_insert_rowid();
        drop(conn);
        Self::get_by_id(db, id)
    }

    pub fn get_by_id(db: &Database, id: i64) -> Result<Vendor, AppError> {
        let conn = db.conn.lock().unwrap();
        let vendor = conn.query_row(
            "SELECT id, tool, name, vendor_key, base_url, token, model, config_json, is_active, created_at, updated_at
             FROM vendors WHERE id = ?",
            params![id],
            |row| {
                Ok(Vendor {
                    id: row.get(0)?,
                    tool: row.get(1)?,
                    name: row.get(2)?,
                    vendor_key: row.get(3)?,
                    base_url: row.get(4)?,
                    token: row.get(5)?,
                    model: row.get(6)?,
                    config_json: row.get(7)?,
                    is_active: row.get(8)?,
                    created_at: row.get(9)?,
                    updated_at: row.get(10)?,
                })
            }
        )?;
        Ok(vendor)
    }

    pub fn update(db: &Database, id: i64, input: VendorInput) -> Result<Vendor, AppError> {
        let conn = db.conn.lock().unwrap();
        conn.execute(
            "UPDATE vendors SET name=?1, vendor_key=?2, base_url=?3, token=?4, model=?5, config_json=?6, updated_at=datetime('now')
             WHERE id=?7",
            params![input.name, input.vendor_key, input.base_url, input.token, input.model, input.config_json, id],
        )?;
        drop(conn);
        Self::get_by_id(db, id)
    }

    pub fn delete(db: &Database, id: i64) -> Result<(), AppError> {
        let conn = db.conn.lock().unwrap();
        conn.execute("DELETE FROM vendors WHERE id = ?", params![id])?;
        Ok(())
    }

    pub fn activate(db: &Database, tool: &str, id: i64) -> Result<(), AppError> {
        let conn = db.conn.lock().unwrap();
        // 先取消所有同类工具的激活
        conn.execute("UPDATE vendors SET is_active = 0 WHERE tool = ?", params![tool])?;
        // 激活指定的
        conn.execute("UPDATE vendors SET is_active = 1 WHERE id = ?", params![id])?;
        Ok(())
    }
}
```

更新 `src-tauri/src/services/mod.rs`：

```rust
pub mod vendor_service;
```

**Step 4: 验证编译**

```bash
cd src-tauri && cargo check
```

预期：编译无错误。

**Step 5: 提交**

```bash
git add -A
git commit -m "feat: add data models and vendor service with SQLite CRUD"
```

---

## Task 4: Rust 供应商 Commands 与配置写入

**Files:**
- Create: `src-tauri/src/commands/vendor.rs`
- Create: `src-tauri/src/commands/system.rs`
- Create: `src-tauri/src/utils/platform.rs`
- Create: `src-tauri/src/utils/config_parser.rs`
- Modify: `src-tauri/src/commands/mod.rs`
- Modify: `src-tauri/src/utils/mod.rs`
- Modify: `src-tauri/src/lib.rs`

**Step 1: 创建平台工具模块**

创建 `src-tauri/src/utils/platform.rs`：

```rust
use crate::models::tool::PlatformInfo;

pub fn get_platform_info() -> PlatformInfo {
    let platform = std::env::consts::OS;
    let arch = std::env::consts::ARCH;
    let platform_name = match platform {
        "windows" => "Windows",
        "macos" => "macOS",
        "linux" => "Linux",
        _ => "Unknown",
    };

    PlatformInfo {
        platform: platform.to_string(),
        platform_name: platform_name.to_string(),
        arch: arch.to_string(),
    }
}

pub fn get_home_dir() -> Option<std::path::PathBuf> {
    dirs::home_dir()
}
```

**Step 2: 创建配置解析模块**

创建 `src-tauri/src/utils/config_parser.rs`：

```rust
use crate::errors::AppError;
use crate::models::vendor::Vendor;
use std::path::PathBuf;

/// 将 Vendor 配置写入 Claude Code 的 settings.json
pub fn write_claude_settings(vendor: &Vendor) -> Result<(), AppError> {
    let home = dirs::home_dir().ok_or(AppError::FileSystem(
        std::io::Error::new(std::io::ErrorKind::NotFound, "Home directory not found")
    ))?;
    let settings_path = home.join(".claude").join("settings.json");

    // 读取现有配置或创建空配置
    let mut settings: serde_json::Value = if settings_path.exists() {
        let content = std::fs::read_to_string(&settings_path)?;
        serde_json::from_str(&content)?
    } else {
        std::fs::create_dir_all(settings_path.parent().unwrap())?;
        serde_json::json!({})
    };

    // 更新 env 字段
    let env = settings
        .as_object_mut()
        .unwrap()
        .entry("env")
        .or_insert_with(|| serde_json::json!({}));

    if let Some(env_obj) = env.as_object_mut() {
        env_obj.insert("ANTHROPIC_AUTH_TOKEN".to_string(), serde_json::json!(vendor.token));
        env_obj.insert("ANTHROPIC_BASE_URL".to_string(), serde_json::json!(vendor.base_url));
        env_obj.insert("CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC".to_string(), serde_json::json!(1));

        // 解析 config_json 中的扩展配置
        if let Some(config_str) = &vendor.config_json {
            if let Ok(config) = serde_json::from_str::<serde_json::Value>(config_str) {
                if let Some(model) = config.get("sonnetModel").and_then(|v| v.as_str()) {
                    env_obj.insert("ANTHROPIC_DEFAULT_SONNET_MODEL".to_string(), serde_json::json!(model));
                }
                if let Some(model) = config.get("haikuModel").and_then(|v| v.as_str()) {
                    env_obj.insert("ANTHROPIC_DEFAULT_HAIKU_MODEL".to_string(), serde_json::json!(model));
                }
                if let Some(model) = config.get("opusModel").and_then(|v| v.as_str()) {
                    env_obj.insert("ANTHROPIC_DEFAULT_OPUS_MODEL".to_string(), serde_json::json!(model));
                }
            }
        }

        if let Some(ref model) = vendor.model {
            env_obj.insert("ANTHROPIC_MODEL".to_string(), serde_json::json!(model));
        }
    }

    let content = serde_json::to_string_pretty(&settings)?;
    std::fs::write(&settings_path, content)?;
    Ok(())
}

/// 将 Vendor 配置写入 Codex 的 config.toml 和 auth.json
pub fn write_codex_config(vendor: &Vendor) -> Result<(), AppError> {
    let home = dirs::home_dir().ok_or(AppError::FileSystem(
        std::io::Error::new(std::io::ErrorKind::NotFound, "Home directory not found")
    ))?;
    let codex_dir = home.join(".codex");
    std::fs::create_dir_all(&codex_dir)?;

    // 写入 auth.json
    let auth = serde_json::json!({
        "OPENAI_API_KEY": vendor.token
    });
    std::fs::write(codex_dir.join("auth.json"), serde_json::to_string_pretty(&auth)?)?;

    // 解析 config_json 获取 Codex 特有配置
    let provider_key = vendor.vendor_key.as_deref().unwrap_or("custom");
    let mut config_toml = format!(
        r#"model_provider = "{provider_key}"
model = "gpt-5"
"#
    );

    if let Some(config_str) = &vendor.config_json {
        if let Ok(config) = serde_json::from_str::<serde_json::Value>(config_str) {
            if let Some(model) = config.get("model").and_then(|v| v.as_str()) {
                config_toml = config_toml.replace("gpt-5", model);
            }
        }
    }

    config_toml.push_str(&format!(
        r#"
[model_providers.{provider_key}]
name = "{name}"
base_url = "{base_url}"
wire_api = "openai"
"#,
        name = vendor.name,
        base_url = vendor.base_url
    ));

    std::fs::write(codex_dir.join("config.toml"), config_toml)?;
    Ok(())
}
```

更新 `src-tauri/src/utils/mod.rs`：

```rust
pub mod config_parser;
pub mod platform;
```

**Step 3: 创建供应商 Commands**

创建 `src-tauri/src/commands/vendor.rs`：

```rust
use crate::db::Database;
use crate::errors::AppError;
use crate::models::vendor::{Vendor, VendorInput};
use crate::services::vendor_service::VendorService;
use crate::utils::config_parser;
use tauri::State;

#[tauri::command]
pub async fn get_vendors(db: State<'_, Database>, tool: String) -> Result<Vec<Vendor>, AppError> {
    VendorService::get_all(&db, &tool)
}

#[tauri::command]
pub async fn add_vendor(db: State<'_, Database>, tool: String, vendor: VendorInput) -> Result<Vendor, AppError> {
    VendorService::add(&db, &tool, vendor)
}

#[tauri::command]
pub async fn update_vendor(db: State<'_, Database>, id: i64, vendor: VendorInput) -> Result<Vendor, AppError> {
    VendorService::update(&db, id, vendor)
}

#[tauri::command]
pub async fn delete_vendor(db: State<'_, Database>, id: i64) -> Result<(), AppError> {
    VendorService::delete(&db, id)
}

#[tauri::command]
pub async fn activate_vendor(db: State<'_, Database>, tool: String, id: i64) -> Result<(), AppError> {
    VendorService::activate(&db, &tool, id)?;

    // 写入对应工具的配置文件
    let vendor = VendorService::get_by_id(&db, id)?;
    match tool.as_str() {
        "claude-code" => config_parser::write_claude_settings(&vendor)?,
        "codex" => config_parser::write_codex_config(&vendor)?,
        _ => {}
    }

    Ok(())
}
```

创建 `src-tauri/src/commands/system.rs`：

```rust
use crate::models::tool::PlatformInfo;
use crate::utils::platform;

#[tauri::command]
pub async fn get_platform_info() -> Result<PlatformInfo, String> {
    Ok(platform::get_platform_info())
}
```

更新 `src-tauri/src/commands/mod.rs`：

```rust
pub mod system;
pub mod vendor;
```

**Step 4: 在 `lib.rs` 中注册 Commands**

更新 `lib.rs` 的 `invoke_handler`：

```rust
.invoke_handler(tauri::generate_handler![
    commands::vendor::get_vendors,
    commands::vendor::add_vendor,
    commands::vendor::update_vendor,
    commands::vendor::delete_vendor,
    commands::vendor::activate_vendor,
    commands::system::get_platform_info,
])
```

**Step 5: 验证编译**

```bash
cd src-tauri && cargo check
```

预期：编译无错误。

**Step 6: 提交**

```bash
git add -A
git commit -m "feat: add vendor commands with config file write support"
```

---

## Task 5: Rust 工具管理 Commands

**Files:**
- Create: `src-tauri/src/commands/tool.rs`
- Create: `src-tauri/src/services/tool_service.rs`
- Create: `src-tauri/src/utils/shell.rs`
- Modify: `src-tauri/src/commands/mod.rs`
- Modify: `src-tauri/src/services/mod.rs`
- Modify: `src-tauri/src/lib.rs`
- Modify: `src-tauri/tauri.conf.json` (添加 shell 权限)

**Step 1: 创建 Shell 工具模块**

创建 `src-tauri/src/utils/shell.rs`：

```rust
use crate::errors::AppError;
use std::process::Command;

pub struct ShellOutput {
    pub success: bool,
    pub stdout: String,
    pub stderr: String,
}

pub fn run_command(cmd: &str, args: &[&str]) -> Result<ShellOutput, AppError> {
    let output = Command::new(cmd)
        .args(args)
        .output()
        .map_err(|e| AppError::ShellCommand(format!("Failed to execute {}: {}", cmd, e)))?;

    Ok(ShellOutput {
        success: output.status.success(),
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
    })
}

/// 检查某个命令是否存在于 PATH 中
pub fn which(cmd: &str) -> Option<String> {
    let check_cmd = if cfg!(windows) { "where" } else { "which" };
    if let Ok(output) = run_command(check_cmd, &[cmd]) {
        if output.success {
            return Some(output.stdout.trim().to_string());
        }
    }
    None
}
```

更新 `src-tauri/src/utils/mod.rs`：

```rust
pub mod config_parser;
pub mod platform;
pub mod shell;
```

**Step 2: 创建 ToolService**

创建 `src-tauri/src/services/tool_service.rs`：

```rust
use crate::errors::AppError;
use crate::models::tool::{InstallResult, ToolStatus};
use crate::utils::shell;

pub struct ToolService;

impl ToolService {
    pub fn check_status(tool: &str) -> Result<ToolStatus, AppError> {
        let cmd = match tool {
            "claude-code" => "claude",
            "codex" => "codex",
            _ => return Err(AppError::ToolNotInstalled(format!("Unknown tool: {}", tool))),
        };

        let path = shell::which(cmd);
        let installed = path.is_some();

        let version = if installed {
            shell::run_command(cmd, &["--version"])
                .ok()
                .and_then(|o| if o.success { Some(o.stdout.trim().to_string()) } else { None })
        } else {
            None
        };

        let running = Self::check_running(tool).unwrap_or(false);

        Ok(ToolStatus {
            installed,
            path,
            version,
            install_method: None,
            running,
        })
    }

    pub fn check_running(tool: &str) -> Result<bool, AppError> {
        let process_name = match tool {
            "claude-code" => "claude",
            "codex" => "codex",
            _ => return Ok(false),
        };

        let output = if cfg!(windows) {
            shell::run_command("tasklist", &["/FI", &format!("IMAGENAME eq {}.exe", process_name)])?
        } else {
            shell::run_command("pgrep", &["-x", process_name])?
        };

        Ok(output.success && output.stdout.contains(process_name))
    }

    pub fn install(tool: &str, method: &str) -> Result<InstallResult, AppError> {
        let (cmd, args): (&str, Vec<&str>) = match (tool, method) {
            ("claude-code", "npm") => ("npm", vec!["install", "-g", "@anthropic-ai/claude-code"]),
            ("codex", "npm") => ("npm", vec!["install", "-g", "@openai/codex"]),
            _ => return Err(AppError::ShellCommand(format!("Unsupported install: {} via {}", tool, method))),
        };

        let output = shell::run_command(cmd, &args)?;
        Ok(InstallResult {
            success: output.success,
            message: if output.success { "安装成功".to_string() } else { output.stderr.clone() },
            output: Some(format!("{}\n{}", output.stdout, output.stderr)),
        })
    }

    pub fn uninstall(tool: &str) -> Result<(), AppError> {
        let (cmd, args): (&str, Vec<&str>) = match tool {
            "claude-code" => ("npm", vec!["uninstall", "-g", "@anthropic-ai/claude-code"]),
            "codex" => ("npm", vec!["uninstall", "-g", "@openai/codex"]),
            _ => return Err(AppError::ShellCommand(format!("Unknown tool: {}", tool))),
        };

        let output = shell::run_command(cmd, &args)?;
        if !output.success {
            return Err(AppError::ShellCommand(output.stderr));
        }
        Ok(())
    }

    pub fn kill_process(tool: &str) -> Result<(), AppError> {
        let process_name = match tool {
            "claude-code" => "claude",
            "codex" => "codex",
            _ => return Err(AppError::ShellCommand(format!("Unknown tool: {}", tool))),
        };

        let output = if cfg!(windows) {
            shell::run_command("taskkill", &["/F", "/IM", &format!("{}.exe", process_name)])?
        } else {
            shell::run_command("pkill", &["-f", process_name])?
        };

        if !output.success && !output.stderr.contains("not found") {
            return Err(AppError::ShellCommand(output.stderr));
        }
        Ok(())
    }
}
```

更新 `src-tauri/src/services/mod.rs`：

```rust
pub mod tool_service;
pub mod vendor_service;
```

**Step 3: 创建工具 Commands**

创建 `src-tauri/src/commands/tool.rs`：

```rust
use crate::errors::AppError;
use crate::models::tool::{InstallResult, ToolStatus};
use crate::services::tool_service::ToolService;

#[tauri::command]
pub async fn check_tool_status(tool: String) -> Result<ToolStatus, AppError> {
    ToolService::check_status(&tool)
}

#[tauri::command]
pub async fn install_tool(tool: String, method: String) -> Result<InstallResult, AppError> {
    ToolService::install(&tool, &method)
}

#[tauri::command]
pub async fn uninstall_tool(tool: String) -> Result<(), AppError> {
    ToolService::uninstall(&tool)
}

#[tauri::command]
pub async fn check_tool_running(tool: String) -> Result<bool, AppError> {
    ToolService::check_running(&tool)
}

#[tauri::command]
pub async fn kill_tool_process(tool: String) -> Result<(), AppError> {
    ToolService::kill_process(&tool)
}
```

更新 `src-tauri/src/commands/mod.rs`：

```rust
pub mod system;
pub mod tool;
pub mod vendor;
```

**Step 4: 注册新 Commands 并添加 Shell 权限**

在 `lib.rs` 的 `invoke_handler` 中添加：

```rust
commands::tool::check_tool_status,
commands::tool::install_tool,
commands::tool::uninstall_tool,
commands::tool::check_tool_running,
commands::tool::kill_tool_process,
```

在 `src-tauri/capabilities/default.json` 中确保包含 shell 权限（或添加新的 capability 文件）。

**Step 5: 验证编译**

```bash
cd src-tauri && cargo check
```

**Step 6: 提交**

```bash
git add -A
git commit -m "feat: add tool management commands - install, uninstall, status check, process management"
```

---

## Task 6: Rust MCP 与文档管理 Commands

**Files:**
- Create: `src-tauri/src/commands/mcp.rs`
- Create: `src-tauri/src/commands/docs.rs`
- Create: `src-tauri/src/commands/settings.rs`
- Create: `src-tauri/src/services/mcp_service.rs`
- Create: `src-tauri/src/services/docs_service.rs`
- Create: `src-tauri/src/services/settings_service.rs`
- Modify: `src-tauri/src/commands/mod.rs`
- Modify: `src-tauri/src/services/mod.rs`
- Modify: `src-tauri/src/lib.rs`

**Step 1: 创建 McpService**

创建 `src-tauri/src/services/mcp_service.rs`：

```rust
use crate::errors::AppError;
use crate::models::mcp::{McpServer, McpServerInput};
use std::collections::HashMap;

pub struct McpService;

impl McpService {
    fn get_config_path() -> Result<std::path::PathBuf, AppError> {
        let home = dirs::home_dir().ok_or(AppError::FileSystem(
            std::io::Error::new(std::io::ErrorKind::NotFound, "Home directory not found")
        ))?;
        Ok(home.join(".claude.json"))
    }

    fn read_config() -> Result<serde_json::Value, AppError> {
        let path = Self::get_config_path()?;
        if path.exists() {
            let content = std::fs::read_to_string(&path)?;
            Ok(serde_json::from_str(&content)?)
        } else {
            Ok(serde_json::json!({"mcpServers": {}}))
        }
    }

    fn write_config(config: &serde_json::Value) -> Result<(), AppError> {
        let path = Self::get_config_path()?;
        let content = serde_json::to_string_pretty(config)?;
        std::fs::write(&path, content)?;
        Ok(())
    }

    pub fn get_all() -> Result<Vec<McpServer>, AppError> {
        let config = Self::read_config()?;
        let servers = config.get("mcpServers")
            .and_then(|s| s.as_object())
            .cloned()
            .unwrap_or_default();

        let mut result = Vec::new();
        for (name, value) in servers {
            let server_type = value.get("type")
                .and_then(|t| t.as_str())
                .unwrap_or("stdio")
                .to_string();

            result.push(McpServer {
                name,
                server_type,
                command: value.get("command").and_then(|v| v.as_str()).map(String::from),
                args: value.get("args").and_then(|v| {
                    v.as_array().map(|a| a.iter().filter_map(|i| i.as_str().map(String::from)).collect())
                }),
                url: value.get("url").and_then(|v| v.as_str()).map(String::from),
                env: value.get("env").and_then(|v| serde_json::from_value(v.clone()).ok()),
                headers: value.get("headers").and_then(|v| serde_json::from_value(v.clone()).ok()),
            });
        }
        Ok(result)
    }

    pub fn add(input: McpServerInput) -> Result<McpServer, AppError> {
        let mut config = Self::read_config()?;
        let servers = config.as_object_mut().unwrap()
            .entry("mcpServers")
            .or_insert_with(|| serde_json::json!({}));

        let mut server_value = serde_json::Map::new();
        if let Some(ref cmd) = input.command {
            server_value.insert("command".to_string(), serde_json::json!(cmd));
        }
        if let Some(ref args) = input.args {
            server_value.insert("args".to_string(), serde_json::json!(args));
        }
        if let Some(ref url) = input.url {
            server_value.insert("url".to_string(), serde_json::json!(url));
        }
        if let Some(ref env) = input.env {
            server_value.insert("env".to_string(), serde_json::json!(env));
        }
        if input.server_type != "stdio" {
            server_value.insert("type".to_string(), serde_json::json!(input.server_type));
        }

        servers.as_object_mut().unwrap()
            .insert(input.name.clone(), serde_json::Value::Object(server_value));

        Self::write_config(&config)?;

        Ok(McpServer {
            name: input.name,
            server_type: input.server_type,
            command: input.command,
            args: input.args,
            url: input.url,
            env: input.env,
            headers: input.headers,
        })
    }

    pub fn delete(name: &str) -> Result<(), AppError> {
        let mut config = Self::read_config()?;
        if let Some(servers) = config.get_mut("mcpServers").and_then(|s| s.as_object_mut()) {
            servers.remove(name);
        }
        Self::write_config(&config)?;
        Ok(())
    }
}
```

**Step 2: 创建 DocsService**

创建 `src-tauri/src/services/docs_service.rs`：

```rust
use crate::errors::AppError;

pub struct DocsService;

impl DocsService {
    pub fn get_claude_md(path: Option<String>) -> Result<Option<String>, AppError> {
        let file_path = if let Some(p) = path {
            std::path::PathBuf::from(p).join("CLAUDE.md")
        } else {
            let home = dirs::home_dir().ok_or(AppError::FileSystem(
                std::io::Error::new(std::io::ErrorKind::NotFound, "Home directory not found")
            ))?;
            home.join("CLAUDE.md")
        };

        if file_path.exists() {
            Ok(Some(std::fs::read_to_string(&file_path)?))
        } else {
            Ok(None)
        }
    }

    pub fn save_claude_md(path: Option<String>, content: String) -> Result<(), AppError> {
        let file_path = if let Some(p) = path {
            std::path::PathBuf::from(p).join("CLAUDE.md")
        } else {
            let home = dirs::home_dir().ok_or(AppError::FileSystem(
                std::io::Error::new(std::io::ErrorKind::NotFound, "Home directory not found")
            ))?;
            home.join("CLAUDE.md")
        };

        std::fs::write(&file_path, content)?;
        Ok(())
    }
}
```

**Step 3: 创建 SettingsService**

创建 `src-tauri/src/services/settings_service.rs`：

```rust
use crate::db::Database;
use crate::errors::AppError;
use crate::models::settings::AppSettings;
use rusqlite::params;

pub struct SettingsService;

impl SettingsService {
    pub fn get_all(db: &Database) -> Result<AppSettings, AppError> {
        let conn = db.conn.lock().unwrap();
        let mut settings = AppSettings::default();

        if let Ok(val) = conn.query_row("SELECT value FROM settings WHERE key = 'theme'", [], |r| r.get::<_, String>(0)) {
            settings.theme = val;
        }
        if let Ok(val) = conn.query_row("SELECT value FROM settings WHERE key = 'language'", [], |r| r.get::<_, String>(0)) {
            settings.language = val;
        }
        if let Ok(val) = conn.query_row("SELECT value FROM settings WHERE key = 'last_tool'", [], |r| r.get::<_, String>(0)) {
            settings.last_tool = val;
        }
        Ok(settings)
    }

    pub fn update(db: &Database, key: &str, value: &str) -> Result<(), AppError> {
        let conn = db.conn.lock().unwrap();
        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES (?1, ?2)",
            params![key, value],
        )?;
        Ok(())
    }
}
```

**Step 4: 创建对应的 Commands 文件**

创建 `src-tauri/src/commands/mcp.rs`、`docs.rs`、`settings.rs`（每个文件包含对应的 `#[tauri::command]` 函数，调用相应的 Service）。

**Step 5: 注册所有新 Commands**

在 `lib.rs` 的 `invoke_handler` 中注册所有新 commands。

**Step 6: 验证编译**

```bash
cd src-tauri && cargo check
```

**Step 7: 提交**

```bash
git add -A
git commit -m "feat: add MCP, docs, and settings commands"
```

---

## Task 7: 前端 i18n 与主题系统

**Files:**
- Create: `src/lib/i18n.ts`
- Create: `src/locales/zh.json`
- Create: `src/locales/en.json`
- Create: `src/stores/use-settings-store.ts`
- Create: `src/stores/use-tool-store.ts`
- Create: `src/stores/use-platform-store.ts`
- Create: `src/hooks/use-tauri-command.ts`
- Create: `src/types/vendor.ts`
- Create: `src/types/tool.ts`
- Create: `src/types/mcp.ts`
- Create: `src/types/settings.ts`
- Modify: `src/main.tsx`

**Step 1: 创建 i18n 配置**

创建 `src/lib/i18n.ts`：初始化 i18next，加载中英文资源文件。

**Step 2: 创建中英文语言文件**

创建基本的翻译键值，包括侧边栏菜单、通用操作（添加、编辑、删除、保存、取消）、供应商管理、工具管理等。

**Step 3: 创建 TypeScript 类型定义**

在 `src/types/` 下创建与 Rust 模型对应的 TypeScript 接口。

**Step 4: 创建 Zustand Stores**

- `use-settings-store.ts`：主题模式、语言设置
- `use-tool-store.ts`：当前选中工具、可用功能列表
- `use-platform-store.ts`：平台信息缓存

**Step 5: 创建 useTauriCommand Hook**

封装 `invoke()` 调用，提供 loading/error/data/refetch。

**Step 6: 在 `main.tsx` 中初始化 i18n**

**Step 7: 验证前端编译**

```bash
pnpm dev
```

**Step 8: 提交**

```bash
git add -A
git commit -m "feat: add i18n, theme system, zustand stores, and type definitions"
```

---

## Task 8: 前端根布局与动态侧边栏

**Files:**
- Create: `src/components/sidebar/index.tsx`
- Create: `src/components/title-bar/index.tsx`
- Create: `src/routes/__root.tsx`
- Create: `src/routes/index.tsx`
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`

**Step 1: 创建自定义标题栏组件**

创建 `src/components/title-bar/index.tsx`：实现 Windows 自定义标题栏，带最小化/最大化/关闭按钮。

**Step 2: 创建动态侧边栏组件**

创建 `src/components/sidebar/index.tsx`：
- 顶部工具选择器（下拉菜单：Claude Code / Codex）
- 根据当前工具动态渲染菜单项
- 底部设置入口 + 版本号 + 语言切换
- 使用 shadcn/ui 的 Select、Button 等组件
- FontAwesome 图标

**Step 3: 创建根布局路由**

创建 `src/routes/__root.tsx`：侧边栏 + 内容区的 flex 布局。

**Step 4: 创建首页重定向**

创建 `src/routes/index.tsx`：重定向到上次使用的工具页面。

**Step 5: 更新 App.tsx 和 main.tsx**

集成 TanStack Router。

**Step 6: 安装需要的 shadcn/ui 组件**

```bash
pnpm dlx shadcn@latest add button select dropdown-menu separator tooltip scroll-area
```

**Step 7: 验证 UI 渲染**

```bash
pnpm tauri dev
```

预期：应用启动，显示侧边栏和标题栏，可以切换工具和菜单高亮。

**Step 8: 提交**

```bash
git add -A
git commit -m "feat: add root layout with dynamic sidebar and custom title bar"
```

---

## Task 9: 供应商管理页面

**Files:**
- Create: `src/pages/vendors/index.tsx`
- Create: `src/components/vendor-card/index.tsx`
- Create: `src/components/vendor-form-dialog/index.tsx`
- Create: `src/stores/use-vendor-store.ts`
- Create: `src/routes/$tool/vendors.tsx`

**Step 1: 安装需要的 shadcn/ui 组件**

```bash
pnpm dlx shadcn@latest add card dialog input label badge toast sonner
```

**Step 2: 创建 VendorStore**

```typescript
// stores/use-vendor-store.ts
// Zustand store，通过 invoke() 调用 Rust 后端
// 提供 vendors 列表、loading 状态和 CRUD 操作
```

**Step 3: 创建 VendorCard 组件**

展示供应商信息的卡片，包括名称、URL、激活状态，操作按钮（编辑/删除/激活）。

**Step 4: 创建 VendorFormDialog 组件**

添加/编辑供应商的表单弹窗，包含：
- 预设供应商快速选择（智谱、月之暗面等）
- 手动配置表单（名称、URL、Token、模型等）
- 预设选择时自动填充 URL 和模型

**Step 5: 创建供应商管理页面**

组合 VendorCard 列表 + 添加按钮 + VendorFormDialog。

**Step 6: 创建路由文件**

**Step 7: 验证 UI**

```bash
pnpm tauri dev
```

预期：可以添加、编辑、删除、激活供应商配置。

**Step 8: 提交**

```bash
git add -A
git commit -m "feat: add vendor management page with CRUD and preset vendors"
```

---

## Task 10: 工具管理页面

**Files:**
- Create: `src/pages/tools/index.tsx`
- Create: `src/components/tool-status-card/index.tsx`
- Create: `src/routes/$tool/tools.tsx`

**Step 1: 创建 ToolStatusCard 组件**

显示工具安装状态、版本、路径、运行状态，提供安装/卸载/终止进程的按钮。

**Step 2: 创建工具管理页面**

整合 ToolStatusCard + 安装方式选择 + 操作反馈。

**Step 3: 创建路由文件**

**Step 4: 验证 UI**

```bash
pnpm tauri dev
```

预期：正确检测工具安装状态，可以触发安装/卸载操作。

**Step 5: 提交**

```bash
git add -A
git commit -m "feat: add tool management page with install/uninstall/status detection"
```

---

## Task 11: MCP 服务器管理页面

**Files:**
- Create: `src/pages/mcp-servers/index.tsx`
- Create: `src/components/mcp-server-card/index.tsx`
- Create: `src/components/mcp-form-dialog/index.tsx`
- Create: `src/routes/claude-code/mcp/servers.tsx`

**Step 1: 创建 MCP 相关组件**

McpServerCard 显示 MCP 服务器信息，McpFormDialog 提供添加/编辑表单。

**Step 2: 创建 MCP 服务器管理页面**

**Step 3: 创建路由文件**

**Step 4: 验证 UI**

**Step 5: 提交**

```bash
git add -A
git commit -m "feat: add MCP server management page"
```

---

## Task 12: CLAUDE.md 编辑器页面

**Files:**
- Create: `src/pages/claude-md/index.tsx`
- Create: `src/routes/claude-code/docs/claude-md.tsx`

**Step 1: 安装 Markdown 编辑器**

```bash
pnpm add @uiw/react-md-editor
```

或使用 shadcn/ui 的 textarea 组件实现简易编辑器。

**Step 2: 创建 CLAUDE.md 编辑页面**

包含 Markdown 编辑器、保存按钮、文件状态指示。

**Step 3: 创建路由文件**

**Step 4: 验证 UI**

**Step 5: 提交**

```bash
git add -A
git commit -m "feat: add CLAUDE.md editor page"
```

---

## Task 13: 设置页面

**Files:**
- Create: `src/pages/settings/index.tsx`
- Create: `src/routes/settings.tsx`

**Step 1: 创建设置页面**

- 主题选择（浅色 / 深色 / 跟随系统）
- 语言选择（中文 / English）
- 关于信息（版本号等）

**Step 2: 创建路由文件**

**Step 3: 集成主题切换**

Tailwind dark mode + Zustand 状态联动。

**Step 4: 验证 UI**

**Step 5: 提交**

```bash
git add -A
git commit -m "feat: add settings page with theme and language switching"
```

---

## Task 14: 窗口样式与最终整合

**Files:**
- Modify: `src-tauri/tauri.conf.json`
- Modify: `src/components/title-bar/index.tsx`
- 可能修改多个组件做最终 UI 调整

**Step 1: 配置 Tauri 窗口**

更新 `tauri.conf.json`：

```json
{
  "app": {
    "windows": [{
      "title": "VibeLever",
      "width": 1100,
      "height": 750,
      "minWidth": 900,
      "minHeight": 600,
      "decorations": false,
      "transparent": false
    }]
  }
}
```

macOS 使用 `"decorations": true` + `"titleBarStyle": "transparent"`。

**Step 2: 完善标题栏**

确保拖拽区域、按钮交互在 Windows 上正常工作。

**Step 3: 全局 UI polish**

- 检查所有页面的响应式布局
- 检查深色模式下的样式
- 统一间距和颜色

**Step 4: 运行完整应用测试**

```bash
pnpm tauri dev
```

遍历所有页面，验证功能完整性。

**Step 5: 提交**

```bash
git add -A
git commit -m "feat: finalize window styling and UI polish"
```

---

## 验证计划

### 自动化验证

```bash
# Rust 编译检查
cd src-tauri && cargo check

# TypeScript 类型检查
pnpm tsc --noEmit

# 前端构建检查
pnpm build
```

### 手动验证

1. **启动应用** — `pnpm tauri dev`，确认应用正常启动
2. **工具选择器** — 在侧边栏切换 Claude Code / Codex，验证菜单动态变化
3. **供应商管理** — 添加预设供应商 → 编辑 → 激活 → 检查配置文件是否正确写入 → 删除
4. **工具检测** — 正确检测本机 Claude Code / Codex 的安装状态
5. **MCP 管理** — 添加 MCP 服务器 → 编辑 → 删除 → 检查 `.claude.json` 是否正确更新
6. **CLAUDE.md** — 创建/编辑/保存 CLAUDE.md → 验证文件内容
7. **设置** — 切换主题（浅色 ↔ 深色）→ 切换语言（中 ↔ EN）→ 重启应用验证持久化
8. **自定义标题栏** — Windows 上验证最小化/最大化/关闭按钮，拖拽移动窗口
