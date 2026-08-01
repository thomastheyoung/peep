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

# Storybook (shared components, official themes, design explorations)
pnpm storybook

# Static Storybook build
pnpm build-storybook
```

## Architecture

**Two-process model:** Rust backend (Tauri) handles filesystem ops, Svelte 5 frontend renders markdown.

### Rust backend (`src-tauri/src/lib.rs`)
- `read_file` command: reads a markdown file from disk, returns `{ path, content, filename }`
- `watch_file` / `unwatch_file` commands: register/unregister files with `notify::RecommendedWatcher`, emits `file-changed` events on modify/create
- `get_initial_files` command: returns CLI args collected during `setup()`, drained on first call (frontend polls this on mount instead of relying on timed events)
- Single-instance plugin: second launch resolves paths and emits `open-file` events to the existing window, then focuses it
- Window state plugin: persists window position/size across sessions
- Native menu: App, Edit, View submenus. View menu has zoom in/out/reset with Cmd+=/Cmd+-/Cmd+0 accelerators, emitted as `zoom` events. App menu has "Check for Updates…", emitted as a `check-updates` event
- Updater plugin: registered in the builder chain alongside the process plugin (which provides `relaunch()`). No custom commands — the JS plugin talks to the Rust plugin over its own IPC channel, so every `#[tauri::command]` stays synchronous
- All mutable state in `AppState` behind `Mutex` (watched files, watcher, initial files)

### Frontend (`src/`)
- **Single page app** — SvelteKit with `adapter-static`, SSR disabled (`+layout.ts`)
- `src/lib/markdown.ts` — renders markdown via `marked` with `shiki` syntax highlighting. Shiki uses a CSS variables theme (not hardcoded themes) so each theme controls code colors via CSS custom properties. Highlighter is lazily initialized as a module-level singleton. Render generation tracking prevents stale async renders from overwriting newer content
- `src/lib/tabs.svelte.ts` — tab state management using Svelte 5 runes (`$state`). Module-level singleton exported as `tabs`
- `src/lib/preferences.svelte.ts` — unified preferences state with settings registry pattern. Manages theme, content width (auto/wide/full), zoom, font weight, letter spacing, and line height. The `settings` getter returns a `SettingDef[]` array (choice or range types) that drives both the Preferences panel and the command palette — single source of truth. Persisted to localStorage. Module-level singleton exported as `preferences`
- `src/lib/commands.ts` — builds the command list for the palette from settings registry + app actions (open file, close tab). `Command` is a discriminated union (`ParentCommand | ActionCommand` with `kind` field). Parent commands have drill-in children (e.g. theme picker with color swatches).

  **The palette snapshots this array when it opens and never rebuilds it while open.** A command whose text must track changing state has to declare `label`/`detail` as *getters* — Svelte's `$state` proxy passes accessors through to `Reflect.get` rather than caching them, so the read happens at template render time and registers as a reactive dependency. This makes a command's contents reactive but never its membership: presence is fixed at snapshot time, so state-dependent commands (`check-for-updates`) are pushed unconditionally and encode their state in the label instead of being conditionally included. Command ids must also avoid colons — `CommandPalette.svelte` parses two-part ids as theme ids
- `src/lib/command-palette.svelte.ts` — reactive state for the command palette: open/close, query filtering, selection index, navigation stack for drill-in levels. Module-level singleton exported as `commandPalette`
- `src/lib/copy-code.ts` — Svelte action that adds copy-to-clipboard buttons to `<pre>` blocks in rendered markdown. Uses inline SVG icons with animated check feedback
- `src/lib/mermaid.ts` — Svelte action that renders Mermaid diagrams in `.mermaid-diagram` elements. Mermaid is lazily imported on first use; the source is stashed in `data-source` so diagrams can re-render when the theme changes
- `src/lib/scroll-spy.ts` — Svelte action that tracks which heading is in view and reports it via an `onActiveChange` callback (it has no dependency on tab or ToC state). Takes a `key` identifying the document, because the node it attaches to never unmounts — without it the deduped `currentId` would persist across tab switches and swallow the first callback for a new document sharing a heading id
- `src/lib/toc.ts` — thin facade over `tabs.active` exposing `headings`, `activeId`, and `hasHeadings`, so ToC consumers don't reach into tab state directly
- `src/lib/files.ts` — file lifecycle helpers shared by the palette, menus, and shortcuts: `openFile`, `openFileDialog`, `closeTab`, and `handleFileChanged` (the debounced live-reload path)
- `src/lib/updater.svelte.ts` — auto-update state machine (`idle`/`checking`/`up-to-date`/`available`/`downloading`/`ready`/`relaunching`/`error`) over `@tauri-apps/plugin-updater`. Module-level singleton exported as `updater`. Download progress arrives as per-chunk deltas, so bytes are accumulated manually; `progress` returns `null` rather than `NaN` when Content-Length is absent. Checks are deduplicated by an in-flight promise, and the launch check is latched so HMR re-runs of the `+page.svelte` effect cannot re-trigger it. `activate()` is the single definition of what a click means at a given status (check / download / restart / no-op while busy) — both the titlebar badge in `TabBar.svelte` and the palette entry call it, so the two cannot drift. The badge requires a second click to confirm before restarting, since restarting quits the app
- `src/lib/components/Preferences.svelte` — 2-column settings panel (Cmd+,) with section navigation (appearance, layout, font) and live controls for all settings
- `src/lib/components/CommandPalette.svelte` — Cmd+K command palette with fuzzy search, keyboard navigation, drill-in sub-lists, and live theme preview via Shadow DOM
- `src/lib/components/ThemePreview.svelte` — renders a miniature theme preview inside a Shadow DOM to isolate theme CSS from the main document. Combines `base.css` + the theme's CSS + preview-only overrides, and caches the result per theme id at module level
- `src/lib/components/TabBar.svelte` — titlebar and tab strip. Reads the `tabs` singleton directly rather than taking tabs as props, and hosts the updater badge
- `src/lib/components/EmptyState.svelte` / `EmptyStateStamp.svelte` — the two no-document-open screens; both take `onOpenFile` and a `hidden` flag that drives the fade-out
- `src/lib/components/FloatingDock.svelte` — floating table-of-contents dock; headings come from the active tab via the `toc` facade in `src/lib/toc.ts`
- `src/routes/+page.svelte` — the entire app UI: titlebar with draggable region (macOS overlay titlebar), tab bar with keyboard navigation and middle-click close, markdown content area with copy-code action, empty state with open-file prompt. File change events are debounced at 150ms

### Theme system (`src/lib/themes/`)
- `types.ts` — `ThemeMeta` interface: id, name, preview colors, lazy `load()` function
- `registry.ts` — array of 22 theme definitions, each with a dynamic `import("./themes/<name>.css?raw")` loader
- `theme.svelte.ts` — reactive theme state exported as `themeState`. Theme persistence is handled by `preferences.svelte.ts` via the `md-preferences` localStorage key
- `themes/*.css` — 22 complete CSS theme files, injected into `<svelte:head>` as raw CSS at runtime
- `base.css` — structural defaults for `.markdown-body` using `@layer base, theme` (themes override via `@layer theme`)

### Storybook (`.storybook/`, `src/stories/`, `src/lib/storybook/`)

Three top-level sections, ordered by `storySort` in `preview.ts`. Anything unlisted sorts after them, so a new story surfaces at the bottom rather than being silently buried.

| Section | Source | What it is |
| --- | --- | --- |
| Shared Components | `src/stories/components/` | Real app components from `$lib/components` |
| Official Themes | `src/stories/themes/` | Driven by `$lib/themes/registry` — the themes the app actually ships |
| Design Explorations | `src/stories/explorations/` | 20 markdown, 20 tab, and 27 splash design studies with self-contained styles |

Story files hot-reload, but `main.ts` and `preview.ts` are config and only take effect on a Storybook restart. A `stories` glob that matches nothing is a startup warning rather than an error (`No story files found for the specified pattern`), so it survives both `pnpm check` and `build-storybook` — the dev server log is the only place it shows up.

Two constraints make components renderable outside the Tauri webview and outside `+page.svelte`:

- **`.storybook/tauri-mock.ts`** installs a fake `window.__TAURI_INTERNALS__`. `TabBar.svelte` calls `getCurrentWindow()` during init and `Preferences.svelte` calls `invoke()`; both dereference that global (see `@tauri-apps/api/core.js`) and throw in a plain browser before any markup renders. Faking the transport at the Storybook boundary keeps production code free of Storybook-awareness. Unknown commands resolve to `null` rather than rejecting.
- **`.storybook/preview-head.html` + the `base.css` import in `preview.ts`** supply what `+page.svelte` normally provides. The `box-sizing` reset and body margin live in that component's `:global` block, and the `--chrome-*` tokens live in `base.css` — neither loads when a component is mounted on its own. `staticDirs: ["../static"]` is what makes the `@font-face` URLs (`/fonts/*.woff2`) resolve.

`src/lib/storybook/` holds story-only support code. Nothing in `src/routes` or `$lib/components` imports it, so it stays out of the app bundle — keep it that way:

- `ThemeGallery.svelte` — maps over the theme registry and renders each entry through the real `ThemePreview`. Adding a theme to `registry.ts` adds it to Storybook with no story edit
- `seed.ts` — seeds the `tabs` singleton through its public API for components that read module-level state instead of props. Stories call it from `beforeEach` and return a cleanup, since a singleton is instantiated once per page load and would otherwise leak between stories
- `sample-doc.ts` — raw markdown, so theme stories exercise the real `renderMarkdown` pipeline. Distinct from `$lib/sample-markdown`, which is frozen HTML with inline colors and is only suitable for the static design explorations

### Tauri events (frontend <-> backend)
- `open-file` (backend -> frontend): path string, triggers file read + tab creation
- `file-changed` (backend -> frontend): `{ path, content, filename }`, debounced re-render of matching tab
- `zoom` (backend -> frontend): `"in"` / `"out"` / `"reset"`, triggered by native View menu
- `check-updates` (backend -> frontend): no payload, triggered by the App menu's "Check for Updates…". Runs a check then opens the palette so the user sees the result — unlike the silent launch check

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
- **tauri-plugin-updater** / **tauri-plugin-process** — signed self-update and relaunch
- **Storybook 10** — with `@storybook/sveltekit`, Svelte CSF, vitest, a11y, and docs addons. See the Storybook section under Architecture for how stories are organized

## Release and distribution

`pnpm release` bumps the minor version, tags, and pushes; the `v*` tag triggers `.github/workflows/release.yml`, which builds macOS arm64, Linux, and Windows and opens a **draft** GitHub release. Publishing the draft is a manual step — `latest.json` is only reachable at `/releases/latest/download/` once the release is not a draft.

Constraints worth knowing before changing any of this:

- **`package.json` is the only version that matters.** `tauri.conf.json` inherits it via `"version": "../package.json"`, and that is what the updater compares against the manifest. `Cargo.toml`'s version is cosmetic. CI fails the build if the tag and `package.json` disagree.
- **`createUpdaterArtifacts: true` is what emits the `.tar.gz` + `.sig`.** Without it everything still builds and the updater silently has nothing to serve.
- **`bundle.targets` is an explicit list, not `"all"`.** deb/rpm self-update works (plugin ≥2.10.0) but shells out to a privileged installer, putting a password prompt in front of the user on every update — AppImage swaps a file the user already owns. Only one artifact can occupy the `linux-x86_64` slot in `latest.json` anyway.
- **The repo must stay public.** GitHub returns 404 for release assets on private repos to unauthenticated clients, and Tauri's config has nowhere to put a token.
- **No CSP change is needed for the updater.** The manifest fetch and download both happen via `reqwest` in the Rust process, outside the webview.
- **macOS builds are not notarized.** First install is blocked by Gatekeeper until the user runs `xattr -cr`; self-updates are unaffected because Tauri's updater never sets the quarantine flag. The `APPLE_*` env vars are already wired into the release workflow and no-op while unset, so notarizing later is a secrets-only change.
- **`ubuntu-22.04`, not `ubuntu-latest`** — glibc is forward-incompatible, so an AppImage built on 24.04 will not run on 22.04.
