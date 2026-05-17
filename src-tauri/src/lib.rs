use std::net::TcpStream;
use std::path::PathBuf;
use std::process::{Child, Command};
use std::sync::Mutex;
use std::time::Duration;

use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, RunEvent,
};

// ─── Backend process state ─────────────────────────────────
struct BackendProcess(Mutex<Option<Child>>);

const BACKEND_ADDR: &str = "127.0.0.1:8765";

// ─── Resolve path to backend exe (dev vs prod) ─────────────
fn backend_exe_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let exe_name = if cfg!(target_os = "windows") {
        "edu-agent-backend.exe"
    } else {
        "edu-agent-backend"
    };

    if cfg!(debug_assertions) {
        // Dev: cwd is src-tauri/, go up to project root
        let p = std::env::current_dir()
            .map_err(|e| e.to_string())?
            .join("..")
            .join("backend")
            .join("dist")
            .join("edu-agent-backend")
            .join(exe_name);
        Ok(p)
    } else {
        // Prod: bundled via tauri.conf.json `bundle.resources`
        let resource_dir = app
            .path()
            .resource_dir()
            .map_err(|e| format!("resource_dir: {}", e))?;
        Ok(resource_dir
            .join("resources")
            .join("edu-agent-backend")
            .join(exe_name))
    }
}

// ─── Spawn backend process ─────────────────────────────────
fn spawn_backend(app: &tauri::AppHandle) -> Result<Child, String> {
    let exe = backend_exe_path(app)?;
    if !exe.exists() {
        return Err(format!("Backend exe not found at: {}", exe.display()));
    }

    println!("[backend] starting: {}", exe.display());

    let mut cmd = Command::new(&exe);

    // PyInstaller onedir needs cwd = exe's folder (to find _internal/)
    if let Some(parent) = exe.parent() {
        cmd.current_dir(parent);
    }

    // In release on Windows, hide the console window of the child
    #[cfg(all(target_os = "windows", not(debug_assertions)))]
    {
        use std::os::windows::process::CommandExt;
        use std::process::Stdio;
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        cmd.creation_flags(CREATE_NO_WINDOW);
        cmd.stdout(Stdio::null());
        cmd.stderr(Stdio::null());
    }

    cmd.spawn().map_err(|e| format!("spawn failed: {}", e))
}

// ─── Wait for backend to accept TCP (no extra deps) ────────
fn wait_for_backend(timeout_secs: u64) -> bool {
    let addr = BACKEND_ADDR.parse().unwrap();
    let start = std::time::Instant::now();
    while start.elapsed().as_secs() < timeout_secs {
        if TcpStream::connect_timeout(&addr, Duration::from_millis(500)).is_ok() {
            return true;
        }
        std::thread::sleep(Duration::from_millis(150));
    }
    false
}

// ─── Tauri commands (callable from frontend) ───────────────
#[tauri::command]
fn ping() -> String {
    "pong from tauri".to_string()
}

#[tauri::command]
fn toggle_floating(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("floating") {
        if win.is_visible().map_err(|e| e.to_string())? {
            win.hide().map_err(|e| e.to_string())?;
        } else {
            win.show().map_err(|e| e.to_string())?;
            win.set_focus().map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

#[tauri::command]
fn backend_status() -> bool {
    let addr: std::net::SocketAddr = match BACKEND_ADDR.parse() {
        Ok(a) => a,
        Err(_) => return false,
    };
    TcpStream::connect_timeout(&addr, Duration::from_millis(300)).is_ok()
}

// ─── App entry ─────────────────────────────────────────────
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(BackendProcess(Mutex::new(None)))
        .setup(|app| {
            // ── Start backend ──
            let handle = app.handle().clone();
            let state = app.state::<BackendProcess>();
            match spawn_backend(&handle) {
                Ok(child) => {
                    println!("[backend] pid = {}", child.id());
                    *state.0.lock().unwrap() = Some(child);

                    // Probe in background so UI doesn't block
                    std::thread::spawn(move || {
                        if wait_for_backend(20) {
                            println!("[backend] ready on {}", BACKEND_ADDR);
                        } else {
                            eprintln!("[backend] TIMEOUT — not responding after 20s");
                        }
                    });
                }
                Err(e) => {
                    eprintln!("[backend] FAILED to start: {}", e);
                }
            }

            // ── Tray (unchanged) ──
            let show_main = MenuItem::with_id(app, "show_main", "Open Main Window", true, None::<&str>)?;
            let toggle_chat = MenuItem::with_id(app, "toggle_chat", "Toggle Chat Window", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_main, &toggle_chat, &quit])?;

            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("EduAgent")
                .menu(&menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show_main" => {
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                    "toggle_chat" => {
                        if let Some(w) = app.get_webview_window("floating") {
                            let visible = w.is_visible().unwrap_or(false);
                            if visible {
                                let _ = w.hide();
                            } else {
                                let _ = w.show();
                                let _ = w.set_focus();
                            }
                        }
                    }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(w) = app.get_webview_window("floating") {
                            let visible = w.is_visible().unwrap_or(false);
                            if visible {
                                let _ = w.hide();
                            } else {
                                let _ = w.show();
                                let _ = w.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            ping,
            toggle_floating,
            backend_status
        ])
        .build(tauri::generate_context!())
        .expect("error building tauri application");

    // ── Kill backend on exit ──
    app.run(|app_handle, event| {
        if let RunEvent::ExitRequested { .. } = event {
            if let Some(state) = app_handle.try_state::<BackendProcess>() {
                if let Ok(mut guard) = state.0.lock() {
                    if let Some(mut child) = guard.take() {
                        println!("[backend] killing pid {}", child.id());
                        let _ = child.kill();
                        let _ = child.wait();
                    }
                }
            }
        }
    });
}