# Peep

A **markdown viewer** that stays out of your way. Themes are plain CSS, so *anything* you can style, you can ship — see [the gallery](./themes).

```typescript
export async function renderMarkdown(src: string): Promise<Rendered> {
  const highlighter = await getHighlighter();
  return { html: sanitizeHtml(marked.parse(src)) };
}
```

## Why themes are CSS

> A token vocabulary covers colors. It does not cover a `calc()` accent bar,
> a cursive heading, or a scanline overlay — so themes keep full CSS power.

| Surface | Sanitizer | Rebuilt from |
| --- | --- | --- |
| Markdown | DOMPurify | element corpus |
| Theme CSS | CSSOM | `cssRules` |

### Details

1. Inline `code` and `--md-*` tokens
2. Math: $E = mc^2$ renders via KaTeX
3. Emoji shortcodes :sparkles: work too

- [ ] Unchecked item
- [x] Checked item

---

Small print, a footnote[^1], and `--md-muted` text closing it out.

[^1]: Footnotes render inline at the end of the document.
