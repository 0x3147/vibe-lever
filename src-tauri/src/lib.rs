mod commands;
mod db;
mod errors;
mod models;
mod services;
mod utils;

use db::Database;
use services::vendor_service::VendorService;
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
            // 若 claude-code 供应商列表为空，从 ~/.claude/settings.json 自动导入
            if VendorService::get_all(&db, "claude-code")
                .unwrap_or_default()
                .is_empty()
            {
                if let Ok(Some(input)) = utils::config_parser::read_claude_settings() {
                    if let Ok(vendor) = VendorService::add(&db, "claude-code", input) {
                        let _ = VendorService::activate(&db, "claude-code", vendor.id);
                    }
                }
            }
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
            commands::tool::check_node_status,
            commands::tool::install_nvm,
            commands::tool::install_node_lts,
            // mcp commands
            commands::mcp::get_mcp_servers,
            commands::mcp::add_mcp_server,
            commands::mcp::delete_mcp_server,
            // docs commands
            commands::docs::get_claude_md,
            commands::docs::save_claude_md,
            // settings commands
            commands::settings::get_settings,
            commands::settings::update_setting,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
