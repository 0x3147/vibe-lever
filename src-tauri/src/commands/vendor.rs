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
pub async fn add_vendor(
    db: State<'_, Database>,
    tool: String,
    vendor: VendorInput,
) -> Result<Vendor, AppError> {
    VendorService::add(&db, &tool, vendor)
}

#[tauri::command]
pub async fn update_vendor(
    db: State<'_, Database>,
    id: i64,
    vendor: VendorInput,
) -> Result<Vendor, AppError> {
    VendorService::update(&db, id, vendor)
}

#[tauri::command]
pub async fn delete_vendor(db: State<'_, Database>, id: i64) -> Result<(), AppError> {
    VendorService::delete(&db, id)
}

#[tauri::command]
pub async fn activate_vendor(
    db: State<'_, Database>,
    tool: String,
    id: i64,
) -> Result<(), AppError> {
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
