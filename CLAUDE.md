# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Tauri 2 desktop app for viewing markdown files. Product name is `peep`. Users open files via `peep <file.md>` CLI or by passing directories (opens all `.md`/`.markdown` files inside). Files are live-reloaded on disk changes via the `notify` crate. Second launches pass files to the existing window via the single-instance plugin.

## Commands

```bash
# Frontend dev server (port 1420)
pnpm dev

# Full Tauri app (compiles Rust + launches webview)
pnpm tauri dev

# Production build
pnpm tauri build

# Type checking
pnpm check

# Storybook (theme/tab explorations)
pnpm storybook
```

## Architecture

**Two-process model:** Rust backend (Tauri) handles filesystem ops, Svelte 5 frontend renders markdown.

### Rust backend (`src-tauri/src/lib.rs`)
- `read_file` command: reads a markdown file from disk, returns `{ path, content, filename }`
- `watch_file` / `unwatch_file` commands: register/unregister files with `notify::RecommendedWatcher`, emits `file-changed` events on modify/create
- `get_initial_files` command: returns CLI args collected during `setup()`, drained on first call (frontend polls this on mount instead of relying on timed events)
- Single-instance plugin: second launch resolves paths and emits `open-file` events to the existing window, then focuses it
- Window state plugin: persists window position/size across sessions
- Native menu: App, Edit, View submenus. View menu has zoom in/out/reset with Cmd+=/Cmd+-/Cmd+0 accelerators, emitted as `zoom` events
- All mutable state in `AppState` behind `Mutex` (watched files, watcher, initial files)

### Frontend (`src/`)
- **Single page app** — SvelteKit with `adapter-static`, SSR disabled (`+layout.ts`)
- `src/lib/markdown.ts` — renders markdown via `marked` with `shiki` syntax highlighting. Shiki uses a CSS variables theme (not hardcoded themes) so each theme controls code colors via CSS custom properties. Highlighter is lazily initialized as a module-level singleton. Render generation tracking prevents stale async renders from overwriting newer content
- `src/lib/tabs.svelte.ts` — tab state management using Svelte 5 runes (`$state`). Module-level singleton exported as `tabs`
- `src/lib/preferences.svelte.ts` — unified preferences state with settings registry pattern. Manages theme, content width (auto/wide/full), zoom, font weight, letter spacing, and line height. The `settings` getter returns a `SettingDef[]` array (choice or range types) that drives both the Preferences panel and the command palette — single source of truth. Persisted to localStorage. Module-level singleton exported as `preferences`
- `src/lib/commands.ts` — builds the command list for the palette from settings registry + app actions (open file, close tab). `Command` is a discriminated union (`ParentCommand | ActionCommand` with `kind` field). Parent commands have drill-in children (e.g. theme picker with color swatches)
- `src/lib/command-palette.svelte.ts` — reactive state for the command palette: open/close, query filtering, selection index, navigation stack for drill-in levels. Module-level singleton exported as `commandPalette`
- `src/lib/copy-code.ts` — Svelte action that adds copy-to-clipboard buttons to `<pre>` blocks in rendered markdown. Uses inline SVG icons with animated check feedback
- `src/lib/components/Preferences.svelte` — 2-column settings panel (Cmd+,) with section navigation (appearance, layout, font) and live controls for all settings
- `src/lib/components/CommandPalette.svelte` — Cmd+K command palette with fuzzy search, keyboard navigation, drill-in sub-lists, and live theme preview via Shadow DOM
- `src/lib/components/ThemePreview.svelte` — renders a miniature theme preview inside a Shadow DOM to isolate theme CSS from the main document
- `src/routes/+page.svelte` — the entire app UI: titlebar with draggable region (macOS overlay titlebar), tab bar with keyboard navigation and middle-click close, markdown content area with copy-code action, empty state with open-file prompt. File change events are debounced at 150ms

### Theme system (`src/lib/themes/`)
- `types.ts` — `ThemeMeta` interface: id, name, preview colors, lazy `load()` function
- `registry.ts` — array of 22 theme definitions, each with a dynamic `import("./themes/<name>.css?raw")` loader
- `theme.svelte.ts` — reactive theme state exported as `themeState`. Theme persistence is handled by `preferences.svelte.ts` via the `md-preferences` localStorage key
- `themes/*.css` — 22 complete CSS theme files, injected into `<svelte:head>` as raw CSS at runtime
- `base.css` — structural defaults for `.markdown-body` using `@layer base, theme` (themes override via `@layer theme`)

### Tauri events (frontend <-> backend)
- `open-file` (backend -> frontend): path string, triggers file read + tab creation
- `file-changed` (backend -> frontend): `{ path, content, filename }`, debounced re-render of matching tab
- `zoom` (backend -> frontend): `"in"` / `"out"` / `"reset"`, triggered by native View menu

### Keyboard shortcuts
- `Cmd+K` — toggle command palette
- `Cmd+O` — open file dialog (uses `@tauri-apps/plugin-dialog`)
- `Cmd+W` — close active tab (unwatches file)
- `Cmd+,` — toggle preferences panel
- `Cmd+=` / `Cmd+-` / `Cmd+0` — zoom (handled via native menu accelerators)
- `Cmd+]` / `Cmd+ArrowRight` — next tab
- `Cmd+[` / `Cmd+ArrowLeft` — previous tab
- Arrow keys — navigate tabs when tablist is focused

## Key dependencies

- **marked** — markdown parsing
- **shiki** — syntax highlighting with CSS variables theme
- **@tauri-apps/plugin-dialog** — native file open dialog
- **@tauri-apps/plugin-opener** — system URL/file opener
- **notify** (Rust) — filesystem watching
- **tauri-plugin-single-instance** (Rust) — ensures one app instance, passes args to existing
- **tauri-plugin-window-state** (Rust) — persists window geometry
- **Storybook 10** — with `@storybook/sveltekit`, Svelte CSF, vitest, a11y, and docs addons; houses 20 markdown theme explorations and 20 tab style explorations
