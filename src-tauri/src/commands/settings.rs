use crate::db::Database;
use crate::errors::AppError;
use crate::models::settings::AppSettings;
use crate::services::settings_service::SettingsService;
use tauri::State;

#[tauri::command]
pub async fn get_settings(db: State<'_, Database>) -> Result<AppSettings, AppError> {
    SettingsService::get_all(&db)
}

#[tauri::command]
pub async fn update_setting(
    db: State<'_, Database>,
    key: String,
    value: String,
) -> Result<(), AppError> {
    SettingsService::update(&db, &key, &value)
}
