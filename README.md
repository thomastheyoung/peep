# peep

A fast, themeable desktop markdown viewer built with Tauri 2 and Svelte 5.

## Usage

```bash
# Open a file
peep README.md

# Open multiple files
peep file1.md file2.md

# Open all markdown files in a directory
peep docs/
```

Files are live-reloaded when they change on disk. If `peep` is already running, new files open as tabs in the existing window.

## Features

- **Live reload** — files update instantly on save via filesystem watching
- **22 built-in themes** — from GitHub Dark to Retro Terminal, switchable in preferences
- **Zoom** — Cmd+=/Cmd+- or View menu
- **Tabbed interface** — open multiple files, middle-click or Cmd+W to close
- **Content width** — auto (reading-optimized), wide, or full
- **Syntax highlighting** — 17 languages via Shiki with CSS variables theming
- **Single instance** — second launch passes files to the running window
- **Window state** — remembers position and size across sessions

## Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| Cmd+O | Open file dialog |
| Cmd+W | Close current tab |
| Cmd+, | Toggle preferences |
| Cmd+= | Zoom in |
| Cmd+- | Zoom out |
| Cmd+0 | Reset zoom |

## Development

```bash
pnpm install

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

## Tech stack

- **Tauri 2** — Rust backend for filesystem ops, native menus, window management
- **SvelteKit** — static adapter, SSR disabled, Svelte 5 runes for state
- **marked** — markdown parsing
- **shiki** — syntax highlighting
- **notify** (Rust) — filesystem watching

## License

MIT
