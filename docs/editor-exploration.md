# Editor feature exploration

Analysis of what it would take to add editing capabilities to peep, and whether alternative frontend technologies (SolidJS, WASM) would provide meaningful performance gains.

## Performance analysis: Svelte vs SolidJS vs WASM

### Where peep spends its time

The hot path is:

```
disk change -> Rust notify -> IPC -> marked.parse() -> shiki highlight -> {@html} into DOM
```

The expensive work is markdown parsing and syntax highlighting — pure CPU-bound string processing that happens before any framework touches the DOM. The final DOM update is a single `{@html}` assignment (one innerHTML write). No diffing, no fine-grained reactivity, no virtual DOM reconciliation.

### SolidJS: no meaningful gain

SolidJS excels at fine-grained reactivity with hundreds of independently-updating nodes (spreadsheets, data dashboards). Peep's reactive surface is tiny: ~10 tabs, a handful of preferences, and one large HTML blob swap per file change. Svelte 5 runes already compile to efficient granular updates. The difference is sub-microsecond in a UI that updates at most every 150ms (the debounce interval).

### WASM: depends on what moves to WASM

- **Markdown parsing** — replacing `marked` with `pulldown-cmark` (Rust/WASM) could cut parse time from ~5-20ms to ~2-8ms on large files. Marginal given the 150ms debounce and the fact that users are reading, not benchmarking.
- **Syntax highlighting** — shiki already uses `vscode-oniguruma` via WASM internally. Already getting WASM performance for the most expensive per-block operation.
- **Full pipeline in Rust** (`comrak` + `tree-sitter`) — 2-5x total render time reduction on very large files, but output still must become DOM nodes via innerHTML. Serialization boundary eats into gains.

### Where actual gains would come from

These are algorithmic/architectural changes, not framework swaps:

1. **Incremental re-rendering** — only re-parse changed sections instead of full document
2. **Web Worker** — move markdown + highlight off main thread
3. **Virtual scrolling** — only render visible sections for very long documents

### Conclusion

Svelte is not the bottleneck. The framework does almost nothing — it's a thin shell around raw HTML injection. Switching frameworks would be churn with no perceptible improvement. WASM could help for markdown parsing on unusually large files, but the debounce already masks the cost.

The key insight: peep is a **read-only viewer**, not an editor. Editors have complex reactivity needs where framework choice matters. Viewers just parse and dump HTML — the framework's job is trivial.

## Rearchitecture required for editing

### Current assumptions that break

The entire architecture assumes **disk is the source of truth**. The watcher replaces content freely, tabs hold pre-rendered HTML, there's no save concept. An editor flips this — the source of truth becomes the **in-memory document buffer**.

### 1. Replace `{@html}` rendering with an editor component

The current `{@html tabs.active.rendered}` model dumps a pre-baked HTML string. An editor needs a live document model that maps cursor positions to source offsets, handles selections, and processes input events.

**Options:**

| Option | Style | Tradeoffs |
|---|---|---|
| CodeMirror 6 | Source-mode editing | Best for plain-text markdown editing. Handles input, undo, selections, syntax highlighting natively. Replace `marked`+`shiki` for the editing surface, keep for preview. |
| ProseMirror / Tiptap | WYSIWYG-ish | Operates on structured document model. Heavier architectural commitment. Better for rich editing UX. |
| Custom `contenteditable` | Full control | What Caret did. Maximum control, maximum effort. Only makes sense if editing *is* the product. |

This is the single biggest decision — everything else cascades from it.

### 2. Extend the tab model

Current `Tab` interface:
```ts
{ path, filename, content, rendered, color }
```

Editing requires:
- **Mutable document buffer** — editor's internal state, separate from disk content
- **Dirty tracking** — unsaved indicator in tab chrome
- **Undo/redo history** — per-tab operation stack (CodeMirror/ProseMirror provide this, but must be wired into tab lifecycle)
- **Save command** — `Cmd+S` invoking a new `write_file` Tauri command

### 3. File watcher conflict resolution

The watcher (`lib.rs`) fires on any `Modify`/`Create` event and the frontend blindly replaces tab content. With editing:

- **External modification during editing** — need conflict resolution: reload and lose edits? Show a diff? Merge?
- **Suppress self-triggered events** — saving fires a file-changed event that would clobber the editor state. Pattern: maintain `recently_saved: Mutex<HashSet<PathBuf>>` in Rust backend, skip events for paths in the set.
- **Debounce awareness** — the 150ms debounce in `+page.svelte` needs to know whether a tab is "owned" by the editor or by the disk.

### 4. Rust backend: add write capability

Add a `write_file` command and save-aware watcher suppression:

```rust
#[tauri::command]
fn write_file(path: String, content: String) -> Result<(), String> { ... }
```

The watcher needs to check a recently-saved set before emitting `file-changed` events.

### 5. Split the rendering pipeline

`markdown.ts` currently does one thing: full-document render. Editing requires:

- **Preview mode** — same as today, full `marked` + `shiki` render
- **Edit mode** — editor component handles its own rendering
- **Split view** — side-by-side editing + preview. Preview must update incrementally as user types. Full re-renders on every keystroke lag on large files — this is where incremental parsing and Web Workers become necessary rather than optional.

### 6. Keyboard shortcut expansion

Current keybindings are small and viewer-focused. Editing adds:

- `Cmd+S` save
- `Cmd+Z` / `Cmd+Shift+Z` undo/redo (or delegate to editor component)
- `Cmd+B` / `Cmd+I` bold/italic formatting
- Potential conflicts with editor component's own keybindings
- Native Edit menu items (undo/cut/copy/paste) need to route to editor rather than webview defaults

### 7. Mode-aware file opening

Currently `peep <file>` always opens in view mode. Decisions needed:

- Does `peep <file>` open for viewing or editing?
- Is there a `peep --edit <file>` flag?
- Does double-clicking a tab toggle modes?

### What stays the same

- **Tauri + Svelte shell** — app chrome, tabs, preferences, themes, command palette
- **Theme system** — works for both viewing and editing (CodeMirror supports CSS variable themes)
- **File watcher infrastructure** — Rust notify plumbing stays, just needs conflict-awareness layer
- **Markdown rendering** — `marked` + `shiki` still power the preview pane

### Effort by layer

| Layer | Change | Scope |
|---|---|---|
| Editor component | New (CodeMirror 6 or ProseMirror) | Large |
| Tab model | Extend with dirty state, undo stack ref, document buffer | Medium |
| Rust backend | Add `write_file`, save-aware watcher suppression | Medium |
| File watcher conflict | New conflict detection/resolution logic | Medium-hard |
| Rendering pipeline | Split into edit/preview modes, optional incremental | Medium |
| Keyboard/menu system | Expand, handle conflicts with editor bindings | Small-medium |
| UI chrome | Add edit/preview toggle, save indicator, split view | Small-medium |

## Prior art: Caret

Caret (caret.io) is a closed-source markdown editor by @erusev and @astoilkov. Research findings:

- **Desktop framework:** Electron (confirmed by release artifacts: `.nupkg`/Squirrel.Windows, `.dmg`, `.deb`, `.rpm`)
- **UI framework:** Likely React (astoilkov maintains several React libraries)
- **Editor engine:** Custom, built from scratch ("We built the editor from scratch to make sure that we'll always have the flexibility to implement the features that we want")
- **Markdown parsing:** Custom, rooted in erusev's Parsedown (PHP markdown parser). CommonMark compliant.
- **Syntax highlighting:** Unknown
- **Source code:** Fully closed. GitHub org only has issue trackers and release binaries.
- **Successor:** Nota (nota.md), same team, also closed-source

The fact that Caret built a custom editor engine from scratch underscores the point: once editing is the core, the editor engine dictates the entire architecture.
