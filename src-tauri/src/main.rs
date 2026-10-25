// Ховає консольне вікно у релізній збірці Windows
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::WebviewWindow;
use tauri_plugin_dialog::DialogExt;

/// Зберігає резервну копію: показує системне вікно «Зберегти як» і записує JSON.
/// Повертає шлях до файлу або `None`, якщо користувач скасував.
#[tauri::command]
async fn export_backup(window: WebviewWindow, contents: String, file_name: String) -> Result<Option<String>, String> {
    let picked = window
        .dialog()
        .file()
        .set_parent(&window)
        .set_title("Зберегти резервну копію")
        .set_file_name(&file_name)
        .add_filter("Резервна копія (JSON)", &["json"])
        .blocking_save_file();
    let Some(picked) = picked else { return Ok(None) };
    let path = picked.into_path().map_err(|e| e.to_string())?;
    std::fs::write(&path, contents).map_err(|e| format!("Не вдалося зберегти файл: {e}"))?;
    Ok(Some(path.display().to_string()))
}

/// Відкриває системне вікно вибору файлу й повертає вміст обраної резервної копії.
#[tauri::command]
async fn import_backup(window: WebviewWindow) -> Result<Option<String>, String> {
    let picked = window
        .dialog()
        .file()
        .set_parent(&window)
        .set_title("Відкрити резервну копію")
        .add_filter("Резервна копія (JSON)", &["json"])
        .blocking_pick_file();
    let Some(picked) = picked else { return Ok(None) };
    let path = picked.into_path().map_err(|e| e.to_string())?;
    std::fs::read_to_string(&path)
        .map(Some)
        .map_err(|e| format!("Не вдалося прочитати файл: {e}"))
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![export_backup, import_backup])
        .run(tauri::generate_context!())
        .expect("не вдалося запустити «Моє меню»");
}
