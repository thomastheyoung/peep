<script lang="ts">
  import { sampleMarkdownHtml } from '$lib/sample-markdown';
</script>

<div class="exploration">
  <div class="label">14 — Minimal Mono</div>
  <div class="markdown-body">
    {@html sampleMarkdownHtml}
  </div>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap');

  .exploration {
    font-family: 'IBM Plex Mono', monospace;
    background: #fafafa;
    color: #1a1a1a;
    min-height: 100%;
    padding: 0;
  }

  .label {
    font-family: 'IBM Plex Mono', monospace;
    font-weight: 500;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 2px;
    background: #e8e8e8;
    color: #1a1a1a;
    padding: 10px 24px;
    position: sticky;
    top: 0;
    z-index: 10;
    border-bottom: 1px solid #ddd;
  }

  .markdown-body {
    max-width: 680px;
    margin: 0 auto;
    padding: 40px 32px 80px;
    line-height: 1.6;
    font-size: 14px;
    font-weight: 400;
  }

  /* Headings */
  .markdown-body :global(h1) {
    font-family: 'IBM Plex Mono', monospace;
    font-weight: 600;
    font-size: 1.5em;
    color: #1a1a1a;
    margin: 2em 0 0.6em;
    line-height: 1.3;
  }

  .markdown-body :global(h1::before) {
    content: '# ';
    color: #0066ff;
    font-weight: 400;
  }

  .markdown-body :global(h1:first-child) {
    margin-top: 0;
  }

  .markdown-body :global(h2) {
    font-family: 'IBM Plex Mono', monospace;
    font-weight: 600;
    font-size: 1.25em;
    color: #1a1a1a;
    margin: 1.8em 0 0.5em;
    line-height: 1.35;
  }

  .markdown-body :global(h2::before) {
    content: '## ';
    color: #0066ff;
    font-weight: 400;
  }

  .markdown-body :global(h3) {
    font-family: 'IBM Plex Mono', monospace;
    font-weight: 600;
    font-size: 1.1em;
    color: #1a1a1a;
    margin: 1.5em 0 0.4em;
    line-height: 1.4;
  }

  .markdown-body :global(h3::before) {
    content: '### ';
    color: #0066ff;
    font-weight: 400;
  }

  .markdown-body :global(h4) {
    font-family: 'IBM Plex Mono', monospace;
    font-weight: 600;
    font-size: 1em;
    color: #1a1a1a;
    margin: 1.4em 0 0.4em;
  }

  .markdown-body :global(h4::before) {
    content: '#### ';
    color: #0066ff;
    font-weight: 400;
  }

  .markdown-body :global(h5) {
    font-family: 'IBM Plex Mono', monospace;
    font-weight: 600;
    font-size: 0.95em;
    color: #333;
    margin: 1.2em 0 0.3em;
  }

  .markdown-body :global(h5::before) {
    content: '##### ';
    color: #0066ff;
    font-weight: 400;
  }

  .markdown-body :global(h6) {
    font-family: 'IBM Plex Mono', monospace;
    font-weight: 500;
    font-size: 0.9em;
    color: #555;
    margin: 1em 0 0.3em;
  }

  .markdown-body :global(h6::before) {
    content: '###### ';
    color: #0066ff;
    font-weight: 400;
  }

  /* Paragraphs */
  .markdown-body :global(p) {
    margin: 0 0 1em;
    line-height: 1.6;
  }

  /* Links */
  .markdown-body :global(a) {
    color: #0066ff;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .markdown-body :global(a:hover) {
    color: #0044cc;
  }

  /* Strong and emphasis */
  .markdown-body :global(strong) {
    font-weight: 600;
  }

  .markdown-body :global(em) {
    font-style: italic;
  }

  /* Code blocks */
  .markdown-body :global(pre) {
    background: #f0f0f0;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 16px 20px;
    margin: 1.2em 0;
    overflow-x: auto;
  }

  .markdown-body :global(pre code) {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 1em;
    line-height: 1.6;
    color: #1a1a1a;
    background: none;
    padding: 0;
    border: none;
    border-radius: 0;
  }

  /* Inline code */
  .markdown-body :global(code) {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 1em;
    background: #f0f0f0;
    color: #1a1a1a;
    padding: 1px 4px;
    border-radius: 2px;
  }

  /* Blockquotes */
  .markdown-body :global(blockquote) {
    border-left: 2px solid #0066ff;
    background: none;
    margin: 1.2em 0;
    padding: 4px 16px;
    color: #666;
  }

  .markdown-body :global(blockquote p) {
    margin: 0 0 0.6em;
  }

  .markdown-body :global(blockquote p:last-child) {
    margin-bottom: 0;
  }

  .markdown-body :global(blockquote blockquote) {
    margin: 0.6em 0;
    border-left-color: #99c2ff;
  }

  /* Tables */
  .markdown-body :global(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 1.2em 0;
    font-size: 0.95em;
  }

  .markdown-body :global(th) {
    color: #0066ff;
    font-weight: 600;
    text-align: left;
    padding: 6px 12px;
    border: 1px solid #ddd;
  }

  .markdown-body :global(td) {
    padding: 6px 12px;
    border: 1px solid #ddd;
  }

  .markdown-body :global(thead) {
    border-bottom: 2px solid #ddd;
  }

  /* Horizontal rules */
  .markdown-body :global(hr) {
    border: none;
    height: 1px;
    background: #ddd;
    margin: 2em 0;
  }

  /* Lists */
  .markdown-body :global(ul) {
    margin: 0.8em 0;
    padding-left: 1.5em;
    list-style: disc;
  }

  .markdown-body :global(ul li) {
    margin: 0.2em 0;
    line-height: 1.6;
  }

  .markdown-body :global(ul li::marker) {
    color: #1a1a1a;
  }

  .markdown-body :global(ol) {
    margin: 0.8em 0;
    padding-left: 1.5em;
  }

  .markdown-body :global(ol li) {
    margin: 0.2em 0;
    line-height: 1.6;
  }

  .markdown-body :global(ol li::marker) {
    color: #1a1a1a;
    font-weight: 500;
  }

  /* Nested lists */
  .markdown-body :global(ul ul),
  .markdown-body :global(ol ul),
  .markdown-body :global(ul ol),
  .markdown-body :global(ol ol) {
    margin: 0.2em 0;
  }

  /* Images */
  .markdown-body :global(img) {
    max-width: 100%;
    height: auto;
    border: 1px solid #ddd;
    border-radius: 4px;
    margin: 1em 0;
  }

  /* Definition lists */
  .markdown-body :global(dl) {
    margin: 0.8em 0;
  }

  .markdown-body :global(dt) {
    font-weight: 600;
    color: #1a1a1a;
    margin-top: 0.8em;
  }

  .markdown-body :global(dd) {
    margin-left: 1.5em;
    margin-bottom: 0.4em;
    color: #555;
  }

  /* Task lists */
  .markdown-body :global(input[type='checkbox']) {
    accent-color: #0066ff;
    margin-right: 6px;
  }

  /* Keyboard input */
  .markdown-body :global(kbd) {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.9em;
    background: #f0f0f0;
    border: 1px solid #ddd;
    border-radius: 3px;
    padding: 1px 5px;
  }

  /* Abbreviations */
  .markdown-body :global(abbr) {
    text-decoration: underline dotted #999;
    cursor: help;
  }

  /* Mark / highlight */
  .markdown-body :global(mark) {
    background: #e6f0ff;
    color: #1a1a1a;
    padding: 0 2px;
  }

  /* Superscript and subscript */
  .markdown-body :global(sup),
  .markdown-body :global(sub) {
    font-size: 0.8em;
    color: #0066ff;
  }

  /* Footnotes */
  .markdown-body :global(section.footnotes) {
    margin-top: 2.5em;
    padding-top: 1em;
    border-top: 1px solid #ddd;
    font-size: 0.9em;
    color: #666;
  }

  /* Details / Summary */
  .markdown-body :global(details) {
    margin: 0.8em 0;
    padding: 8px 12px;
    background: #f0f0f0;
    border: 1px solid #ddd;
    border-radius: 4px;
  }

  .markdown-body :global(summary) {
    cursor: pointer;
    font-weight: 600;
    color: #0066ff;
  }
</style>
