# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Tauri 2 desktop app for viewing markdown files. Product name is `md`. Users open files via `md <file.md>` CLI or by passing directories (opens all `.md`/`.markdown` files inside). Files are live-reloaded on disk changes via the `notify` crate.

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

# Storybook
pnpm storybook
```

## Architecture

**Two-process model:** Rust backend (Tauri) handles filesystem ops, Svelte 5 frontend renders markdown.

### Rust backend (`src-tauri/src/lib.rs`)
- `read_file` command: reads a markdown file from disk, returns `{ path, content, filename }`
- `watch_file` command: registers a file with `notify::RecommendedWatcher`, emits `file-changed` events to the frontend when the file is modified
- On startup, CLI args are parsed and emitted as `open-file` events after a 500ms delay (waiting for frontend mount)
- All state is in `AppState` behind `Mutex` (watched file list + watcher instance)

### Frontend (`src/`)
- **Single page app** — SvelteKit with `adapter-static`, SSR disabled (`+layout.ts`)
- `src/lib/markdown.ts` — renders markdown via `marked` with `shiki` syntax highlighting. Shiki highlighter is lazily initialized as a module-level singleton
- `src/lib/tabs.svelte.ts` — tab state management using Svelte 5 runes (`$state`). Exported as a `getTabs()` factory returning a reactive object
- `src/routes/+page.svelte` — the entire app UI: titlebar with draggable region (macOS overlay titlebar), tab bar, markdown content area, and theme toggle (dark/light, defaults to system preference)
- Theme is applied via `data-theme` attribute on the root `.app` div, with all color variants handled in CSS using `[data-theme="dark"]`/`[data-theme="light"]` selectors

### Tauri events (frontend ↔ backend)
- `open-file` (backend → frontend): path string, triggers file read + tab creation
- `file-changed` (backend → frontend): `{ path, content, filename }`, triggers re-render of matching tab

## Key dependencies

- **marked** — markdown parsing
- **shiki** — syntax highlighting with `github-dark`/`github-light` themes
- **notify** (Rust) — filesystem watching
- **Storybook 10** with `@storybook/sveltekit`, Svelte CSF, vitest, a11y, and docs addons
