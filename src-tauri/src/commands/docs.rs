use crate::errors::AppError;
use crate::services::docs_service::DocsService;

#[tauri::command]
pub async fn get_claude_md(path: Option<String>) -> Result<Option<String>, AppError> {
    DocsService::get_claude_md(path)
}

#[tauri::command]
pub async fn save_claude_md(path: Option<String>, content: String) -> Result<(), AppError> {
    DocsService::save_claude_md(path, content)
}
