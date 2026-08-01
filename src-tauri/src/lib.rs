use notify::{Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use serde::Serialize;
use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem, Submenu};
use tauri::{Emitter, Manager};
// `RunEvent::Opened` is the macOS `application:openURLs:` bridge; the variant
// does not exist in the enum on other platforms.
#[cfg(target_os = "macos")]
use tauri::RunEvent;

const ALLOWED_EXTENSIONS: &[&str] = &["md", "markdown"];

#[cfg(target_os = "macos")]
mod default_viewer {
    use core_foundation::base::TCFType;
    use core_foundation::string::{CFString, CFStringRef};

    const MARKDOWN_UTI: &str = "net.daringfireball.markdown";
    const BUNDLE_ID: &str = "com.tlj.peep";
    const LS_ROLES_ALL: u32 = 0xFFFF_FFFF;

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

fn is_markdown_file(path: &Path) -> bool {
    path.extension()
        .and_then(|e| e.to_str())
        .is_some_and(|e| ALLOWED_EXTENSIONS.contains(&e))
}

/// Resolve CLI arguments to canonical markdown file paths.
/// Accepts file paths (kept if markdown) and directory paths (all markdown files inside).
/// Relative paths are resolved against `cwd`.
fn resolve_markdown_paths(args: &[String], cwd: &str) -> Vec<String> {
    let mut paths = Vec::new();
    for arg in args {
        let path = if PathBuf::from(arg).is_absolute() {
            PathBuf::from(arg)
        } else {
            PathBuf::from(cwd).join(arg)
        };
        if let Ok(canonical) = fs::canonicalize(&path) {
            if canonical.is_file() && is_markdown_file(&canonical) {
                paths.push(canonical.to_string_lossy().into_owned());
            } else if canonical.is_dir() {
                if let Ok(entries) = fs::read_dir(&canonical) {
                    for entry in entries.flatten() {
                        let p = entry.path();
                        if is_markdown_file(&p) {
                            paths.push(p.to_string_lossy().into_owned());
                        }
                    }
                }
            }
        }
    }
    paths
}

struct AppState {
    watched_files: Mutex<HashSet<PathBuf>>,
    watcher: Mutex<Option<RecommendedWatcher>>,
    initial_files: Mutex<Vec<String>>,
}

#[derive(Clone, Debug, Serialize)]
struct FileContent {
    path: String,
    content: String,
    filename: String,
}

#[tauri::command]
fn read_file(path: &str) -> Result<FileContent, String> {
    let canonical =
        fs::canonicalize(PathBuf::from(path)).map_err(|e| format!("Cannot resolve path: {e}"))?;

    if !is_markdown_file(&canonical) {
        return Err("Only .md and .markdown files are supported".into());
    }

    let content = fs::read_to_string(&canonical).map_err(|e| format!("Cannot read file: {e}"))?;
    let filename = canonical
        .file_name()
        .map_or_else(|| path.to_owned(), |n| n.to_string_lossy().into_owned());

    Ok(FileContent {
        path: canonical.to_string_lossy().into_owned(),
        content,
        filename,
    })
}

#[tauri::command]
// Tauri injects `AppHandle` by value; there is no `CommandArg` impl for `&AppHandle`.
#[allow(clippy::needless_pass_by_value)]
fn watch_file(path: &str, app: tauri::AppHandle) -> Result<(), String> {
    let state = app.state::<AppState>();
    let path_buf =
        fs::canonicalize(PathBuf::from(path)).map_err(|e| format!("Cannot resolve path: {e}"))?;

    if !is_markdown_file(&path_buf) {
        return Err("Only .md and .markdown files are supported".into());
    }

    let mut tracked_files = state
        .watched_files
        .lock()
        .map_err(|e| format!("State lock poisoned: {e}"))?;
    if tracked_files.contains(&path_buf) {
        return Ok(());
    }
    tracked_files.insert(path_buf.clone());
    drop(tracked_files);

    let handle = app.clone();

    let mut watcher_guard = state
        .watcher
        .lock()
        .map_err(|e| format!("Watcher lock poisoned: {e}"))?;
    if watcher_guard.is_none() {
        let watcher = notify::recommended_watcher(move |res: Result<Event, notify::Error>| {
            if let Ok(event) = res {
                if matches!(event.kind, EventKind::Modify(_) | EventKind::Create(_)) {
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

    let result = watcher_guard.as_mut().map_or(Ok(()), |watcher| {
        watcher
            .watch(&path_buf, RecursiveMode::NonRecursive)
            .map_err(|e| format!("Cannot watch file: {e}"))
    });
    drop(watcher_guard);

    result
}

#[tauri::command]
// Tauri injects `AppHandle` by value; there is no `CommandArg` impl for `&AppHandle`.
#[allow(clippy::needless_pass_by_value)]
fn unwatch_file(path: &str, app: tauri::AppHandle) -> Result<(), String> {
    let state = app.state::<AppState>();
    let path_buf =
        fs::canonicalize(PathBuf::from(path)).map_err(|e| format!("Cannot resolve path: {e}"))?;

    let mut tracked_files = state
        .watched_files
        .lock()
        .map_err(|e| format!("State lock poisoned: {e}"))?;
    tracked_files.remove(&path_buf);
    drop(tracked_files);

    let mut watcher_guard = state
        .watcher
        .lock()
        .map_err(|e| format!("Watcher lock poisoned: {e}"))?;
    if let Some(watcher) = watcher_guard.as_mut() {
        let _ = watcher.unwatch(&path_buf);
    }
    drop(watcher_guard);

    Ok(())
}

#[tauri::command]
// Off-macOS the body is just `false`, which clippy::nursery flags as
// const-able. It cannot be: the macOS arm performs CoreServices FFI, and
// `#[tauri::command]` generates a non-const wrapper around it either way.
#[cfg_attr(not(target_os = "macos"), allow(clippy::missing_const_for_fn))]
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
// Tauri injects `AppHandle` by value; there is no `CommandArg` impl for `&AppHandle`.
#[allow(clippy::needless_pass_by_value)]
fn get_initial_files(app: tauri::AppHandle) -> Vec<String> {
    let state = app.state::<AppState>();
    let mut guard = state
        .initial_files
        .lock()
        .unwrap_or_else(std::sync::PoisonError::into_inner);
    guard.drain(..).collect()
}

/// Build the native application menu (App, Edit, View submenus).
fn build_menu(handle: &tauri::AppHandle) -> tauri::Result<Menu<tauri::Wry>> {
    // No accelerator: there is no standard shortcut for this. The explicit
    // `None::<&str>` is required because the other items pass `Some(..)`, so
    // the generic parameter cannot be inferred here.
    let check_updates = MenuItem::with_id(
        handle,
        "check_updates",
        "Check for Updates…",
        true,
        None::<&str>,
    )?;

    let app_menu = Submenu::with_items(
        handle,
        "peep",
        true,
        &[
            &PredefinedMenuItem::about(handle, None, None)?,
            &PredefinedMenuItem::separator(handle)?,
            &check_updates,
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

    let zoom_in = MenuItem::with_id(handle, "zoom_in", "Zoom In", true, Some("CmdOrCtrl+="))?;
    let zoom_out = MenuItem::with_id(handle, "zoom_out", "Zoom Out", true, Some("CmdOrCtrl+-"))?;
    let zoom_reset = MenuItem::with_id(
        handle,
        "zoom_reset",
        "Actual Size",
        true,
        Some("CmdOrCtrl+0"),
    )?;

    let view_menu = Submenu::with_items(handle, "View", true, &[&zoom_in, &zoom_out, &zoom_reset])?;

    Menu::with_items(handle, &[&app_menu, &edit_menu, &view_menu])
}

/// Start the Tauri application event loop.
///
/// # Panics
///
/// Panics if the Tauri application fails to build, which indicates a
/// malformed bundle configuration or context and is unrecoverable.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_single_instance::init(|app, args, cwd| {
            // args[0] is the binary path; real file args start at [1]
            let file_args: Vec<String> = args.iter().skip(1).cloned().collect();
            for path in resolve_markdown_paths(&file_args, &cwd) {
                let _ = app.emit("open-file", path);
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

            app.set_menu(build_menu(handle)?)?;

            app.on_menu_event(|app, event| {
                let id = event.id();
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
                    // The update state machine lives in the frontend; this
                    // just forwards the user's intent to it.
                    "check_updates" => {
                        let _ = app.emit("check-updates", ());
                    }
                    _ => {}
                }
            });

            let args: Vec<String> = std::env::args().skip(1).collect();
            if !args.is_empty() {
                let cwd = std::env::current_dir()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .into_owned();
                let state = app.state::<AppState>();
                let mut initial = state
                    .initial_files
                    .lock()
                    .unwrap_or_else(std::sync::PoisonError::into_inner);
                initial.extend(resolve_markdown_paths(&args, &cwd));
            }
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, event| {
            // Finder "Open With" and drag-onto-dock arrive as `Opened` rather
            // than CLI args. The variant only exists in the enum on macOS;
            // elsewhere those paths arrive via the single-instance plugin, so
            // both bindings go unused off-macOS.
            #[cfg(not(target_os = "macos"))]
            let (_, _) = (app, event);

            #[cfg(target_os = "macos")]
            if let RunEvent::Opened { urls } = event {
                for url in urls {
                    if url.scheme() == "file" {
                        if let Ok(path) = url.to_file_path() {
                            if path.is_file() && is_markdown_file(&path) {
                                let _ = app.emit_to(
                                    "main",
                                    "open-file",
                                    path.to_string_lossy().into_owned(),
                                );
                            }
                        }
                    }
                }
            }
        });
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;

    #[test]
    fn is_markdown_file_accepts_md() {
        assert!(is_markdown_file(&PathBuf::from("readme.md")));
    }

    #[test]
    fn is_markdown_file_accepts_markdown() {
        assert!(is_markdown_file(&PathBuf::from("notes.markdown")));
    }

    #[test]
    fn is_markdown_file_rejects_txt() {
        assert!(!is_markdown_file(&PathBuf::from("readme.txt")));
    }

    #[test]
    fn is_markdown_file_rejects_no_extension() {
        assert!(!is_markdown_file(&PathBuf::from("README")));
    }

    #[test]
    fn is_markdown_file_rejects_similar_extensions() {
        assert!(!is_markdown_file(&PathBuf::from("file.mdx")));
        assert!(!is_markdown_file(&PathBuf::from("file.mdown")));
    }

    #[test]
    fn is_markdown_file_handles_nested_paths() {
        assert!(is_markdown_file(&PathBuf::from("/home/user/docs/notes.md")));
        assert!(!is_markdown_file(&PathBuf::from(
            "/home/user/docs/notes.rs"
        )));
    }

    #[test]
    fn is_markdown_file_handles_dots_in_filename() {
        assert!(is_markdown_file(&PathBuf::from("my.notes.v2.md")));
    }

    #[test]
    fn read_file_succeeds_for_md_file() {
        let dir = std::env::temp_dir().join("peep_test_read");
        let _ = fs::create_dir_all(&dir);
        let file_path = dir.join("test.md");
        let mut f = fs::File::create(&file_path).unwrap();
        f.write_all(b"# Hello\nWorld").unwrap();

        let result = read_file(&file_path.to_string_lossy());
        assert!(result.is_ok());
        let fc = result.unwrap();
        assert_eq!(fc.content, "# Hello\nWorld");
        assert_eq!(fc.filename, "test.md");
        assert!(!fc.path.is_empty());

        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn read_file_rejects_non_markdown() {
        let dir = std::env::temp_dir().join("peep_test_reject");
        let _ = fs::create_dir_all(&dir);
        let file_path = dir.join("test.txt");
        let mut f = fs::File::create(&file_path).unwrap();
        f.write_all(b"hello").unwrap();

        let result = read_file(&file_path.to_string_lossy());
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Only .md and .markdown"));

        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn read_file_errors_for_nonexistent() {
        let result = read_file("/tmp/nonexistent_peep_test_file.md");
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Cannot resolve path"));
    }

    #[test]
    fn read_file_returns_canonical_path() {
        let dir = std::env::temp_dir().join("peep_test_canonical");
        let _ = fs::create_dir_all(&dir);
        let file_path = dir.join("canon.md");
        let mut f = fs::File::create(&file_path).unwrap();
        f.write_all(b"test").unwrap();

        let result = read_file(&file_path.to_string_lossy()).unwrap();
        // Canonical path should be absolute
        assert!(PathBuf::from(&result.path).is_absolute());

        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn file_content_serializes_to_json() {
        let fc = FileContent {
            path: "/test.md".into(),
            content: "# Hello".into(),
            filename: "test.md".into(),
        };
        let json = serde_json::to_string(&fc).unwrap();
        assert!(json.contains("\"path\":\"/test.md\""));
        assert!(json.contains("\"content\":\"# Hello\""));
        assert!(json.contains("\"filename\":\"test.md\""));
    }

    #[test]
    fn allowed_extensions_contains_expected_values() {
        assert_eq!(ALLOWED_EXTENSIONS, &["md", "markdown"]);
    }
}
