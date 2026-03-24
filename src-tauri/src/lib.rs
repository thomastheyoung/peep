use notify::{Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use serde::Serialize;
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{Emitter, Manager};

struct AppState {
    watched_files: Mutex<Vec<PathBuf>>,
    _watcher: Mutex<Option<RecommendedWatcher>>,
}

#[derive(Clone, Serialize)]
struct FileContent {
    path: String,
    content: String,
    filename: String,
}

#[tauri::command]
fn read_file(path: String) -> Result<FileContent, String> {
    let path_buf = PathBuf::from(&path);
    let canonical = fs::canonicalize(&path_buf).map_err(|e| format!("Cannot resolve path: {e}"))?;
    let content = fs::read_to_string(&canonical).map_err(|e| format!("Cannot read file: {e}"))?;
    let filename = canonical
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| path.clone());

    Ok(FileContent {
        path: canonical.to_string_lossy().to_string(),
        content,
        filename,
    })
}

#[tauri::command]
fn watch_file(path: String, app: tauri::AppHandle) -> Result<(), String> {
    let state = app.state::<AppState>();
    let path_buf =
        fs::canonicalize(PathBuf::from(&path)).map_err(|e| format!("Cannot resolve path: {e}"))?;

    let mut watched = state.watched_files.lock().unwrap();
    if watched.contains(&path_buf) {
        return Ok(());
    }
    watched.push(path_buf.clone());
    drop(watched);

    let app_handle = app.clone();
    let watch_path = path_buf.clone();

    let mut watcher_guard = state._watcher.lock().unwrap();
    if watcher_guard.is_none() {
        let handle = app_handle.clone();
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
                                .map(|n| n.to_string_lossy().to_string())
                                .unwrap_or_default();
                            let _ = handle.emit(
                                "file-changed",
                                FileContent {
                                    path: path.to_string_lossy().to_string(),
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState {
            watched_files: Mutex::new(Vec::new()),
            _watcher: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![read_file, watch_file])
        .setup(|app| {
            // Pass CLI args to the frontend via a managed state or event
            let args: Vec<String> = std::env::args().skip(1).collect();
            if !args.is_empty() {
                let handle = app.handle().clone();
                // Give the frontend time to mount before sending files
                std::thread::spawn(move || {
                    std::thread::sleep(std::time::Duration::from_millis(500));
                    for arg in &args {
                        let path = if PathBuf::from(arg).is_absolute() {
                            PathBuf::from(arg)
                        } else {
                            std::env::current_dir()
                                .unwrap_or_default()
                                .join(arg)
                        };
                        if let Ok(canonical) = fs::canonicalize(&path) {
                            if canonical.is_file() {
                                let _ = handle.emit("open-file", canonical.to_string_lossy().to_string());
                            } else if canonical.is_dir() {
                                // Find all .md files in directory
                                if let Ok(entries) = fs::read_dir(&canonical) {
                                    for entry in entries.flatten() {
                                        let p = entry.path();
                                        if p.extension().map(|e| e == "md" || e == "markdown").unwrap_or(false) {
                                            let _ = handle.emit("open-file", p.to_string_lossy().to_string());
                                        }
                                    }
                                }
                            }
                        }
                    }
                });
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
