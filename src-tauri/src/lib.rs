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
            let app_dir = app
                .path()
                .app_data_dir()
                .expect("failed to get app data dir");
            let db = Database::new(app_dir).expect("failed to initialize database");
            app.manage(db);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // vendor commands
            commands::vendor::get_vendors,
            commands::vendor::add_vendor,
            commands::vendor::update_vendor,
            commands::vendor::delete_vendor,
            commands::vendor::activate_vendor,
            // system commands
            commands::system::get_platform_info,
            // tool commands
            commands::tool::check_tool_status,
            commands::tool::install_tool,
            commands::tool::uninstall_tool,
            commands::tool::check_tool_running,
            commands::tool::kill_tool_process,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
