# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Tauri 2 desktop app for viewing markdown files. Product name is `peep`. Users open files via `peep <file.md>` CLI or by passing directories (opens all `.md`/`.markdown` files inside). Files are live-reloaded on disk changes via the `notify` crate. Second launches pass files to the existing window via the single-instance plugin.

It is a viewer, not an editor. Rendering covers syntax highlighting, math, diagrams, footnotes, and emoji. Themes ship built-in (7) and can also be imported by the user as raw CSS — which makes **two independent untrusted-input surfaces** the dominant design constraint in this codebase: a `.md` file arrives by email or clone, and an imported theme is arbitrary CSS injected into a webview that has `invoke` in scope. `sanitize-html.ts` and `themes/sanitize-theme-css.ts` are the two choke points, they solve their problems in deliberately different ways, and both file headers explain why. Read them before changing either.

## Commands

```bash
# Frontend dev server (port 1420)
pnpm dev

# Full Tauri app (compiles Rust + launches webview)
pnpm tauri dev

# Production build
pnpm tauri build

# Type checking (app, then the standalone scripts/ tsconfig)
pnpm check
pnpm check:scripts

# Tests
pnpm test

# Regenerate theme preview swatches from theme CSS (after changing a theme's colors)
pnpm gen:theme-colors

# Regenerate themes/README.md (after adding/removing/editing a gallery theme)
pnpm gen:gallery-readme

# Real-browser suites — these answer questions jsdom cannot (see below)
pnpm test:sanitizer   # adversarial theme CSS in Chromium AND WebKit
pnpm diff:themes      # computed-style diff per theme against git HEAD

# Storybook (shared components, official themes, design explorations)
pnpm storybook

# Static Storybook build
pnpm build-storybook
```

## Architecture

**Two-process model:** Rust backend (Tauri) handles filesystem ops, Svelte 5 frontend renders markdown.

### Rust backend (`src-tauri/src/`)

`lib.rs` — files, window, menus, preferences:
- `read_file` command: reads a markdown file from disk, returns `{ path, content, filename }`
- `watch_file` / `unwatch_file` commands: register/unregister files with `notify::RecommendedWatcher`, emits `file-changed` events on modify/create
- `get_initial_files` command: returns CLI args collected during `setup()`, drained on first call (frontend polls this on mount instead of relying on timed events)
- `get_preferences` / `set_preferences` commands: read and replace the on-disk preferences JSON. `set_preferences` REPLACES rather than merges — see the trap noted under `preferences.svelte.ts`
- `is_default_markdown_viewer` / `set_default_markdown_viewer` commands: query and claim the OS-level `.md` file association
- Single-instance plugin: second launch resolves paths and emits `open-file` events to the existing window, then focuses it
- Window state plugin: persists window position/size across sessions
- Native menu: App, Edit, View submenus. View menu has zoom in/out/reset with Cmd+=/Cmd+-/Cmd+0 accelerators, emitted as `zoom` events. App menu has "Check for Updates…", emitted as a `check-updates` event
- Updater plugin: registered in the builder chain alongside the process plugin (which provides `relaunch()`). No custom commands — the JS plugin talks to the Rust plugin over its own IPC channel, so every `#[tauri::command]` stays synchronous
- All mutable state in `AppState` behind `Mutex` (watched files, watcher, initial files)

`themes.rs` — user theme storage in `<config_dir>/themes/`. Commands: `get_user_themes` (scan), `import_theme`, `delete_user_theme`, `watch_user_themes` (arms a second, independent `notify` watcher that emits `user-themes-changed`). Written as dir-parameterized free functions (`scan_themes` / `import_theme_to` / `delete_theme_from`) so filesystem tests are hermetic and need no `AppHandle`. Three constraints to keep in view when touching it:
  - **`MAX_THEME_BYTES` (256KB) and `MAX_THEME_COUNT` (100) bound memory as a PRODUCT**, and the file says so — 100 × 256KB is ~25MB resident, roughly tripled across IPC serialization and the frontend copy. Raise either with that multiplication in mind
  - **`THEME_EXISTS` is a machine-readable sentinel**, matched exactly by the frontend to decide whether to offer the "Replace" prompt. Folding it into a prose error message breaks that match silently
  - **`ImportMode` is threaded explicitly with no `#[serde(default)]`** — a caller omitting `mode` fails IPC deserialization rather than silently landing on `Replace`, which is the accidental-overwrite failure the type exists to prevent

### Frontend (`src/`)
- **Single page app** — SvelteKit with `adapter-static`, SSR disabled (`+layout.ts`)
- `src/lib/markdown.ts` — renders markdown via `marked` with `shiki` syntax highlighting (18 languages). Also wired: KaTeX math (`trust: false` is stated explicitly because it is a security control — it refuses `\href`/`\url`/`\htmlClass`), footnotes, and `:emoji:` shortcodes via gemoji. Shiki uses a CSS variables theme (not hardcoded themes) so each theme controls code colors via CSS custom properties. Highlighter and the `Marked` instance are lazily initialized module-level singletons. Render generation tracking prevents stale async renders from overwriting newer content.

  Heading ids are prefixed `user-content-` at the source. **This is not cosmetic** — DOMPurify's DOM-clobbering protection strips `id` values colliding with a `document` property, and `title`, `body`, `head`, `name`, `length` and others were measured to be stripped, so `# Title` would silently lose its ToC entry, scroll-spy, and scroll restore with no error. Prefixing keeps `TocHeading.id` and the DOM id identical by construction
- `src/lib/sanitize-html.ts` — the sanitization choke point for rendered markdown, via DOMPurify. Sits at the producer (`renderMarkdown`) rather than the `{@html}` sink, making "this string is sanitized" an invariant of the value instead of an obligation on each of the three consumers; the `SanitizedHtml` brand makes a fourth unsanitized sink a `pnpm check` failure. **Do not reason by analogy from `sanitize-theme-css.ts` and hand-roll this** — CSSOM handed that module a native spec-correct parser to rebuild from, and HTML has no equivalent (the hard part is the element/attribute safety corpus and mXSS namespace rules, not the tree). The file header says so explicitly. Note Mermaid's generated SVG does not pass through here — it is produced asynchronously long after `renderMarkdown` returned
- `src/lib/tabs.svelte.ts` — tab state management using Svelte 5 runes (`$state`). Module-level singleton exported as `tabs`
- `src/lib/preferences.svelte.ts` — unified preferences state with settings registry pattern. Manages theme, content width (auto/wide/full), zoom, font weight, letter spacing, and line height. The `settings` getter returns a `SettingDef[]` array (choice or range types) that drives both the Preferences panel and the command palette — single source of truth. Module-level singleton exported as `preferences`.

  **Persisted to a JSON file via IPC, not localStorage** (localStorage survives only as a one-time migration source — file present wins, and the legacy key is left in place). Two consequences:
  - **Writes REPLACE the whole file**, so an omitted key is not "leave the stored value alone," it is "erase it." This was a measured bug: after a failed theme scan, a payload without the `theme` key wiped the user's stored theme id on the next zoom step. Hence `pendingThemeId` — the original string is held and written back verbatim, because a scan failure is evidence only that this launch could not check, not that the theme is gone
  - **Saves are debounced** (a slider drag would otherwise issue a write per frame), so `flushStored()` exists to force a pending write on quit — without it, quitting within the debounce window silently drops the change
- `src/lib/commands.ts` — builds the command list for the palette from settings registry + app actions (open file, close tab). `Command` is a discriminated union (`ParentCommand | ActionCommand` with `kind` field). Parent commands have drill-in children (e.g. theme picker with color swatches).

  **The palette snapshots this array when it opens and never rebuilds it while open.** A command whose text must track changing state has to declare `label`/`detail` as *getters* — Svelte's `$state` proxy passes accessors through to `Reflect.get` rather than caching them, so the read happens at template render time and registers as a reactive dependency. This makes a command's contents reactive but never its membership: presence is fixed at snapshot time, so state-dependent commands (`check-for-updates`) are pushed unconditionally and encode their state in the label instead of being conditionally included. Command ids must also avoid colons — `CommandPalette.svelte` parses two-part ids as theme ids
- `src/lib/command-palette.svelte.ts` — reactive state for the command palette: open/close, query filtering, selection index, navigation stack for drill-in levels. Module-level singleton exported as `commandPalette`
- `src/lib/copy-code.ts` — Svelte action that adds copy-to-clipboard buttons to `<pre>` blocks in rendered markdown. Uses inline SVG icons with animated check feedback
- `src/lib/mermaid.ts` — Svelte action that renders Mermaid diagrams in `.mermaid-diagram` elements. Mermaid is lazily imported on first use; the source is stashed in `data-source` so diagrams can re-render when the theme changes
- `src/lib/scroll-spy.ts` — Svelte action that tracks which heading is in view and reports it via an `onActiveChange` callback (it has no dependency on tab or ToC state). Takes a `key` identifying the document, because the node it attaches to never unmounts — without it the deduped `currentId` would persist across tab switches and swallow the first callback for a new document sharing a heading id
- `src/lib/toc.ts` — thin facade over `tabs.active` exposing `headings`, `activeId`, and `hasHeadings`, so ToC consumers don't reach into tab state directly
- `src/lib/files.ts` — file lifecycle helpers shared by the palette, menus, and shortcuts: `openFile`, `openFileDialog`, `closeTab`, and `handleFileChanged` (the debounced live-reload path)
- `src/lib/ipc.ts` — typed IPC seam for the commands whose callers need to be unit-testable behind one `vi.mock("$lib/ipc")` line: on-disk preferences and user-theme discovery/import. **Deliberately not a full migration** — ~12 other ad-hoc `invoke`/`listen` call sites (`files.ts`, `commands.ts`, …) stay where they are. This is a testability seam, not an infrastructure rewrite, so don't "finish" it on sight
- `src/lib/toast.svelte.ts` — minimal toast queue. Exists because the theme-sanitize failure path has nowhere else to report: a rejected theme's `load()` cannot return an empty string to mean "failed," since that already means "no theme loaded yet" at `+page.svelte`
- `src/lib/prompt.svelte.ts` — reusable modal prompt primitive serving three flows (delete-confirm, import-collision three-way, name-this-theme) rather than three bespoke dialogs. `ask()` **never rejects** — cancel is a value via the required `cancelValue`, so call sites are a `switch` over the choice, matching this codebase's preference for discriminated results over throws (`SanitizeResult`, `DiscoveryResult`). Calls are serialized, not concurrent: a second `showModal()` on an open native `<dialog>` throws `InvalidStateError`, so a second `ask()` queues
- `src/lib/updater.svelte.ts` — auto-update state machine (`idle`/`checking`/`up-to-date`/`available`/`downloading`/`ready`/`relaunching`/`error`) over `@tauri-apps/plugin-updater`. Module-level singleton exported as `updater`. Download progress arrives as per-chunk deltas, so bytes are accumulated manually; `progress` returns `null` rather than `NaN` when Content-Length is absent. Checks are deduplicated by an in-flight promise, and the launch check is latched so HMR re-runs of the `+page.svelte` effect cannot re-trigger it. `activate()` is the single definition of what a click means at a given status (check / download / restart / no-op while busy) — both the titlebar badge in `TabBar.svelte` and the palette entry call it, so the two cannot drift. The badge requires a second click to confirm before restarting, since restarting quits the app
- `src/lib/components/Preferences.svelte` — 2-column settings panel (Cmd+,) with section navigation (appearance, layout, font) and live controls for all settings
- `src/lib/components/CommandPalette.svelte` — Cmd+K command palette with fuzzy search, keyboard navigation, drill-in sub-lists, and live theme preview via Shadow DOM
- `src/lib/components/ThemePreview.svelte` — renders a miniature theme preview inside a Shadow DOM to isolate theme CSS from the main document. Combines `base.css` + the theme's CSS + preview-only overrides, and caches the result per theme id at module level
- `src/lib/components/TabBar.svelte` — titlebar and tab strip. Reads the `tabs` singleton directly rather than taking tabs as props, and hosts the updater badge
- `src/lib/components/EmptyState.svelte` / `EmptyStateStamp.svelte` — the two no-document-open screens; both take `onOpenFile` and a `hidden` flag that drives the fade-out
- `src/lib/components/FloatingDock.svelte` — floating table-of-contents dock; headings come from the active tab via the `toc` facade in `src/lib/toc.ts`
- `src/lib/components/Toast.svelte` / `Prompt.svelte` — thin renderers over the `toast` and `prompt` singletons. `Prompt.svelte` uses a native `<dialog>` (see the serialization constraint on `prompt.svelte.ts`)
- `src/routes/+page.svelte` — the entire app UI: titlebar with draggable region (macOS overlay titlebar), tab bar with keyboard navigation and middle-click close, markdown content area with copy-code action, empty state with open-file prompt. File change events are debounced at 150ms

### Theme system (`src/lib/themes/`)
- `types.ts` — `ThemeMeta` interface: id, name, preview colors, lazy `load()` function
- `registry.ts` — **7 built-in** theme definitions (github-dark, github-light, neo-brutalist, pastel-dream, swiss-design, candy-pop, minimal-mono), each with a dynamic `import("./themes/<name>.css?raw")` loader wrapped by `builtinLoad` into the same `SanitizeResult` shape user themes resolve to — always `ok: true`, but routed through the shared shape so `theme.svelte.ts` has one code path for "apply a theme," not a builtin fast lane plus a user-theme path. The `definitions` array is `as const satisfies …`, which is what keeps `ThemeId` a union of literal ids rather than `string`; `themes` maps the generated palette on top. Index 0 is the default theme. **Preview swatches are not authored here** — see `theme-colors.ts`.

  The count is deliberately curated, not exhaustive: every extra builtin is a permanent tax on future `base.css` token changes, paid via the real-Chromium diff harness. The 15 themes previously bundled here were **moved to `/themes` at the repo root, not deleted** — they are now an importable gallery with a generated index (`pnpm gen:gallery-readme`)
- `parse-theme-css.ts` — the shared parser. Dependency-free TS so `node scripts/extract-theme-colors.ts` runs it directly (Node's type-stripping, no build step) while the same module bundles into the app for the runtime user-theme importer. Returns a Result and never throws; `assertParsed` is the throwing adapter the build uses
- `theme-colors.ts` / `theme-meta.ts` — **generated**, do not edit. `pnpm gen:theme-colors` runs `scripts/extract-theme-colors.ts`, which reads each theme's own `.app` rule and derives the three preview swatches. Previously these were hand-written next to a `load()` for a file that repeated the same hex values, with nothing keeping the two in sync. Indexing it by `ThemeId` in `registry.ts` makes a missing palette a compile error. The extractor understands both theme shapes (`--md-*` tokens, or legacy `background`/`color`) and reduces a gradient to its **last** background layer — layers paint front-to-back, so the last one is the page color
- `theme.svelte.ts` — reactive theme state exported as `themeState`, and a thin reactive shell over `user-theme.ts` for discovery/import/delete. Theme persistence is handled by `preferences.svelte.ts` (see its on-disk note above)
- `user-theme.ts` — **pure** builder turning the backend's `UserThemeFile[]` into theme metadata the app treats like any built-in. Dependency-free of Svelte/`$state` so it unit-tests trivially. Sorts by id BEFORE slug resolution so collision suffixes (`-2`, `-3`) are deterministic across launches — `read_dir` guarantees no ordering, so without the sort two colliding files could swap suffixes between runs and orphan whichever was persisted as active. Seeds `taken` with `builtinIds` so a user theme named `github-dark` becomes `github-dark-2` rather than shadowing the builtin. Every theme gets a `colors` triple, falling back to neutral gray — two consumers key their layout on its presence (`CommandPalette` gates the preview pane, `Preferences` drops the swatch row per-card and goes ragged)
- `sanitize-theme-css.ts` — **browser-only** sanitizer for untrusted theme CSS, deliberately separate from `parse-theme-css.ts` (whose Node-runnable constraint it would break, since it rests on `new CSSStyleSheet()` + `replaceSync`). Runs at INJECTION time and is not memoized internally — callers memoize by id+hash. It does five things and only five: rebuild output from `cssRules` rather than passing the input string through, strip `!important`, drop `@property`, prefix `@keyframes` names and rewrite references, and cap size at 256KB. An earlier string-rewriting design was measured to be defeated two ways in real engines; the CSSOM rebuild defeats both structurally because the input string is never consulted again. **Read the file header before adding a check to it** — it explains why the obvious extra guards (unbalanced braces, `</style>`, remote `url()`, …) are deliberately absent rather than forgotten
- `themes/*.css` — the 7 bundled theme files (the gallery's 15 live at `/themes` in the repo root). Each opens with a `/*! @name / @description / @author */` frontmatter block, which the extractor reads so `registry.ts` need not hand-author names. Injected at runtime by setting `.textContent` on a `<style id="md-theme">` node — deliberately NOT `{@html}`, which is an XSS sink for imported themes (a theme containing the style-closing sequence breaks out into live markup)
- `base.css` — structural defaults plus the **token vocabulary** (documented in-file). Layer order is `@layer base, tokens, theme, user`:
  - `base` — structure, consuming `var(--md-*, <fallback>)` where each fallback equals the pre-token value
  - `tokens` — where a theme declares `--md-*` on `.app`; `github-dark`/`github-light` are token-only and set no selectors beyond inline-code and shiki
  - `theme` — raw CSS, wins over both. The other 5 bundled themes still live here and are unaffected
  - `user` — where the sanitizer wraps imported user themes. Note the layer alone is NOT a containment boundary: a layered `!important` beats an unlayered declaration (app chrome) regardless of specificity, which is why `!important` must be stripped from user CSS

  Tokens are a **default layer, not a replacement**: 5 of the 7 bundled themes set `font-family` in raw CSS (minimal-mono in 8 places, neo-brutalist in 12), 3 set `box-shadow`, and `neo-brutalist`'s h2 accent bar is a `calc()` layout invariant. No token vocabulary captures that, so themes keep full CSS power. Only `github-dark`/`github-light` are token-only.

  Three traps when tokenizing a property in `base.css`, all found by real-browser diffing:
  - **A property that had no declaration must use `var(--md-x)` with no fallback**, not a fallback equal to the "obvious" default. `pre` had no `border-radius`; adding `8px` would have rounded 9 themes' code blocks
  - **`hr` is drawn two ways** — most themes fill the 0.25em block via `background`, but `electric-blue` and `handwritten` use `border-top` over a transparent element. A `currentColor` background fallback paints a bar behind their border
  - **Don't declare `font-family` on `pre`** — it previously inherited the UA `monospace` default, and the 20 legacy themes style `.markdown-body code`, not `pre`. The token belongs on `pre code`

  **jsdom cannot verify any of this** — it supports neither `@layer` nor `var()`, so `getComputedStyle` returns roughly what was literally declared and every cascade assertion silently passes or fails for the wrong reason. Verify in real Chromium via the already-present `playwright` dep, diffing computed styles against `git show HEAD:` for each theme (`pnpm diff:themes`).

  The same limit applies to the theme sanitizer, and there it is worse because the vitest suite *looks* complete. `pnpm test:sanitizer` exists because two of the sanitizer's five rules have no real enforcement coverage under jsdom: it has no `CSSPropertyRule` and discards `@property` before the sanitizer sees it (mutation-tested — stubbing `isPropertyRule` to `return false` leaves the whole vitest suite green), and its declaration parser silently drops `@font-face` `src: url(...)`, which two bundled themes depend on. The harness therefore asserts on a rendered outcome — what color the titlebar actually is — not on the sanitizer's output string. It runs **both** Chromium and WebKit, because they genuinely disagree: `CSS.supports("at-rule(@scope)")` is true in Chromium and false in WebKit while `@scope` works in both, which is why the sanitizer probes by parsing a fixture instead of asking `CSS.supports`.

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
- `user-themes-changed` (backend -> frontend): emitted by the themes-directory watcher armed via `watch_user_themes`, so editing an imported theme's CSS on disk live-reloads it in the app

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

- **marked** — markdown parsing, plus `marked-katex-extension`, `marked-footnote`, and `marked-emoji` (+ `gemoji` for the name table)
- **shiki** — syntax highlighting with CSS variables theme
- **dompurify** — sanitizes rendered markdown at the `renderMarkdown` choke point (`sanitize-html.ts`)
- **katex** — math rendering, `trust: false`
- **mermaid** — diagrams, lazily imported on first use
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
