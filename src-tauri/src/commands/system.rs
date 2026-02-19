use crate::models::tool::PlatformInfo;
use crate::utils::platform;

#[tauri::command]
pub async fn get_platform_info() -> Result<PlatformInfo, String> {
    Ok(platform::get_platform_info())
}
