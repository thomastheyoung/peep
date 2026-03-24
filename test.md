# Welcome to Markdown Viewer

A beautiful, fast markdown viewer built with **Tauri** + **Svelte 5**.

## Features

- Live file watching with instant re-render
- Syntax-highlighted code blocks
- Dark and light themes
- Tabbed interface for multiple files

## Code example

```typescript
async function renderMarkdown(source: string, theme: "dark" | "light") {
  const highlighter = await createHighlighter({
    themes: ["github-dark", "github-light"],
    langs: ["typescript", "rust", "python"],
  });
  return marked.parse(source);
}
```

```rust
fn main() {
    println!("Hello from Rust!");
    let numbers: Vec<i32> = (1..=10).filter(|n| n % 2 == 0).collect();
    dbg!(numbers);
}
```

## Blockquote

> "The best way to predict the future is to invent it."
> — Alan Kay

## Table

| Feature | Status |
|---------|--------|
| Markdown rendering | Done |
| Syntax highlighting | Done |
| File watching | Done |
| Themes | Done |

---

*Edit this file and watch it update live!*
