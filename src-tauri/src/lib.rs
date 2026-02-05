mod commands;
mod crypto;
mod storage;

use commands::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState::default())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .invoke_handler(tauri::generate_handler![
            commands::get_vault_status,
            commands::setup_vault,
            commands::unlock_vault,
            commands::lock_vault,
            commands::get_vault,
            commands::add_folder,
            commands::update_folder,
            commands::delete_folder,
            commands::add_secret,
            commands::update_secret,
            commands::delete_secret,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
