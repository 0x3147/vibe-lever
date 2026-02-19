use crate::errors::AppError;
use crate::models::tool::{InstallResult, ToolStatus};
use crate::services::tool_service::ToolService;

#[tauri::command]
pub async fn check_tool_status(
    tool: String,
    db: tauri::State<'_, crate::db::Database>,
) -> Result<ToolStatus, AppError> {
    ToolService::check_status(&tool, &db)
}

#[tauri::command]
pub async fn install_tool(
    tool: String,
    method: String,
    db: tauri::State<'_, crate::db::Database>,
) -> Result<InstallResult, AppError> {
    let result = ToolService::install(&tool, &method)?;
    if result.success {
        if let Ok(s) = ToolService::check_status(&tool, &db) {
            let _ = s;
        }
    }
    Ok(result)
}

#[tauri::command]
pub async fn uninstall_tool(
    tool: String,
    db: tauri::State<'_, crate::db::Database>,
) -> Result<(), AppError> {
    ToolService::uninstall(&tool)?;
    use crate::services::tool_cache_service::ToolCacheService;
    ToolCacheService::set(&db, &tool, &ToolStatus {
        installed: false, version: None, path: None,
        install_method: None, running: false,
    });
    Ok(())
}

#[tauri::command]
pub async fn check_tool_running(tool: String) -> Result<bool, AppError> {
    ToolService::check_running(&tool)
}

#[tauri::command]
pub async fn kill_tool_process(tool: String) -> Result<(), AppError> {
    ToolService::kill_process(&tool)
}

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

use tauri::Emitter;
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
        if let Ok(s) = ToolService::check_status(&tool, &db) {
            let _ = s;
        }
    }
    app.emit("install-done", serde_json::json!({ "success": success }))
        .map_err(|e| AppError::ShellCommand(e.to_string()))?;
    Ok(())
}

fn build_install_cmd(tool: &str, method: &str) -> Result<TokioCommand, AppError> {
    let cmd = match (tool, method) {
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
