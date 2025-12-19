use tauri::{
    menu::{Menu, MenuItem},
    tray::{TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, Runtime,
};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};

#[tauri::command]
fn update_super_key<R: Runtime>(app: tauri::AppHandle<R>, shortcut_str: String) -> Result<(), String> {
    let _ = app.global_shortcut().unregister_all();
    
    let shortcut: Shortcut = shortcut_str.parse().map_err(|_| format!("invalid shortcut: {}", shortcut_str))?;
    
    app.global_shortcut().on_shortcut(shortcut, move |app, _shortcut, event| {
        if event.state() == tauri_plugin_global_shortcut::ShortcutState::Pressed {
            if let Some(window) = app.get_webview_window("notch") {
                if !window.is_visible().unwrap() {
                    if let Ok(Some(monitor)) = window.primary_monitor() {
                        let size = monitor.size();
                        let window_size = window.outer_size().unwrap();
                        let x = (size.width as i32 - window_size.width as i32) / 2;
                        window.set_position(tauri::PhysicalPosition::new(x, 0)).unwrap();
                    }
                    window.show().unwrap();
                    window.set_focus().unwrap();
                }
            }
            let _ = app.emit("super-key-press", ());
        }
    }).map_err(|e| e.to_string())?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![update_super_key])
        .setup(|app| {
            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let show_i = MenuItem::with_id(app, "show", "Open App", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &quit_i])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                        app.exit(0);
                    }
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            window.show().unwrap();
                            window.set_focus().unwrap();
                        }
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click { .. } = event {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("notch") {
                            let is_visible = window.is_visible().unwrap();
                            if is_visible {
                                window.hide().unwrap();
                            } else {
                                if let Ok(Some(monitor)) = window.primary_monitor() {
                                    let size = monitor.size();
                                    let window_size = window.outer_size().unwrap();
                                    let x = (size.width as i32 - window_size.width as i32) / 2;
                                    window.set_position(tauri::PhysicalPosition::new(x, 0)).unwrap();
                                }
                                window.show().unwrap();
                                window.set_focus().unwrap();
                            }
                        }
                    }
                })
                .build(app)?;

            // Register default Super Key
            // Note: In a real app, we'd read this from the store instead.
            // For now, let's start with a default.
            let _app_handle = app.handle().clone();
            app.global_shortcut().on_shortcut("CommandOrControl+Shift+X", move |app, _shortcut, event| {
                if event.state() == tauri_plugin_global_shortcut::ShortcutState::Pressed {
                    if let Some(window) = app.get_webview_window("notch") {
                        if !window.is_visible().unwrap() {
                            if let Ok(Some(monitor)) = window.primary_monitor() {
                                let size = monitor.size();
                                let window_size = window.outer_size().unwrap();
                                let x = (size.width as i32 - window_size.width as i32) / 2;
                                window.set_position(tauri::PhysicalPosition::new(x, 0)).unwrap();
                            }
                            window.show().unwrap();
                            window.set_focus().unwrap();
                        }
                    }
                    let _ = app.emit("super-key-press", ());
                }
            }).unwrap();

            // Prevent app from quitting when main window is closed
            if let Some(main_window) = app.get_webview_window("main") {
                let main_window_clone = main_window.clone();
                main_window.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        main_window_clone.hide().unwrap();
                    }
                });
            }

            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
