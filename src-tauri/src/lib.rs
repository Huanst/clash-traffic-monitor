// Built with care. — Huanst

mod models;
mod aggregator;
mod clash_client;

use std::sync::Arc;
use tauri::{
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, State,
};
use clash_client::ClashManager;
use models::TrafficSummary;

struct AppState {
    clash_manager: Arc<ClashManager>,
}

#[tauri::command]
fn get_traffic_summary(state: State<'_, AppState>) -> Result<TrafficSummary, String> {
    Ok(state.clash_manager.get_summary())
}

#[tauri::command]
fn reset_traffic_stats(state: State<'_, AppState>) -> Result<(), String> {
    state.clash_manager.reset();
    Ok(())
}

#[tauri::command]
fn update_clash_config(
    api_url: String,
    secret: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    *state.clash_manager.api_url.write().unwrap() = api_url;
    *state.clash_manager.secret.write().unwrap() = secret;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let clash_manager = Arc::new(ClashManager::new());
    let clash_manager_clone = Arc::clone(&clash_manager);

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(AppState {
            clash_manager: clash_manager_clone,
        })
        .setup(move |app| {
            let handle = app.handle().clone();

            // Hide Dock icon on macOS (Menu bar only Accessory app)
            #[cfg(target_os = "macos")]
            {
                let _ = app.set_activation_policy(tauri::ActivationPolicy::Accessory);
            }

            // Auto-hide when user clicks outside the window (focus lost)
            if let Some(window) = app.get_webview_window("main") {
                let w = window.clone();
                window.on_window_event(move |event| {
                    if let tauri::WindowEvent::Focused(false) = event {
                        let _ = w.hide();
                    }
                });
            }

            // Setup System Tray
            let _tray = TrayIconBuilder::with_id("main_tray")
                .tooltip("Clash 流量监控")
                .title("🚀")
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        position,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let is_visible = window.is_visible().unwrap_or(false);
                            if is_visible {
                                let _ = window.hide();
                            } else {
                                // Align window directly below the clicked tray icon
                                let x = ((position.x as i32) - 190).max(10);
                                let y = (position.y as i32) + 14;
                                let _ = window.set_position(tauri::Position::Physical(
                                    tauri::PhysicalPosition { x, y },
                                ));
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;

            // Start Clash Background Loop
            clash_manager.start_background_loop(handle);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_traffic_summary,
            reset_traffic_stats,
            update_clash_config,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
