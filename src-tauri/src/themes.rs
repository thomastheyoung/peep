//! User theme storage: import, list, delete, and live-watch CSS files the
//! user has imported into `<config_dir>/themes/`.
//!
//! Mirrors the preferences module's dir-parameterized free-function shape
//! (`scan_themes` / `import_theme_to` / `delete_theme_from`) so every
//! filesystem test is hermetic and needs no `AppHandle`.

use notify::{Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use serde::Serialize;
use std::ffi::OsStr;
use std::fs;
use std::io::Read as _;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::time::UNIX_EPOCH;
use tauri::{Emitter, Manager};

/// Ceiling on a single imported theme's CSS. Realistic themes in this repo
/// run 2-15KB; this leaves headroom while still bounding a malicious or
/// corrupted file.
const MAX_THEME_BYTES: u64 = 256 * 1024;
/// Ceiling on how many themes a scan will return. Which 100 files survive a
/// pathological directory with more than this is filesystem-order-arbitrary
/// — `read_dir` makes no ordering guarantee (the sort happens after the cap),
/// so this is a safety valve, not a curation policy.
///
/// Read this constant together with `MAX_THEME_BYTES`: it is their PRODUCT
/// that bounds memory, and 100 x 256KB is 25MB resident, roughly doubled
/// again by JSON serialization across the IPC bridge and a third copy on the
/// frontend. Survivable, and unreachable for a realistic user (<20 themes at
/// 2-15KB), but raise either constant with that multiplication in view.
const MAX_THEME_COUNT: usize = 100;
/// Matches `validate_theme_id`'s length check; kept as a named constant so
/// the two sides of the contract (the check and anyone constructing an id)
/// read from the same source.
const MAX_THEME_ID_LEN: usize = 64;

const THEMES_DIR_NAME: &str = "themes";
const THEME_EXTENSION: &str = "css";

// Windows reserved device names, rejected on ALL platforms (not just
// Windows). The theme id is the frontend's registry key, and a config dir
// synced to a Windows machine (iCloud/Dropbox over `~/Library/Application
// Support` is common) must yield a platform-independent id set. `con.css` is
// also reserved on Windows — Win32 strips the extension when matching
// device names — and checking the bare id covers that case too, since ids
// never contain `.`.
const RESERVED_WINDOWS_NAMES: &[&str] = &[
    "con", "prn", "aux", "nul", "com1", "com2", "com3", "com4", "com5", "com6", "com7", "com8",
    "com9", "lpt1", "lpt2", "lpt3", "lpt4", "lpt5", "lpt6", "lpt7", "lpt8", "lpt9",
];

// `themes` is a private module (not `pub mod` in lib.rs), so `pub` here is
// exactly as visible as `pub(crate)` would be — clippy's
// `redundant_pub_crate` flags the redundancy. Crate-internal intent is still
// documented on each item's doc comment.
pub struct ThemesState {
    // Guards theme writes. NOT `AppState::prefs_lock` — that guards a
    // different invariant (preferences' single fixed tmp filename), and
    // sharing it would serialize theme imports behind slider-drag
    // preference writes for no reason. Recover on poison: this mutex
    // protects nothing but a per-id tmp filename from colliding with
    // itself, so there is nothing to lose by recovering, matching
    // `AppState::prefs_lock`'s reasoning in lib.rs.
    pub(crate) lock: Mutex<()>,
    // A second, independent watcher from `AppState::watcher`. Poisoning:
    // PROPAGATE, matching the existing `watcher` field — unlike the locks
    // above, a poisoned watcher slot means a watch thread panicked mid
    // mutation, which is worth surfacing rather than silently continuing
    // with unknown watcher state.
    pub(crate) watcher: Mutex<Option<RecommendedWatcher>>,
}

impl ThemesState {
    pub const fn new() -> Self {
        Self {
            lock: Mutex::new(()),
            watcher: Mutex::new(None),
        }
    }
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
pub struct UserThemeFile {
    id: String,
    path: String,
    revision: u64,
    css: String,
}

/// Byte-level allowlist: every byte must be `a-z`, `0-9`, or `-`.
///
/// Byte-level, not char-level, so there is no encoding subtlety to reason
/// about. This single check kills `..`, `.`, `/`, `\`, NUL, whitespace, ALL
/// non-ASCII (so NFC/NFD divergence on APFS is moot — there is nothing to
/// normalize in pure ASCII), Windows trailing-dot/space stripping, NTFS ADS
/// (`:`), and short-name `~1` forms, on top of the length and
/// reserved-name checks below.
///
/// Pure and filesystem-free by design: every caller composes this with a
/// canonicalized root directory before touching disk, so the containment
/// guarantee holds regardless of what this function is fed.
fn validate_theme_id(id: &str) -> Result<(), String> {
    if id.is_empty() {
        return Err("Theme id must not be empty".into());
    }
    if id.len() > MAX_THEME_ID_LEN {
        return Err(format!(
            "Theme id must be at most {MAX_THEME_ID_LEN} characters"
        ));
    }
    if !id
        .bytes()
        .all(|b| b.is_ascii_lowercase() || b.is_ascii_digit() || b == b'-')
    {
        return Err("Theme id may only contain lowercase letters, digits, and hyphens".into());
    }
    if RESERVED_WINDOWS_NAMES.contains(&id) {
        return Err(format!("\"{id}\" is a reserved device name"));
    }
    Ok(())
}

/// Resolve (and create) `<config_dir>/themes`, canonicalized.
///
/// Canonicalizing the ROOT here — and joining a validated leaf everywhere
/// else — is what makes containment true BY CONSTRUCTION and what makes
/// `starts_with` work on Windows. If the LEAF were canonicalized instead and
/// compared against a non-canonical root, the `\\?\` UNC prefix Windows adds
/// during canonicalization would mismatch the root's un-prefixed form and
/// `starts_with` would be ALWAYS FALSE — silently rejecting every legitimate
/// theme. Do not "simplify" this by canonicalizing per-call instead.
fn themes_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("Cannot resolve config dir: {e}"))?
        .join(THEMES_DIR_NAME);
    fs::create_dir_all(&dir).map_err(|e| format!("Cannot create themes dir: {e}"))?;
    fs::canonicalize(&dir).map_err(|e| format!("Cannot resolve themes dir: {e}"))
}

/// Byte length as `u64`, without an `as` cast (`clippy::cast_possible_truncation`).
fn byte_len_u64(bytes: &[u8]) -> u64 {
    u64::try_from(bytes.len()).unwrap_or(u64::MAX)
}

/// mtime as integer milliseconds since the Unix epoch. `SystemTime` is not
/// serialized directly — serde's default shape
/// (`{secs_since_epoch, nanos_since_epoch}`) is useless to the frontend,
/// which wants a single comparable/JSON-native number to use as a
/// preview-cache-bust key.
///
/// If `metadata.modified()` errors (not supported on some filesystems), this
/// returns 0. Documented limitation: on such filesystems the preview cache
/// cannot invalidate within a session, since every file reports the same
/// revision.
fn revision_millis(metadata: &fs::Metadata) -> u64 {
    metadata.modified().map_or(0, |modified| {
        modified
            .duration_since(UNIX_EPOCH)
            .map_or(0, |d| u64::try_from(d.as_millis()).unwrap_or(u64::MAX))
    })
}

/// Read one theme file into a `UserThemeFile`, applying the same size guard
/// as the scan's metadata check, but re-checked at read time. Returns `Ok(None)`
/// for any file that should be silently skipped (wrong shape, too big, not
/// UTF-8) so the caller's scan stays total.
fn read_theme_file(path: &Path, id: &str) -> Option<UserThemeFile> {
    let file = fs::File::open(path).ok()?;
    let metadata = file.metadata().ok()?;
    if metadata.len() > MAX_THEME_BYTES {
        return None;
    }
    let revision = revision_millis(&metadata);

    let mut buf = String::new();
    // Bounded even after the metadata check above: the file can grow
    // between the check and this read, and a fifo/device file reports len 0
    // while reading forever. Mirrors `load_preferences_from` in lib.rs.
    file.take(MAX_THEME_BYTES)
        .read_to_string(&mut buf)
        .ok()?;

    Some(UserThemeFile {
        id: id.to_owned(),
        path: path.to_string_lossy().into_owned(),
        revision,
        css: buf,
    })
}

/// Scan `dir` for valid user theme files. Total and silent: one bad entry
/// (wrong type, wrong extension, invalid id, oversized, non-UTF-8) is
/// skipped rather than failing the whole scan, mirroring
/// `load_preferences_from`'s fold-to-`Ok(None)` philosophy for a single
/// file. A missing directory is not an error — it just yields no themes yet.
///
/// Skip order is load-bearing:
/// 1. `file_type()` first — kills directories named `foo.css`, fifos,
///    devices, and symlinks BEFORE any open. Opening a fifo blocks forever.
/// 2. Exact `css` extension, case-sensitive, matching `is_markdown_file`'s
///    shape in lib.rs. This also excludes `.css.tmp` for free, since its
///    extension is `tmp`, not `css`.
/// 3. `validate_theme_id` on the file stem.
/// 4. Size (metadata, then a bounded read as a second guard — see
///    `read_theme_file`).
/// 5. UTF-8 (folded into the same read).
///
/// Results are sorted by id: `read_dir` order is nondeterministic and the
/// frontend should not have to re-sort. Which `MAX_THEME_COUNT` files
/// survive beyond the cap is therefore filesystem-order-arbitrary — sorting
/// happens after the cap is applied to the scan order, not before.
fn scan_themes(dir: &Path) -> Result<Vec<UserThemeFile>, String> {
    let entries = match fs::read_dir(dir) {
        Ok(entries) => entries,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(Vec::new()),
        Err(e) => return Err(format!("Cannot read themes dir: {e}")),
    };

    let mut themes = Vec::new();
    for entry in entries.flatten() {
        if themes.len() >= MAX_THEME_COUNT {
            break;
        }

        // `file_type()` on the `DirEntry` does not follow symlinks (it
        // reports `is_symlink()` for one), so a symlink is skipped here
        // before any open is attempted.
        let Ok(file_type) = entry.file_type() else {
            continue;
        };
        if !file_type.is_file() {
            continue;
        }

        let path = entry.path();
        if path.extension() != Some(OsStr::new(THEME_EXTENSION)) {
            continue;
        }
        let Some(id) = path.file_stem().and_then(OsStr::to_str) else {
            continue;
        };
        if validate_theme_id(id).is_err() {
            continue;
        }

        if let Some(theme) = read_theme_file(&path, id) {
            themes.push(theme);
        }
    }

    themes.sort_by(|a, b| a.id.cmp(&b.id));
    Ok(themes)
}

/// Write `css` as `<dir>/<id>.css`, creating `dir` if needed. Rejects an
/// invalid id or oversized payload before touching the filesystem, mirroring
/// `set_preferences` in lib.rs. The tmp sibling name is per-id
/// (`<id>.css.tmp`), so concurrent imports of different ids never collide —
/// only same-id races need the caller's lock.
fn import_theme_to(dir: &Path, id: &str, css: &str) -> Result<UserThemeFile, String> {
    validate_theme_id(id)?;

    let bytes = css.as_bytes();
    if byte_len_u64(bytes) > MAX_THEME_BYTES {
        return Err("Theme CSS payload too large".into());
    }

    let target_name = format!("{id}.{THEME_EXTENSION}");
    let tmp_name = format!("{target_name}.tmp");
    crate::write_atomic(dir, &tmp_name, &target_name, bytes)
        .map_err(|e| format!("Cannot write theme: {e}"))?;

    let path = dir.join(&target_name);
    read_theme_file(&path, id).ok_or_else(|| "Theme written but could not be read back".into())
}

/// Delete `<dir>/<id>.css`. No lock is needed here — unlike the write path's
/// create-tmp-then-rename, `remove_file` is a single atomic syscall with
/// nothing for concurrent callers to race on.
///
/// The interesting race is not delete-vs-delete but delete-vs-import of the
/// SAME id, and it is safe in both interleavings because this path never
/// touches the `.tmp` sibling: a `remove_file` landing before the rename
/// leaves import to recreate the target (import wins), and one landing after
/// it removes a fully-written file (delete wins). Neither order corrupts
/// state or strands a tmp file.
///
/// On the must-exist path, `fs::symlink_metadata` (lstat, non-following)
/// rejects symlinks BEFORE canonicalization. Order matters: a symlink
/// pointing back inside `dir` would otherwise pass the `starts_with` check
/// below while still being a symlink, e.g. `evil.css -> /etc/hosts` renamed
/// to look contained. Canonicalizing the resolved candidate and requiring
/// `starts_with(dir)` afterward is defence in depth on top of that.
///
/// Threat model note: an attacker able to plant a symlink inside the user's
/// own config dir already runs as the user and could write the theme file
/// directly or edit preferences.json — the containment check here exists
/// for confused-deputy and shared-machine cases, not that threat, so the
/// TOCTOU between `symlink_metadata` and `remove_file` is not exploitable in
/// this model and does not need an `O_NOFOLLOW` dance.
///
/// HARDLINKS are NOT detectable by any check here, and that is structural
/// rather than an oversight: a hardlink is a real directory entry for the
/// same inode, so `lstat` does not flag it, `file_type().is_file()` is true,
/// and its canonical path IS inside `dir` — `starts_with` passes. No
/// path-based check can see one; only `nlink > 1` can, which is
/// Unix-specific and would reject the hardlinks real config-sync tools
/// create. Measured and accepted, because both MUTATING paths are safe
/// regardless: `remove_file` drops one name and the target inode survives
/// with `nlink` decremented, and `write_atomic`'s rename replaces the
/// directory entry rather than writing through it (verified — a file
/// outside the dir stayed byte-identical across both). The residual
/// exposure is `scan_themes` reading a hardlinked file's contents to the
/// app's own frontend, which requires an attacker who already has read
/// access to that file. `hardlink_*` tests below pin the safe directions.
fn delete_theme_from(dir: &Path, id: &str) -> Result<(), String> {
    validate_theme_id(id)?;

    let candidate = dir.join(format!("{id}.{THEME_EXTENSION}"));

    let symlink_meta =
        fs::symlink_metadata(&candidate).map_err(|_| format!("Theme \"{id}\" not found"))?;
    if symlink_meta.file_type().is_symlink() {
        return Err(format!("Theme \"{id}\" not found"));
    }

    let canonical_candidate =
        fs::canonicalize(&candidate).map_err(|_| format!("Theme \"{id}\" not found"))?;
    if !canonical_candidate.starts_with(dir) {
        return Err(format!("Theme \"{id}\" not found"));
    }

    fs::remove_file(&canonical_candidate).map_err(|e| format!("Cannot delete theme: {e}"))
}

/// Pure predicate for which filesystem events should trigger a rescan.
/// `Remove` is REQUIRED — the existing markdown-file watcher in lib.rs omits
/// it, but without it here, deleting a theme produces no event and the
/// frontend never learns the file is gone. Extracted as a free function so
/// it is testable without spinning up a real watcher.
fn is_theme_event(kind: EventKind, paths: &[PathBuf]) -> bool {
    if !matches!(kind, EventKind::Create(_) | EventKind::Modify(_) | EventKind::Remove(_)) {
        return false;
    }
    paths
        .iter()
        .any(|p| p.extension() == Some(OsStr::new(THEME_EXTENSION)))
}

#[tauri::command]
// Tauri injects `AppHandle` by value; there is no `CommandArg` impl for `&AppHandle`.
#[allow(clippy::needless_pass_by_value)]
pub fn get_user_themes(app: tauri::AppHandle) -> Result<Vec<UserThemeFile>, String> {
    let dir = themes_dir(&app)?;
    scan_themes(&dir)
}

#[tauri::command]
// Tauri injects `AppHandle` by value; there is no `CommandArg` impl for `&AppHandle`.
#[allow(clippy::needless_pass_by_value)]
pub fn import_theme(id: &str, css: &str, app: tauri::AppHandle) -> Result<UserThemeFile, String> {
    let dir = themes_dir(&app)?;
    let state = app.state::<crate::AppState>();
    let guard = state
        .themes
        .lock
        .lock()
        .unwrap_or_else(std::sync::PoisonError::into_inner);
    let result = import_theme_to(&dir, id, css);
    drop(guard);
    result
}

#[tauri::command]
// Tauri injects `AppHandle` by value; there is no `CommandArg` impl for `&AppHandle`.
#[allow(clippy::needless_pass_by_value)]
pub fn delete_user_theme(id: &str, app: tauri::AppHandle) -> Result<(), String> {
    let dir = themes_dir(&app)?;
    delete_theme_from(&dir, id)
}

/// Arm the themes-directory watcher. Idempotent: a second call is a no-op if
/// a watcher is already installed.
///
/// This is a SECOND, independent watcher from the one in lib.rs, not a
/// reuse of it. The existing watcher's closure (lib.rs) has no path
/// filtering and hardcodes `read_to_string` + a `file-changed` emit —
/// sharing it would make a `.css` save emit `file-changed` with CSS as
/// content, which `files.ts` would hand straight to `renderMarkdown`. It is
/// also created lazily INSIDE `watch_file`, so if the user opens no markdown
/// file in a session, no watcher exists — theme watching would silently
/// never work if it piggybacked on that path.
///
/// Known limitation, not fixed here: on Linux, inotify watches are
/// inode-based, so deleting and recreating the themes directory loses the
/// watch silently until relaunch. macOS `FSEvents` is path-based and
/// generally survives a delete+recreate. No re-arm machinery is built for
/// this — it is a narrow enough edge case (the user would have to delete
/// the directory itself) that the added complexity is not worth it.
#[tauri::command]
// Tauri injects `AppHandle` by value; there is no `CommandArg` impl for `&AppHandle`.
#[allow(clippy::needless_pass_by_value)]
pub fn watch_user_themes(app: tauri::AppHandle) -> Result<(), String> {
    // Must create the directory before arming the watch — notify errors on a
    // missing path.
    let dir = themes_dir(&app)?;

    let state = app.state::<crate::AppState>();
    let mut watcher_guard = state
        .themes
        .watcher
        .lock()
        .map_err(|e| format!("Themes watcher lock poisoned: {e}"))?;
    if watcher_guard.is_some() {
        drop(watcher_guard);
        return Ok(());
    }

    let handle = app.clone();
    let mut watcher = notify::recommended_watcher(move |res: Result<Event, notify::Error>| {
        if let Ok(event) = res {
            if is_theme_event(event.kind, &event.paths) {
                // Bare signal, no payload: JS-side debouncing (the existing
                // 150ms precedent in src/lib/files.ts) means Rust would
                // otherwise have already paid for N full scans by the time
                // any one of them mattered — an editor's atomic save alone
                // produces 2-3 FSEvents, which would be 3 directory scans
                // and 3 IPC payloads carrying every theme's CSS for a single
                // save. Emitting a bare signal and letting the frontend
                // re-call `get_user_themes()` keeps the debounce in JS,
                // runs the scan exactly once per settled batch, and gives a
                // single discovery code path shared by launch and reload.
                let _ = handle.emit("user-themes-changed", ());
            }
        }
    })
    .map_err(|e| format!("Cannot create themes watcher: {e}"))?;

    watcher
        .watch(&dir, RecursiveMode::NonRecursive)
        .map_err(|e| format!("Cannot watch themes dir: {e}"))?;
    *watcher_guard = Some(watcher);
    drop(watcher_guard);

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    /// RAII guard for a per-test scratch directory. The existing
    /// `std::env::temp_dir().join("peep_test_*")` + `let _ =
    /// remove_dir_all(..)` pattern in lib.rs leaks on panic, since the
    /// cleanup line is never reached. `Drop` runs on unwind too, so this
    /// cleans up even when an assertion in the test body fails.
    struct TestDir(PathBuf);

    impl TestDir {
        fn new(name: &str) -> Self {
            let dir = std::env::temp_dir().join(name);
            let _ = fs::remove_dir_all(&dir);
            fs::create_dir_all(&dir).unwrap();
            // Canonicalize, matching the contract every real caller gets
            // from `themes_dir()`: on macOS `std::env::temp_dir()` returns a
            // path through the `/tmp` -> `/private/tmp` symlink, and
            // `delete_theme_from`'s `starts_with(dir)` containment check
            // requires `dir` to already be canonical or it always fails.
            let dir = fs::canonicalize(&dir).unwrap();
            Self(dir)
        }

        fn path(&self) -> &Path {
            &self.0
        }
    }

    impl Drop for TestDir {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.0);
        }
    }

    // --- validate_theme_id ---

    #[test]
    fn validate_theme_id_accepts_valid_ids() {
        assert!(validate_theme_id("github-dark").is_ok());
        assert!(validate_theme_id("a").is_ok());
        assert!(validate_theme_id("x1-2-3").is_ok());
        assert!(validate_theme_id(&"a".repeat(64)).is_ok());
    }

    #[test]
    fn validate_theme_id_rejects_empty() {
        assert!(validate_theme_id("").is_err());
    }

    #[test]
    fn validate_theme_id_rejects_too_long() {
        assert!(validate_theme_id(&"a".repeat(65)).is_err());
    }

    #[test]
    fn validate_theme_id_rejects_uppercase() {
        assert!(validate_theme_id("Uppercase").is_err());
    }

    #[test]
    fn validate_theme_id_rejects_path_traversal() {
        assert!(validate_theme_id("..").is_err());
        assert!(validate_theme_id("../evil").is_err());
        assert!(validate_theme_id("a/b").is_err());
        assert!(validate_theme_id("a\\b").is_err());
    }

    #[test]
    fn validate_theme_id_rejects_whitespace_and_dot() {
        assert!(validate_theme_id("a b").is_err());
        assert!(validate_theme_id("a.css").is_err());
    }

    #[test]
    fn validate_theme_id_rejects_nul_byte() {
        assert!(validate_theme_id("a\0b").is_err());
    }

    #[test]
    fn validate_theme_id_rejects_non_ascii_in_both_normal_forms() {
        // "café" NFC (single U+00E9) and NFD (e + combining acute, U+0065
        // U+0301). The byte-level ASCII check rejects both identically —
        // there is no normalization step to diverge on.
        let composed = "caf\u{00e9}";
        let decomposed = "cafe\u{0301}";
        assert!(validate_theme_id(composed).is_err());
        assert!(validate_theme_id(decomposed).is_err());
    }

    #[test]
    fn validate_theme_id_rejects_windows_reserved_names() {
        for name in ["con", "nul", "aux", "prn", "com1", "com9", "lpt1", "lpt9"] {
            assert!(validate_theme_id(name).is_err(), "{name} should be rejected");
        }
    }

    #[test]
    fn validate_theme_id_accepts_near_miss_reserved_names() {
        for name in ["console", "com0", "lpt10"] {
            assert!(validate_theme_id(name).is_ok(), "{name} should be accepted");
        }
    }

    // --- is_theme_event ---

    #[test]
    fn is_theme_event_accepts_css_create_modify_remove() {
        let path = PathBuf::from("/themes/foo.css");
        assert!(is_theme_event(
            EventKind::Create(notify::event::CreateKind::File),
            std::slice::from_ref(&path)
        ));
        assert!(is_theme_event(
            EventKind::Modify(notify::event::ModifyKind::Any),
            std::slice::from_ref(&path)
        ));
        assert!(is_theme_event(
            EventKind::Remove(notify::event::RemoveKind::File),
            &[path]
        ));
    }

    #[test]
    fn is_theme_event_rejects_tmp_sibling() {
        let path = PathBuf::from("/themes/foo.css.tmp");
        assert!(!is_theme_event(
            EventKind::Create(notify::event::CreateKind::File),
            &[path]
        ));
    }

    #[test]
    fn is_theme_event_rejects_non_css() {
        let path = PathBuf::from("/themes/notes.txt");
        assert!(!is_theme_event(
            EventKind::Modify(notify::event::ModifyKind::Any),
            &[path]
        ));
    }

    // --- scan_themes / import_theme_to / delete_theme_from ---

    #[test]
    fn import_then_scan_round_trips() {
        let dir = TestDir::new("peep_test_themes_roundtrip");
        let created = import_theme_to(dir.path(), "my-theme", "body { color: red; }").unwrap();
        assert_eq!(created.id, "my-theme");
        assert_eq!(created.css, "body { color: red; }");
        assert!(created.revision > 0);
        assert!(PathBuf::from(&created.path).is_absolute());

        let scanned = scan_themes(dir.path()).unwrap();
        assert_eq!(scanned.len(), 1);
        assert_eq!(scanned[0].id, "my-theme");
        assert_eq!(scanned[0].css, "body { color: red; }");
    }

    #[test]
    fn import_over_existing_id_replaces_and_leaves_no_tmp() {
        let dir = TestDir::new("peep_test_themes_replace");
        import_theme_to(dir.path(), "dup", "first").unwrap();
        import_theme_to(dir.path(), "dup", "second").unwrap();

        let scanned = scan_themes(dir.path()).unwrap();
        assert_eq!(scanned.len(), 1);
        assert_eq!(scanned[0].css, "second");
        assert!(!dir.path().join("dup.css.tmp").exists());
    }

    #[test]
    fn import_rejects_cap_plus_one_and_accepts_exactly_at_cap() {
        let dir = TestDir::new("peep_test_themes_size_cap");
        let cap = usize::try_from(MAX_THEME_BYTES).unwrap();

        let at_cap = "a".repeat(cap);
        assert!(import_theme_to(dir.path(), "at-cap", &at_cap).is_ok());

        let over_cap = "a".repeat(cap + 1);
        assert!(import_theme_to(dir.path(), "over-cap", &over_cap).is_err());
        assert!(!dir.path().join("over-cap.css").exists());
    }

    #[test]
    fn delete_removes_file() {
        let dir = TestDir::new("peep_test_themes_delete");
        import_theme_to(dir.path(), "gone-soon", "body {}").unwrap();
        assert!(dir.path().join("gone-soon.css").exists());

        delete_theme_from(dir.path(), "gone-soon").unwrap();
        assert!(!dir.path().join("gone-soon.css").exists());
    }

    #[test]
    fn delete_unknown_id_errors_with_not_found() {
        let dir = TestDir::new("peep_test_themes_delete_missing");
        let err = delete_theme_from(dir.path(), "never-existed").unwrap_err();
        assert!(err.contains("not found"));
    }

    #[test]
    fn scan_skips_invalid_entries_but_returns_valid_siblings() {
        let dir = TestDir::new("peep_test_themes_scan_skips");

        fs::write(dir.path().join("notes.txt"), "not css").unwrap();
        fs::write(dir.path().join("foo.css.tmp"), "body {}").unwrap();
        fs::write(dir.path().join("Bad.CSS"), "body {}").unwrap();
        fs::write(dir.path().join("my theme.css"), "body {}").unwrap();
        fs::create_dir(dir.path().join("dir.css")).unwrap();
        fs::write(dir.path().join("invalid-utf8.css"), [0xFF, 0xFE, 0xFD]).unwrap();
        let oversized = "a".repeat(usize::try_from(MAX_THEME_BYTES).unwrap() + 1);
        fs::write(dir.path().join("oversized.css"), oversized).unwrap();

        // A valid sibling among all that noise must still surface.
        fs::write(dir.path().join("valid-one.css"), "body { color: blue; }").unwrap();

        let scanned = scan_themes(dir.path()).unwrap();
        assert_eq!(scanned.len(), 1);
        assert_eq!(scanned[0].id, "valid-one");
    }

    #[test]
    fn scan_of_missing_dir_yields_ok_empty() {
        let dir = std::env::temp_dir().join("peep_test_themes_never_created");
        let _ = fs::remove_dir_all(&dir);
        assert!(scan_themes(&dir).unwrap().is_empty());
    }

    #[test]
    fn scan_results_are_sorted_by_id() {
        let dir = TestDir::new("peep_test_themes_sorted");
        for id in ["zeta", "alpha", "mid"] {
            import_theme_to(dir.path(), id, "body {}").unwrap();
        }
        let scanned = scan_themes(dir.path()).unwrap();
        let ids: Vec<&str> = scanned.iter().map(|t| t.id.as_str()).collect();
        assert_eq!(ids, vec!["alpha", "mid", "zeta"]);
    }

    #[test]
    fn scan_count_cap_returns_exactly_max_from_cap_plus_five_files() {
        let dir = TestDir::new("peep_test_themes_count_cap");
        for i in 0..(MAX_THEME_COUNT + 5) {
            fs::write(dir.path().join(format!("theme-{i:04}.css")), "body {}").unwrap();
        }
        let scanned = scan_themes(dir.path()).unwrap();
        assert_eq!(scanned.len(), MAX_THEME_COUNT);
    }

    #[cfg(unix)]
    #[test]
    fn symlink_is_skipped_by_scan_and_rejected_by_delete() {
        use std::os::unix::fs::symlink;

        let dir = TestDir::new("peep_test_themes_symlink");
        symlink("/etc/hosts", dir.path().join("evil.css")).unwrap();

        let scanned = scan_themes(dir.path()).unwrap();
        assert!(scanned.is_empty());

        let err = delete_theme_from(dir.path(), "evil").unwrap_err();
        assert!(err.contains("not found"));
        // The symlink itself must survive an attempted delete of a rejected
        // target — this is a containment check, not a cleanup operation.
        assert!(fs::symlink_metadata(dir.path().join("evil.css")).is_ok());
    }

    // A symlink pointing back INSIDE `dir` is the case that specifically
    // requires the pre-canonicalize `symlink_metadata` check: its canonical
    // target passes `starts_with(dir)` fine, so only the lstat-based
    // symlink check (checked first) rejects it. A symlink pointing outside
    // `dir` (the sibling test above) is already caught by `starts_with`
    // alone and does not exercise this ordering.
    #[cfg(unix)]
    #[test]
    fn symlink_pointing_inside_dir_is_still_rejected_by_delete() {
        use std::os::unix::fs::symlink;

        let dir = TestDir::new("peep_test_themes_symlink_inside");
        import_theme_to(dir.path(), "real", "body {}").unwrap();
        symlink(dir.path().join("real.css"), dir.path().join("alias.css")).unwrap();

        let err = delete_theme_from(dir.path(), "alias").unwrap_err();
        assert!(err.contains("not found"));
        assert!(dir.path().join("real.css").exists());
        assert!(fs::symlink_metadata(dir.path().join("alias.css")).is_ok());
    }

    // A hardlink is invisible to every containment check (see the module-level
    // reasoning on `delete_theme_from`): lstat does not flag it, it is a
    // regular file, and its canonical path is inside `dir`. These two tests do
    // NOT assert that a hardlink is rejected — it is not, by design. They pin
    // the property that makes accepting it tolerable: neither MUTATING path
    // writes through the link to the inode's other name. Without these, a
    // refactor from `write_atomic` to a direct `File::create(&target)` — which
    // DOES write through — would silently turn a read-only disclosure into
    // arbitrary file overwrite, with no test noticing.
    #[cfg(unix)]
    #[test]
    fn hardlink_delete_drops_only_the_link_not_the_outside_file() {
        let dir = TestDir::new("peep_test_themes_hardlink_delete");
        let outside = dir.path().join("outside.txt");
        fs::write(&outside, "OUTSIDE CONTENT").unwrap();
        fs::hard_link(&outside, dir.path().join("linked.css")).unwrap();

        delete_theme_from(dir.path(), "linked").unwrap();

        assert_eq!(fs::read_to_string(&outside).unwrap(), "OUTSIDE CONTENT");
    }

    #[cfg(unix)]
    #[test]
    fn hardlink_import_replaces_the_entry_without_writing_through() {
        let dir = TestDir::new("peep_test_themes_hardlink_import");
        let outside = dir.path().join("outside.txt");
        fs::write(&outside, "OUTSIDE CONTENT").unwrap();
        fs::hard_link(&outside, dir.path().join("linked.css")).unwrap();

        import_theme_to(dir.path(), "linked", "body { color: red; }").unwrap();

        // The rename replaced the directory entry; the other name for the
        // original inode is untouched.
        assert_eq!(fs::read_to_string(&outside).unwrap(), "OUTSIDE CONTENT");
        assert_eq!(
            fs::read_to_string(dir.path().join("linked.css")).unwrap(),
            "body { color: red; }"
        );
    }

    #[test]
    fn revision_equals_independently_computed_mtime_millis() {
        let dir = TestDir::new("peep_test_themes_revision");
        let created = import_theme_to(dir.path(), "timed", "body {}").unwrap();

        let expected = revision_millis(&fs::metadata(dir.path().join("timed.css")).unwrap());
        assert_eq!(created.revision, expected);
    }
}
