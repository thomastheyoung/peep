# Feature ideas

Brainstormed ideas for future peep development, grouped by theme.

## Reading experience

### Focus mode
Dim everything except the current paragraph or section. Advance with scroll or arrow keys. Great for long documents.

### Reading progress
Subtle progress bar or percentage in the titlebar. Remembers scroll position per file across sessions.

### Table of contents sidebar
Extracted from headings, click to jump, highlights the current section as you scroll.

### Backlinks / wiki links
When a directory is opened, detect `[[wiki-style]]` or relative `[links](other.md)` between files and show a backlink panel. Turns peep into a lightweight knowledge browser.

## Writing and editing adjacent

### Outline mode
Collapse and expand sections by heading level. Lets you skim the structure of long documents without scrolling.

### Word and reading time count
Small unobtrusive stat in the status area showing word count and estimated reading time.

### Presenter mode
Split markdown on `---` into slides, present fullscreen with arrow key navigation. Instant presentations from any markdown file.

## Power features

### Quick open (fuzzy file finder)
Cmd+P to fuzzy-search filenames across all `.md` files in the current directory tree. The command palette infrastructure already exists to support this.

### Multi-file search
Cmd+Shift+F to search content across all open or directory-adjacent markdown files.

### Mermaid and KaTeX rendering
Detect fenced blocks for diagrams (`mermaid`) and math (`katex` / `$$`) and render them inline. Massive value-add for technical docs.

### Custom CSS per directory
Detect a `.peep.css` file in the same directory and layer it on top of the active theme. Lets teams style their docs.

### Export
Cmd+E to export the current view as PDF or HTML using the webview's print-to-PDF or by serializing the rendered DOM.

## Polish and delight

### Smooth theme transitions
Crossfade between themes instead of instant swap. Small detail but feels premium.

### Link preview on hover
For relative markdown links, show a tooltip with the first few lines of the target file.

### Image zoom
Click images to view them in a fullscreen lightbox.

### Drag and drop
Drag `.md` files onto the window to open them, in addition to CLI and file dialog.

### Typewriter scroll
Keep the focused line vertically centered, like iA Writer.

## Creative and unusual

### Ghost mode
Transparent or translucent window that floats above other apps. Read docs while coding underneath. Tauri supports window transparency.

### Diff view
If a file is in a git repo, show a toggle to view the diff against HEAD with markdown-aware highlighting.

### Voice readback
Use macOS `say` or the Web Speech API to read the document aloud. Also an accessibility win.

### Annotation layer
Cmd+click a paragraph to add a sticky note. Stored in `.peep-notes.json` alongside the file. Non-destructive — never touches the original markdown.

## Priority picks

Highest impact relative to effort:

1. **Mermaid and KaTeX** — table-stakes for technical markdown viewers
2. **Table of contents sidebar** — expected feature, high usability payoff
3. **Drag and drop** — expected UX, low effort with Tauri
4. **Presenter mode** — genuine differentiator, no lightweight viewer does this well
