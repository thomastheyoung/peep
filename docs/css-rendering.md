# CSS rendering decisions

Intentional CSS choices that improve visual quality. Each property is here for a reason — don't remove them without understanding why they exist.

## Global (body)

### `-webkit-font-smoothing: antialiased`

WebKit defaults to subpixel antialiasing, which renders text heavier than native macOS apps. `antialiased` uses grayscale AA instead, matching the weight of system UI in Finder, Notes, and other native apps. Since Tauri uses WebKit on macOS, this is always in effect.

Paired with `-moz-osx-font-smoothing: grayscale` for Firefox compatibility (not relevant in Tauri but harmless).

### `text-rendering: optimizeLegibility`

Enables kerning and optional ligatures. The browser optimizes for visual quality over rendering speed. The performance cost is negligible for our use case (static rendered markdown, not live-typing).

## Markdown body

### `text-wrap: pretty`

CSS Text Level 4. The browser considers the entire paragraph when deciding line breaks, rather than the default greedy per-line algorithm. The main effect: avoids orphaned single words on the last line of a paragraph. Produces more balanced ragged-right edges.

Supported in WebKit and Blink. Falls back silently to `wrap` in unsupported browsers.

### `hanging-punctuation: first allow-end last`

Lets opening quotes and list markers "hang" outside the text block's left margin, so the actual letterforms align flush left. `allow-end` lets trailing punctuation hang past the right margin to avoid short last lines caused by a period or comma.

This is what professional typesetting software does — it creates an optically cleaner margin.

## Tables

### `font-variant-numeric: tabular-nums`

Forces equal-width digits so columns of numbers align vertically. Without this, proportional figures (the default) cause jagged number columns. Only affects digits — letters remain proportional.

## Code blocks

### `overscroll-behavior-x: contain`

Prevents horizontal scroll in a code block from propagating to the parent (which would scroll the page). Without this, reaching the end of a long code line and continuing to scroll can unexpectedly bounce or navigate the main content.

### `tab-size: 4`

Renders tab characters as 4 spaces wide instead of the browser default of 8. Matches the convention in most editors and avoids excessively wide indentation in pasted code.

### `-webkit-overflow-scrolling: touch`

Enables momentum (inertial) scrolling for horizontally-overflowing code blocks on touch devices. Without this, scrolling feels "sticky" and stops immediately when you lift your finger.

## Content area

### `scroll-behavior: smooth`

Animates programmatic scrolls (e.g., clicking anchor links in the table of contents). Does not affect user-initiated scroll via trackpad or mouse wheel.

### `overscroll-behavior-y: contain`

Prevents scroll chaining — when you reach the bottom of the content area, the scroll event doesn't propagate to the window (which on macOS would trigger the rubber-band bounce or navigate back).

### `scrollbar-gutter: stable`

Reserves space for the scrollbar track even when content doesn't overflow. Prevents a ~8px layout shift when switching between short documents (no scrollbar) and long documents (scrollbar appears).

## Task lists

### `accent-color: var(--md-accent)`

Themes native checkbox rendering to match the current theme's accent color. Without this, checkboxes use the browser's default blue regardless of theme.

## Selection

### `::selection` with `color-mix(in oklab, ...)`

Text selection uses the theme's accent color at 30% opacity. `color-mix(in oklab, ...)` blends in the OKLAB perceptual color space, producing visually uniform results across all themes without needing per-theme overrides.

## Images

### `height: auto`

Paired with `max-width: 100%`, this preserves the image's aspect ratio when it's constrained by the container width. Without `height: auto`, browsers may render a squished image if the HTML has explicit width/height attributes.
