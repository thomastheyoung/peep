/**
 * Raw markdown (not pre-rendered HTML) so theme stories exercise the real
 * `renderMarkdown` pipeline — marked + shiki — exactly as the app does.
 * Contrast with `$lib/sample-markdown`, which is frozen HTML with inline
 * colors, suitable only for the static design explorations.
 */
export const sampleDoc = `# Welcome to peep

A fast markdown viewer built with **Tauri** and **Svelte 5**. This paragraph has
*emphasis*, \`inline code\`, and a [hyperlink](#) to exercise inline styles.

## Features

- Live file watching with instant re-render
- Syntax-highlighted code blocks
- 22 themes, switchable from the command palette
- Tabbed interface for multiple files

### Getting started

1. Download the latest release
2. Install it to your Applications folder
3. Run \`peep readme.md\` from a terminal

> Themes control code colors through CSS custom properties, so syntax
> highlighting stays consistent with the surrounding page.

## Code example

\`\`\`typescript
async function renderMarkdown(source: string) {
  const highlighter = await createHighlighter({
    themes: ["css-variables"],
    langs: ["typescript", "rust"],
  });
  return marked.parse(source);
}
\`\`\`

| Shortcut | Action           |
| -------- | ---------------- |
| \`Cmd+K\`  | Command palette  |
| \`Cmd+O\`  | Open file        |
| \`Cmd+,\`  | Preferences      |

---

Final paragraph, to show spacing after a horizontal rule.
`;
