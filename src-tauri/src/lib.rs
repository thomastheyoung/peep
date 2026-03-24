use notify::{Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use serde::Serialize;
use std::collections::HashSet;
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem, Submenu};
use tauri::{Emitter, Manager, RunEvent};

const ALLOWED_EXTENSIONS: &[&str] = &["md", "markdown"];

#[cfg(target_os = "macos")]
mod default_viewer {
    use core_foundation::base::TCFType;
    use core_foundation::string::{CFString, CFStringRef};

    const MARKDOWN_UTI: &str = "net.daringfireball.markdown";
    const BUNDLE_ID: &str = "com.tlj.peep";
    const LS_ROLES_ALL: u32 = 0xFFFFFFFF;

    #[link(name = "CoreServices", kind = "framework")]
    extern "C" {
        fn LSCopyDefaultRoleHandlerForContentType(
            content_type: CFStringRef,
            role: u32,
        ) -> CFStringRef;

        fn LSSetDefaultRoleHandlerForContentType(
            content_type: CFStringRef,
            role: u32,
            handler_bundle_id: CFStringRef,
        ) -> i32;
    }

    pub fn is_default() -> bool {
        let uti = CFString::new(MARKDOWN_UTI);
        let current = unsafe {
            LSCopyDefaultRoleHandlerForContentType(uti.as_concrete_TypeRef(), LS_ROLES_ALL)
        };
        if current.is_null() {
            return false;
        }
        let current_str = unsafe { CFString::wrap_under_create_rule(current) };
        current_str.to_string().eq_ignore_ascii_case(BUNDLE_ID)
    }

    pub fn set_default() -> Result<(), String> {
        let uti = CFString::new(MARKDOWN_UTI);
        let bundle = CFString::new(BUNDLE_ID);
        let result = unsafe {
            LSSetDefaultRoleHandlerForContentType(
                uti.as_concrete_TypeRef(),
                LS_ROLES_ALL,
                bundle.as_concrete_TypeRef(),
            )
        };
        if result == 0 {
            Ok(())
        } else {
            Err(format!("Failed to set default handler (error {result})"))
        }
    }
}

fn is_markdown_file(path: &PathBuf) -> bool {
    path.extension()
        .and_then(|e| e.to_str())
        .is_some_and(|e| ALLOWED_EXTENSIONS.contains(&e))
}

struct AppState {
    watched_files: Mutex<HashSet<PathBuf>>,
    watcher: Mutex<Option<RecommendedWatcher>>,
    initial_files: Mutex<Vec<String>>,
}

#[derive(Clone, Serialize)]
struct FileContent {
    path: String,
    content: String,
    filename: String,
}

#[tauri::command]
fn read_file(path: String) -> Result<FileContent, String> {
    let canonical =
        fs::canonicalize(PathBuf::from(&path)).map_err(|e| format!("Cannot resolve path: {e}"))?;

    if !is_markdown_file(&canonical) {
        return Err("Only .md and .markdown files are supported".into());
    }

    let content =
        fs::read_to_string(&canonical).map_err(|e| format!("Cannot read file: {e}"))?;
    let filename = canonical
        .file_name()
        .map(|n| n.to_string_lossy().into_owned())
        .unwrap_or_else(|| path.clone());

    Ok(FileContent {
        path: canonical.to_string_lossy().into_owned(),
        content,
        filename,
    })
}

#[tauri::command]
fn watch_file(path: String, app: tauri::AppHandle) -> Result<(), String> {
    let state = app.state::<AppState>();
    let path_buf =
        fs::canonicalize(PathBuf::from(&path)).map_err(|e| format!("Cannot resolve path: {e}"))?;

    if !is_markdown_file(&path_buf) {
        return Err("Only .md and .markdown files are supported".into());
    }

    let mut watched = state
        .watched_files
        .lock()
        .map_err(|e| format!("State lock poisoned: {e}"))?;
    if watched.contains(&path_buf) {
        return Ok(());
    }
    watched.insert(path_buf.clone());
    drop(watched);

    let handle = app.clone();
    let watch_path = path_buf.clone();

    let mut watcher_guard = state
        .watcher
        .lock()
        .map_err(|e| format!("Watcher lock poisoned: {e}"))?;
    if watcher_guard.is_none() {
        let handle = handle.clone();
        let watcher = notify::recommended_watcher(move |res: Result<Event, notify::Error>| {
            if let Ok(event) = res {
                if matches!(
                    event.kind,
                    EventKind::Modify(_) | EventKind::Create(_)
                ) {
                    for path in &event.paths {
                        if let Ok(content) = fs::read_to_string(path) {
                            let filename = path
                                .file_name()
                                .map(|n| n.to_string_lossy().into_owned())
                                .unwrap_or_default();
                            let _ = handle.emit(
                                "file-changed",
                                FileContent {
                                    path: path.to_string_lossy().into_owned(),
                                    content,
                                    filename,
                                },
                            );
                        }
                    }
                }
            }
        })
        .map_err(|e| format!("Cannot create watcher: {e}"))?;
        *watcher_guard = Some(watcher);
    }

    if let Some(watcher) = watcher_guard.as_mut() {
        watcher
            .watch(&watch_path, RecursiveMode::NonRecursive)
            .map_err(|e| format!("Cannot watch file: {e}"))?;
    }

    Ok(())
}

#[tauri::command]
fn unwatch_file(path: String, app: tauri::AppHandle) -> Result<(), String> {
    let state = app.state::<AppState>();
    let path_buf =
        fs::canonicalize(PathBuf::from(&path)).map_err(|e| format!("Cannot resolve path: {e}"))?;

    let mut watched = state
        .watched_files
        .lock()
        .map_err(|e| format!("State lock poisoned: {e}"))?;
    watched.remove(&path_buf);
    drop(watched);

    let mut watcher_guard = state
        .watcher
        .lock()
        .map_err(|e| format!("Watcher lock poisoned: {e}"))?;
    if let Some(watcher) = watcher_guard.as_mut() {
        let _ = watcher.unwatch(&path_buf);
    }

    Ok(())
}

#[tauri::command]
fn is_default_markdown_viewer() -> bool {
    #[cfg(target_os = "macos")]
    {
        default_viewer::is_default()
    }
    #[cfg(not(target_os = "macos"))]
    {
        false
    }
}

#[tauri::command]
fn set_default_markdown_viewer() -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        default_viewer::set_default()
    }
    #[cfg(not(target_os = "macos"))]
    {
        Err("Only supported on macOS".into())
    }
}

#[tauri::command]
fn get_initial_files(app: tauri::AppHandle) -> Vec<String> {
    let state = app.state::<AppState>();
    let mut guard = state
        .initial_files
        .lock()
        .unwrap_or_else(|e| e.into_inner());
    guard.drain(..).collect()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
            // args[0] is the binary path; real file args start at [1]
            let file_args: Vec<&str> = args.iter().skip(1).map(|s| s.as_str()).collect();
            let cwd = _cwd;
            for arg in file_args {
                let path = if PathBuf::from(arg).is_absolute() {
                    PathBuf::from(arg)
                } else {
                    PathBuf::from(&cwd).join(arg)
                };
                if let Ok(canonical) = fs::canonicalize(&path) {
                    if canonical.is_file() && is_markdown_file(&canonical) {
                        let _ = app.emit("open-file", canonical.to_string_lossy().into_owned());
                    } else if canonical.is_dir() {
                        if let Ok(entries) = fs::read_dir(&canonical) {
                            for entry in entries.flatten() {
                                let p = entry.path();
                                if is_markdown_file(&p) {
                                    let _ = app.emit("open-file", p.to_string_lossy().into_owned());
                                }
                            }
                        }
                    }
                }
            }
            // Focus the existing window
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
        }))
        .manage(AppState {
            watched_files: Mutex::new(HashSet::new()),
            watcher: Mutex::new(None),
            initial_files: Mutex::new(Vec::new()),
        })
        .invoke_handler(tauri::generate_handler![
            read_file,
            watch_file,
            unwatch_file,
            get_initial_files,
            is_default_markdown_viewer,
            set_default_markdown_viewer
        ])
        .setup(|app| {
            let handle = app.handle();

            let app_menu = Submenu::with_items(
                handle,
                "peep",
                true,
                &[
                    &PredefinedMenuItem::about(handle, None, None)?,
                    &PredefinedMenuItem::separator(handle)?,
                    &PredefinedMenuItem::services(handle, None)?,
                    &PredefinedMenuItem::separator(handle)?,
                    &PredefinedMenuItem::hide(handle, None)?,
                    &PredefinedMenuItem::hide_others(handle, None)?,
                    &PredefinedMenuItem::show_all(handle, None)?,
                    &PredefinedMenuItem::separator(handle)?,
                    &PredefinedMenuItem::quit(handle, None)?,
                ],
            )?;

            let edit_menu = Submenu::with_items(
                handle,
                "Edit",
                true,
                &[
                    &PredefinedMenuItem::undo(handle, None)?,
                    &PredefinedMenuItem::redo(handle, None)?,
                    &PredefinedMenuItem::separator(handle)?,
                    &PredefinedMenuItem::cut(handle, None)?,
                    &PredefinedMenuItem::copy(handle, None)?,
                    &PredefinedMenuItem::paste(handle, None)?,
                    &PredefinedMenuItem::select_all(handle, None)?,
                ],
            )?;

            let zoom_in =
                MenuItem::with_id(handle, "zoom_in", "Zoom In", true, Some("CmdOrCtrl+="))?;
            let zoom_out =
                MenuItem::with_id(handle, "zoom_out", "Zoom Out", true, Some("CmdOrCtrl+-"))?;
            let zoom_reset = MenuItem::with_id(
                handle,
                "zoom_reset",
                "Actual Size",
                true,
                Some("CmdOrCtrl+0"),
            )?;

            let view_menu = Submenu::with_items(
                handle,
                "View",
                true,
                &[&zoom_in, &zoom_out, &zoom_reset],
            )?;

            let menu = Menu::with_items(handle, &[&app_menu, &edit_menu, &view_menu])?;
            app.set_menu(menu)?;

            app.on_menu_event(|app, event| {
                let id = event.id();
                println!("[menu] event: {:?}", id);
                match id.as_ref() {
                    "zoom_in" => {
                        let _ = app.emit("zoom", "in");
                    }
                    "zoom_out" => {
                        let _ = app.emit("zoom", "out");
                    }
                    "zoom_reset" => {
                        let _ = app.emit("zoom", "reset");
                    }
                    _ => {}
                }
            });

            let args: Vec<String> = std::env::args().skip(1).collect();
            if !args.is_empty() {
                let state = app.state::<AppState>();
                let mut initial = state
                    .initial_files
                    .lock()
                    .unwrap_or_else(|e| e.into_inner());
                for arg in &args {
                    let path = if PathBuf::from(arg).is_absolute() {
                        PathBuf::from(arg)
                    } else {
                        std::env::current_dir().unwrap_or_default().join(arg)
                    };
                    if let Ok(canonical) = fs::canonicalize(&path) {
                        if canonical.is_file() && is_markdown_file(&canonical) {
                            initial.push(canonical.to_string_lossy().into_owned());
                        } else if canonical.is_dir() {
                            if let Ok(entries) = fs::read_dir(&canonical) {
                                for entry in entries.flatten() {
                                    let p = entry.path();
                                    if is_markdown_file(&p) {
                                        initial.push(p.to_string_lossy().into_owned());
                                    }
                                }
                            }
                        }
                    }
                }
            }
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, event| {
            if let RunEvent::Opened { urls } = event {
                for url in urls {
                    if url.scheme() == "file" {
                        if let Ok(path) = url.to_file_path() {
                            if path.is_file() && is_markdown_file(&path) {
                                let _ = app.emit("open-file", path.to_string_lossy().into_owned());
                            }
                        }
                    }
                }
            }
        });
}
