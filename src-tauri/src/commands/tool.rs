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
