<script lang="ts">
  import { sampleMarkdownHtml } from '$lib/sample-markdown';
</script>

<div class="exploration">
  <div class="label">08 — Ink Brush</div>
  <div class="markdown-body">
    {@html sampleMarkdownHtml}
  </div>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,300;0,400;0,600;0,700;1,400&family=Noto+Serif+Display:wght@300;600&family=Fira+Code:wght@400&display=swap');

  .exploration {
    font-family: 'Noto Serif', serif;
    background: #faf8f5;
    color: #2c2c2c;
    min-height: 100%;
    padding: 0;
  }

  .label {
    font-family: 'Noto Serif', serif;
    font-weight: 600;
    font-size: 12px;
    letter-spacing: 4px;
    text-transform: uppercase;
    background: #2c2c2c;
    color: #faf8f5;
    padding: 12px 24px;
    border-bottom: 2px solid #c62828;
  }

  .markdown-body {
    padding: 48px 40px;
    max-width: 620px;
    line-height: 2.0;
    font-size: 16px;
    margin: 48px auto 0 auto;
  }

  /* Headings */

  .markdown-body :global(h1) {
    font-family: 'Noto Serif Display', 'Noto Serif', serif;
    font-weight: 300;
    font-size: 2.4em;
    color: #2c2c2c;
    margin: 0 0 32px 0;
    line-height: 1.3;
    position: relative;
    letter-spacing: -0.01em;
  }

  .markdown-body :global(h1::after) {
    content: '';
    position: absolute;
    right: -16px;
    top: 4px;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: radial-gradient(circle, #c62828 40%, rgba(198, 40, 40, 0.15) 60%, transparent 70%);
    opacity: 0.7;
  }

  .markdown-body :global(h2) {
    font-family: 'Noto Serif Display', 'Noto Serif', serif;
    font-weight: 600;
    font-size: 1.5em;
    color: #2c2c2c;
    margin: 48px 0 16px 0;
    padding-bottom: 12px;
    line-height: 1.35;
    position: relative;
  }

  .markdown-body :global(h2::after) {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 60px;
    height: 2px;
    background: #c62828;
  }

  .markdown-body :global(h3) {
    font-family: 'Noto Serif', serif;
    font-weight: 600;
    font-size: 1.2em;
    color: #2c2c2c;
    margin: 40px 0 12px 0;
    line-height: 1.4;
  }

  .markdown-body :global(h4) {
    font-family: 'Noto Serif', serif;
    font-weight: 600;
    font-size: 1.05em;
    color: #444444;
    margin: 32px 0 10px 0;
  }

  .markdown-body :global(h5) {
    font-family: 'Noto Serif', serif;
    font-weight: 600;
    font-size: 0.95em;
    color: #555555;
    margin: 28px 0 8px 0;
  }

  .markdown-body :global(h6) {
    font-family: 'Noto Serif', serif;
    font-weight: 400;
    font-size: 0.88em;
    color: #888888;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin: 24px 0 8px 0;
  }

  /* Paragraphs */

  .markdown-body :global(p) {
    margin: 0 0 20px 0;
    line-height: 2.0;
  }

  /* Strong and emphasis */

  .markdown-body :global(strong) {
    font-weight: 700;
    color: #1a1a1a;
  }

  .markdown-body :global(em) {
    font-style: italic;
    color: #4a4a4a;
  }

  /* Links */

  .markdown-body :global(a) {
    color: #c62828;
    text-decoration: none;
    transition: text-decoration 0.2s ease;
  }

  .markdown-body :global(a:hover) {
    text-decoration: underline;
    text-underline-offset: 4px;
    text-decoration-thickness: 1px;
  }

  /* Inline code */

  .markdown-body :global(code) {
    font-family: 'Fira Code', monospace;
    background: #f2efeb;
    color: #c62828;
    padding: 2px 8px;
    border-radius: 3px;
    font-size: 0.86em;
  }

  /* Code blocks */

  .markdown-body :global(pre) {
    background: #ffffff;
    border-left: 2px solid #2c2c2c;
    border-radius: 0;
    padding: 24px 28px;
    overflow-x: auto;
    margin: 28px 0;
    box-shadow: 0 2px 12px rgba(44, 44, 44, 0.06);
  }

  .markdown-body :global(pre code) {
    font-family: 'Fira Code', monospace;
    background: transparent;
    color: #2c2c2c;
    padding: 0;
    border-radius: 0;
    font-size: 0.86em;
    line-height: 1.8;
  }

  /* Blockquotes */

  .markdown-body :global(blockquote) {
    border-left: none;
    background: transparent;
    padding: 8px 0 8px 40px;
    margin: 28px 0;
    position: relative;
    font-style: italic;
  }

  .markdown-body :global(blockquote::before) {
    content: '\201C';
    position: absolute;
    left: 0;
    top: -8px;
    font-size: 3.5em;
    color: #c62828;
    font-family: 'Noto Serif Display', 'Noto Serif', serif;
    line-height: 1;
    opacity: 0.7;
  }

  .markdown-body :global(blockquote p) {
    color: #6b6b6b;
    font-style: italic;
    margin-bottom: 8px;
    line-height: 1.9;
  }

  .markdown-body :global(blockquote p:last-child) {
    margin-bottom: 0;
  }

  /* Unordered lists */

  .markdown-body :global(ul) {
    list-style: none;
    padding-left: 20px;
    margin: 20px 0;
  }

  .markdown-body :global(ul li) {
    position: relative;
    padding-left: 20px;
    margin-bottom: 10px;
    line-height: 1.9;
  }

  .markdown-body :global(ul li::before) {
    content: '';
    position: absolute;
    left: 0;
    top: 11px;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #c62828;
  }

  /* Ordered lists */

  .markdown-body :global(ol) {
    padding-left: 20px;
    margin: 20px 0;
    counter-reset: ink-counter;
    list-style: none;
  }

  .markdown-body :global(ol li) {
    position: relative;
    padding-left: 28px;
    margin-bottom: 10px;
    line-height: 1.9;
    counter-increment: ink-counter;
  }

  .markdown-body :global(ol li::before) {
    content: counter(ink-counter);
    position: absolute;
    left: 0;
    top: 1px;
    font-family: 'Noto Serif Display', 'Noto Serif', serif;
    font-weight: 300;
    font-size: 1.1em;
    color: #c62828;
  }

  /* Tables */

  .markdown-body :global(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 28px 0;
    font-size: 0.95em;
  }

  .markdown-body :global(thead) {
    border-bottom: 2px solid #e0d8ce;
  }

  .markdown-body :global(th) {
    padding: 10px 14px;
    text-align: left;
    font-weight: 600;
    color: #2c2c2c;
    font-size: 0.9em;
  }

  .markdown-body :global(td) {
    padding: 10px 14px;
    border-bottom: 1px solid #e0d8ce;
  }

  .markdown-body :global(tbody tr:last-child td) {
    border-bottom: 2px solid #e0d8ce;
  }

  .markdown-body :global(tbody tr:hover) {
    background: rgba(250, 248, 245, 0.8);
  }

  /* Horizontal rule */

  .markdown-body :global(hr) {
    border: none;
    height: 1px;
    background: linear-gradient(90deg, transparent 0%, #c0b8a8 15%, #c0b8a8 85%, transparent 100%);
    margin: 64px 0;
  }

  /* Images */

  .markdown-body :global(img) {
    max-width: 100%;
    height: auto;
    margin: 28px 0;
    box-shadow: 0 4px 20px rgba(44, 44, 44, 0.08);
  }

  /* Definition lists */

  .markdown-body :global(dl) {
    margin: 20px 0;
  }

  .markdown-body :global(dt) {
    font-weight: 600;
    color: #2c2c2c;
    margin-top: 16px;
    font-size: 0.95em;
  }

  .markdown-body :global(dd) {
    margin-left: 24px;
    margin-bottom: 8px;
    color: #555555;
    line-height: 1.9;
  }

  /* Keyboard input */

  .markdown-body :global(kbd) {
    font-family: 'Fira Code', monospace;
    background: #faf8f5;
    border: 1px solid #d8d0c4;
    border-radius: 3px;
    padding: 2px 7px;
    font-size: 0.84em;
    box-shadow: 0 1px 2px rgba(44, 44, 44, 0.08);
  }

  /* Mark / highlight */

  .markdown-body :global(mark) {
    background: rgba(198, 40, 40, 0.1);
    padding: 1px 4px;
  }

  /* Subscript & superscript */

  .markdown-body :global(sub),
  .markdown-body :global(sup) {
    font-size: 0.75em;
  }

  /* Abbreviation */

  .markdown-body :global(abbr) {
    text-decoration: underline dotted #c62828;
    cursor: help;
  }

  /* Details / summary */

  .markdown-body :global(details) {
    border-bottom: 1px solid #e0d8ce;
    padding: 16px 0;
    margin: 16px 0;
  }

  .markdown-body :global(summary) {
    font-weight: 600;
    cursor: pointer;
    color: #2c2c2c;
  }

  /* Task list checkboxes */

  .markdown-body :global(input[type='checkbox']) {
    accent-color: #c62828;
    margin-right: 8px;
    transform: scale(1.05);
  }

  /* Nested blockquotes */

  .markdown-body :global(blockquote blockquote) {
    padding-left: 32px;
    margin: 12px 0;
  }

  .markdown-body :global(blockquote blockquote::before) {
    font-size: 2.5em;
    color: #999999;
  }

  /* Footnotes */

  .markdown-body :global(.footnotes) {
    border-top: 1px solid #e0d8ce;
    margin-top: 48px;
    padding-top: 24px;
    font-size: 0.88em;
    color: #6b6b6b;
  }

  /* Selection */

  .markdown-body :global(::selection) {
    background: rgba(198, 40, 40, 0.15);
    color: #2c2c2c;
  }
</style>
