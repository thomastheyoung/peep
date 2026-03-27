# Highlights

Personal collection of highlighted passages from markdown documents — "good content to remember."

## Problem

When reading markdown docs in peep, there's no way to mark passages that matter to you. You read, you close, it's gone. Users want to build a personal archive of meaningful quotes from their documents, organized over time.

## Core concepts

**Highlight:** A text selection within a rendered markdown document, visually marked with a theme-provided highlight color. Each highlight records the selected text, its anchoring data, source file path, and creation timestamp.

**Highlighter mode:** A toggle state (dock button or keypress) that turns text selections into highlights. When active, selecting text in the document creates a highlight. When inactive, text selection behaves normally (copy/paste).

**Highlight collection:** A separate view that shows all highlights grouped by creation date, regardless of source file.

## User flows

### Creating a highlight

1. User activates highlighter mode via dock button or keyboard shortcut (`Cmd+Shift+H`)
2. Dock button shows active state (highlight color glow/indicator)
3. User selects text in the document by click-dragging
4. On `mouseup`, the selection becomes a highlight — visually marked inline with the theme's highlight color
5. Highlight is persisted to the local database
6. Highlighter mode stays active (user can make multiple highlights without re-toggling)
7. User deactivates by pressing the dock button, shortcut, or `Escape`

### Viewing highlights in-document

- When a file is opened that has existing highlights, they render automatically as `<mark>` elements
- Hovering a highlight shows a subtle delete affordance (small × icon)
- Clicking the × removes the highlight from both the document and the database

### Browsing the collection

- User opens the collection view via dock button (separate from the highlighter toggle) or `Cmd+Shift+L`
- Full-page view replaces the document content area (like preferences panel)
- Highlights grouped by day (most recent first), each showing:
  - The highlighted text (quoted)
  - Source filename (clickable — opens the file and scrolls to the highlight)
  - Relative timestamp ("2 hours ago", "yesterday")
- Empty state: simple message, no highlights yet
- Delete button per highlight entry
- This is a v1 view — will be redesigned later

## Anchoring strategy

Highlights must survive file reloads. Files can change on disk (peep live-reloads). Tiered approach:

### What we store per highlight

```
id:               unique id (uuid)
file_path:        absolute path to the source file
text:             the exact highlighted text
prefix:           ~30 characters before the selection
suffix:           ~30 characters after the selection
char_offset:      character offset from document start (hint, not authoritative)
created_at:       ISO 8601 timestamp
```

### Re-anchoring on file load (in order)

1. **Exact match at offset:** Check if `text` appears at `char_offset` in the rendered text content. If yes, anchor there. Fast path for unchanged files.
2. **Exact match anywhere:** Search the full text content for `text`. If exactly one match, anchor there. Handles insertions/deletions elsewhere in the file.
3. **Context match:** Search for `prefix + text + suffix` pattern with fuzzy tolerance. Handles minor edits to surrounding text.
4. **Orphaned:** If no match, mark the highlight as orphaned. It still appears in the collection (greyed out, with a "text not found" indicator) but does not render in the document.

### On file change (live reload)

When a `file-changed` event fires and the tab re-renders, re-run the anchoring pipeline for all highlights belonging to that file. Update stored `char_offset` if the highlight re-anchored at a new position.

## Storage

**SQLite database** via Tauri's SQL plugin or a Rust-side SQLite crate (e.g., `rusqlite`). Stored in the app's data directory (`$APPDATA/peep/highlights.db`).

### Schema

```sql
CREATE TABLE highlights (
  id          TEXT PRIMARY KEY,
  file_path   TEXT NOT NULL,
  text        TEXT NOT NULL,
  prefix      TEXT NOT NULL DEFAULT '',
  suffix      TEXT NOT NULL DEFAULT '',
  char_offset INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL,

  -- for orphan tracking
  orphaned    INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_highlights_file ON highlights(file_path);
CREATE INDEX idx_highlights_date ON highlights(created_at);
```

Single table. No migrations framework needed for v1 — create on first launch.

## Theme integration

Each theme provides a `--highlight-color` CSS custom property. Themes that don't define it fall back to a sensible default.

```css
/* In base.css */
@layer base {
  .app {
    --highlight-color: rgba(255, 230, 0, 0.3);  /* default yellow */
  }
}

/* In a theme file */
@layer theme {
  .app {
    --highlight-color: rgba(168, 139, 250, 0.25);  /* purple for a dark theme */
  }
}
```

Highlighted text uses:

```css
mark.highlight {
  background-color: var(--highlight-color);
  border-radius: 2px;
  padding: 0 1px;
}

mark.highlight.orphaned {
  background-color: transparent;
  outline: 1px dashed var(--highlight-color);
  opacity: 0.5;
}
```

## Architecture

### New modules

- `src/lib/highlights.svelte.ts` — reactive highlight state. Manages highlighter mode, in-memory highlights per file, CRUD operations. Singleton via `getHighlights()` factory (same pattern as tabs, preferences)
- `src/lib/highlight-anchor.ts` — pure functions for the anchoring pipeline (no side effects, testable)
- `src/lib/components/HighlightCollection.svelte` — the collection view

### Backend additions

- New Tauri commands in `src-tauri/`: `init_highlights_db`, `save_highlight`, `delete_highlight`, `get_highlights_for_file`, `get_all_highlights`
- SQLite via `rusqlite` (already available in the Tauri ecosystem, no heavy dependency)

### Rendering approach

After markdown is rendered to HTML, apply highlights as a post-processing step:

1. Get the rendered HTML's text content (strip tags, get plain text)
2. Run the anchoring pipeline to find positions in the plain text
3. Map plain-text positions back to DOM ranges
4. Wrap matched ranges in `<mark class="highlight" data-highlight-id="...">` elements

This runs after `marked` + `shiki` processing, so it doesn't interfere with markdown rendering.

### Highlighter mode interaction

When highlighter mode is active:
- `mouseup` on the content area checks `window.getSelection()`
- If selection is non-empty and within `.markdown-body`, create a highlight
- Extract `text`, `prefix`, `suffix`, `char_offset` from the selection and surrounding text nodes
- Persist to SQLite via Tauri command
- Wrap the selection in a `<mark>` element immediately (no re-render needed)

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Cmd+Shift+H` | Toggle highlighter mode |
| `Cmd+Shift+L` | Open/close highlight collection |
| `Escape` | Exit highlighter mode (when active) |

## Scope boundary (what this is NOT)

- No multiple highlight colors (v1 is single theme-provided color)
- No highlight notes/annotations
- No export/sharing
- No search within highlights
- No cross-device sync
- No highlight categories or tags

## Decided

- **Dock layout:** Two new buttons is fine for now — can revisit if it feels crowded.
- **Overlapping highlights:** Merge overlapping selections into a single highlight. If a new selection overlaps an existing highlight, extend the existing one to cover the union.
- **Max highlight length:** No cap for v1. Revisit after beta testing if needed.
