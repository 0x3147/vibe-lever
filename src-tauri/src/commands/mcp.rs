use crate::errors::AppError;
use crate::models::mcp::{McpServer, McpServerInput};
use crate::services::mcp_service::McpService;

#[tauri::command]
pub async fn get_mcp_servers() -> Result<Vec<McpServer>, AppError> {
    McpService::get_all()
}

#[tauri::command]
pub async fn add_mcp_server(server: McpServerInput) -> Result<McpServer, AppError> {
    McpService::add(server)
}

#[tauri::command]
pub async fn delete_mcp_server(name: String) -> Result<(), AppError> {
    McpService::delete(&name)
}
