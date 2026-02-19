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
