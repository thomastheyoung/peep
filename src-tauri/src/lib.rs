use notify::{Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use serde::Serialize;
use std::collections::HashSet;
use std::fs;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem, Submenu};
use tauri::{Emitter, Manager};
// `RunEvent::Opened` is the macOS `application:openURLs:` bridge; the variant
// does not exist in the enum on other platforms.
#[cfg(target_os = "macos")]
use tauri::RunEvent;

const ALLOWED_EXTENSIONS: &[&str] = &["md", "markdown"];

// Preferences file name and its atomic-write sibling. The `.tmp` name is
// fixed (not per-write-unique) because `AppState::prefs_lock` already
// serializes writers, so there is never a collision to worry about.
const PREFERENCES_FILE: &str = "preferences.json";
const PREFERENCES_TMP: &str = "preferences.json.tmp";
// Generous ceiling for a small JSON blob of user settings; guards against
// a corrupted or maliciously huge file wedging the read path.
const MAX_PREFS_BYTES: u64 = 64 * 1024;

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
    // Guards preference writes so the fixed `.tmp` sibling name never collides
    // with itself under concurrent saves.
    prefs_lock: Mutex<()>,
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

/// Atomically replace `target_name` (inside `dir`) with `bytes` via a sibling
/// tmp file + rename. Caller must hold `AppState::prefs_lock` — the tmp
/// filename is fixed, so concurrent callers would stomp on each other.
fn write_atomic(
    dir: &Path,
    tmp_name: &str,
    target_name: &str,
    bytes: &[u8],
) -> std::io::Result<()> {
    fs::create_dir_all(dir)?;

    let tmp = dir.join(tmp_name);
    let target = dir.join(target_name);

    {
        // Scoped so the handle is dropped (and the fd closed) before the
        // rename below — Windows refuses to rename a file that is still open.
        let mut file = fs::File::create(&tmp)?;
        file.write_all(bytes)?;
        // Forces the data blocks to disk before we rename. Without this, the
        // rename's metadata can journal ahead of the data on ext4/APFS, so a
        // crash right after the rename can leave a zero-length target.
        file.sync_all()?;
    }

    if let Err(e) = fs::rename(&tmp, &target) {
        // Best-effort: don't let a failed cleanup mask the original error,
        // and leave the previous `target` untouched either way.
        let _ = fs::remove_file(&tmp);
        return Err(e);
    }

    // Deliberately not fsyncing the directory entry. Worst case after power
    // loss is that the rename itself is lost and `target` is left as its
    // previous complete version — never a torn write — which isn't worth an
    // extra syscall pair on a path that fires on every slider tick.
    Ok(())
}

/// Read the raw preferences JSON from disk. `Ok(None)` means "no file yet"
/// (the frontend then runs its localStorage migration); a read/decode
/// failure is also folded into `Ok(None)` since the next save just rewrites
/// the file. Only genuine I/O errors reach the caller as `Err`.
///
/// The backend does not model or validate the preference schema — this is
/// deliberate. `parseStoredPreferences` on the frontend is the single source
/// of truth for what a valid preferences blob looks like.
fn load_preferences_from(config_dir: &Path) -> Result<Option<String>, String> {
    let path = config_dir.join(PREFERENCES_FILE);
    let file = match fs::File::open(&path) {
        Ok(f) => f,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(None),
        Err(e) => return Err(format!("Cannot read preferences: {e}")),
    };

    // Reject an oversized file outright rather than reading a prefix of it.
    // `take()` truncates silently, which would hand the frontend a partial JSON
    // document that looks complete — better to report "no usable file" and let
    // the next save replace it.
    match file.metadata() {
        Ok(meta) if meta.len() > MAX_PREFS_BYTES => return Ok(None),
        Ok(_) => {}
        Err(e) => return Err(format!("Cannot read preferences: {e}")),
    }

    let mut buf = String::new();
    // Still bounded: the file could grow between the metadata check and the
    // read, and a fifo/device file reports len 0 while reading forever.
    match file.take(MAX_PREFS_BYTES).read_to_string(&mut buf) {
        Ok(_) => Ok(Some(buf)),
        // Includes non-UTF-8 content; treat it the same as "absent" and let
        // the next save repair it.
        Err(_) => Ok(None),
    }
}

/// Persist the raw preferences JSON to disk, replacing any existing file.
fn save_preferences_to(config_dir: &Path, json: &str) -> Result<(), String> {
    write_atomic(
        config_dir,
        PREFERENCES_TMP,
        PREFERENCES_FILE,
        json.as_bytes(),
    )
    .map_err(|e| format!("Cannot write preferences: {e}"))
}

/// `Ok(None)` means the preferences file does not exist yet (the frontend
/// falls back to its localStorage migration); `Err` means a real I/O
/// failure, distinct from "nothing saved yet".
#[tauri::command]
// Tauri injects `AppHandle` by value; there is no `CommandArg` impl for `&AppHandle`.
#[allow(clippy::needless_pass_by_value)]
fn get_preferences(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let config_dir = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("Cannot resolve config dir: {e}"))?;
    load_preferences_from(&config_dir)
}

#[tauri::command]
// Tauri injects `AppHandle` by value; there is no `CommandArg` impl for `&AppHandle`.
#[allow(clippy::needless_pass_by_value)]
fn set_preferences(json: String, app: tauri::AppHandle) -> Result<(), String> {
    // Symmetric with the read cap: without this the app could write a file it
    // then refuses to read back. The real payload is a couple hundred bytes.
    if json.len() as u64 > MAX_PREFS_BYTES {
        return Err("Preferences payload too large".into());
    }

    let config_dir = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("Cannot resolve config dir: {e}"))?;

    let state = app.state::<AppState>();
    // Recover rather than propagate: this mutex guards `()` — the fixed tmp
    // filename, not any invariant — so a poisoned lock has nothing to protect,
    // and propagating would brick saving for the rest of the session. Matches
    // `get_initial_files`, which recovers for the same reason.
    let _guard = state
        .prefs_lock
        .lock()
        .unwrap_or_else(std::sync::PoisonError::into_inner);
    save_preferences_to(&config_dir, &json)
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
            prefs_lock: Mutex::new(()),
        })
        .invoke_handler(tauri::generate_handler![
            read_file,
            watch_file,
            unwatch_file,
            get_initial_files,
            is_default_markdown_viewer,
            set_default_markdown_viewer,
            get_preferences,
            set_preferences
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

    #[test]
    fn preferences_round_trip_through_disk() {
        let dir = std::env::temp_dir().join("peep_test_prefs_roundtrip");
        let _ = fs::create_dir_all(&dir);

        let json = r#"{"theme":"dracula","zoom":1.2}"#;
        save_preferences_to(&dir, json).unwrap();
        let loaded = load_preferences_from(&dir).unwrap();
        assert_eq!(loaded.as_deref(), Some(json));

        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn preferences_missing_file_yields_ok_none() {
        let dir = std::env::temp_dir().join("peep_test_prefs_missing");
        let _ = fs::create_dir_all(&dir);

        let loaded = load_preferences_from(&dir).unwrap();
        assert!(loaded.is_none());

        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn write_atomic_replaces_existing_file_and_leaves_no_tmp() {
        let dir = std::env::temp_dir().join("peep_test_prefs_replace");
        let _ = fs::create_dir_all(&dir);

        write_atomic(&dir, PREFERENCES_TMP, PREFERENCES_FILE, b"first").unwrap();
        write_atomic(&dir, PREFERENCES_TMP, PREFERENCES_FILE, b"second").unwrap();

        let contents = fs::read_to_string(dir.join(PREFERENCES_FILE)).unwrap();
        assert_eq!(contents, "second");
        assert!(!dir.join(PREFERENCES_TMP).exists());

        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn write_atomic_creates_missing_parent_dir() {
        let dir = std::env::temp_dir()
            .join("peep_test_prefs_mkdir")
            .join("nested");
        // Deliberately not creating `dir` up front — this is what's under test.
        let _ = fs::remove_dir_all(&dir);

        write_atomic(&dir, PREFERENCES_TMP, PREFERENCES_FILE, b"content").unwrap();
        let contents = fs::read_to_string(dir.join(PREFERENCES_FILE)).unwrap();
        assert_eq!(contents, "content");

        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn stale_tmp_file_is_overwritten_and_never_read() {
        let dir = std::env::temp_dir().join("peep_test_prefs_stale_tmp");
        let _ = fs::create_dir_all(&dir);

        // Simulate a crash mid-write: a leftover tmp file from a previous,
        // never-completed save.
        fs::write(dir.join(PREFERENCES_TMP), b"crashed-write-garbage").unwrap();

        write_atomic(&dir, PREFERENCES_TMP, PREFERENCES_FILE, b"good").unwrap();

        let loaded = load_preferences_from(&dir).unwrap();
        assert_eq!(loaded.as_deref(), Some("good"));
        assert!(!dir.join(PREFERENCES_TMP).exists());

        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn oversized_file_is_rejected_not_truncated() {
        let dir = std::env::temp_dir().join("peep_test_prefs_oversized");
        let _ = fs::create_dir_all(&dir);

        // One byte past the cap so a correct implementation cannot return the
        // full contents.
        let cap = usize::try_from(MAX_PREFS_BYTES).unwrap();
        let huge = "a".repeat(cap + 1);
        fs::write(dir.join(PREFERENCES_FILE), &huge).unwrap();

        // Must be None, not a truncated prefix: handing the frontend a partial
        // JSON document that parses as garbage is worse than reporting "no
        // usable file", which is a state it already handles.
        assert_eq!(load_preferences_from(&dir).unwrap(), None);

        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn file_exactly_at_the_cap_is_still_read() {
        let dir = std::env::temp_dir().join("peep_test_prefs_at_cap");
        let _ = fs::create_dir_all(&dir);

        // Guards against an off-by-one turning the cap into a stricter limit
        // than documented.
        let cap = usize::try_from(MAX_PREFS_BYTES).unwrap();
        fs::write(dir.join(PREFERENCES_FILE), "a".repeat(cap)).unwrap();

        let loaded = load_preferences_from(&dir).unwrap();
        assert_eq!(loaded.map(|s| s.len()), Some(cap));

        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn invalid_utf8_file_yields_ok_none() {
        let dir = std::env::temp_dir().join("peep_test_prefs_invalid_utf8");
        let _ = fs::create_dir_all(&dir);

        fs::write(dir.join(PREFERENCES_FILE), [0xFF, 0xFE, 0xFD]).unwrap();

        let loaded = load_preferences_from(&dir).unwrap();
        assert!(loaded.is_none());

        let _ = fs::remove_dir_all(&dir);
    }
}
