<script lang="ts">
  import { sampleMarkdownHtml } from '$lib/sample-markdown';
</script>

<div class="exploration">
  <div class="label">07 — Swiss Design</div>
  <div class="markdown-body">
    {@html sampleMarkdownHtml}
  </div>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=Bebas+Neue&family=Fira+Code:wght@400;500&display=swap');

  .exploration {
    font-family: 'Inter', sans-serif;
    background: #ffffff;
    color: #111111;
    min-height: 100%;
    padding: 0;
  }

  .label {
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 4px;
    background: #ff0000;
    color: #ffffff;
    padding: 12px 24px;
  }

  .markdown-body {
    padding: 48px 40px;
    max-width: 800px;
    line-height: 1.7;
    font-size: 16px;
    margin: 0 auto;
  }

  /* Headings */

  .markdown-body :global(h1) {
    font-family: 'Bebas Neue', 'Inter', sans-serif;
    font-weight: 900;
    font-size: 3em;
    color: #111111;
    letter-spacing: -0.03em;
    line-height: 1.1;
    margin: 0 0 28px 0;
    border: none;
  }

  .markdown-body :global(h2) {
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    font-size: 1.3em;
    color: #ff0000;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin: 44px 0 16px 0;
    line-height: 1.3;
  }

  .markdown-body :global(h3) {
    font-family: 'Inter', sans-serif;
    font-weight: 400;
    font-size: 1.15em;
    color: #111111;
    margin: 36px 0 12px 0;
    padding-left: 16px;
    border-left: 4px solid #ff0000;
    line-height: 1.4;
  }

  .markdown-body :global(h4) {
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    font-size: 1em;
    color: #333333;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin: 32px 0 10px 0;
  }

  .markdown-body :global(h5) {
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    font-size: 0.9em;
    color: #ff0000;
    letter-spacing: 0.05em;
    margin: 28px 0 8px 0;
  }

  .markdown-body :global(h6) {
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    font-size: 0.8em;
    color: #666666;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    margin: 24px 0 8px 0;
  }

  /* Paragraphs */

  .markdown-body :global(p) {
    margin: 0 0 16px 0;
    line-height: 1.7;
  }

  /* Strong and emphasis */

  .markdown-body :global(strong) {
    font-weight: 700;
    color: #000000;
  }

  .markdown-body :global(em) {
    font-style: italic;
  }

  /* Links */

  .markdown-body :global(a) {
    color: #ff0000;
    text-decoration: none;
    transition: text-decoration 0.15s ease;
  }

  .markdown-body :global(a:hover) {
    text-decoration: underline;
    text-decoration-thickness: 2px;
    text-underline-offset: 3px;
    text-decoration-color: #ff0000;
  }

  /* Inline code */

  .markdown-body :global(code) {
    font-family: 'Fira Code', monospace;
    color: #ff0000;
    font-weight: 700;
    font-size: 0.88em;
    background: transparent;
    padding: 0;
  }

  /* Code blocks */

  .markdown-body :global(pre) {
    background: #f5f5f5;
    border: 1px solid #e0e0e0;
    border-radius: 0;
    padding: 24px 28px;
    overflow-x: auto;
    margin: 24px 0;
  }

  .markdown-body :global(pre code) {
    font-family: 'Fira Code', monospace;
    color: #111111;
    font-weight: 400;
    font-size: 0.88em;
    line-height: 1.65;
    background: transparent;
    padding: 0;
  }

  /* Blockquotes */

  .markdown-body :global(blockquote) {
    border-left: 5px solid #ff0000;
    background: transparent;
    padding: 4px 0 4px 24px;
    margin: 24px 0;
  }

  .markdown-body :global(blockquote p) {
    font-size: 1.1em;
    color: #111111;
    margin-bottom: 8px;
    line-height: 1.7;
  }

  .markdown-body :global(blockquote p:last-child) {
    margin-bottom: 0;
  }

  /* Unordered lists */

  .markdown-body :global(ul) {
    list-style: none;
    padding-left: 20px;
    margin: 16px 0;
  }

  .markdown-body :global(ul li) {
    position: relative;
    padding-left: 20px;
    margin-bottom: 6px;
    line-height: 1.65;
  }

  .markdown-body :global(ul li::before) {
    content: '';
    position: absolute;
    left: 0;
    top: 9px;
    width: 8px;
    height: 8px;
    background: #ff0000;
  }

  /* Ordered lists */

  .markdown-body :global(ol) {
    padding-left: 20px;
    margin: 16px 0;
    counter-reset: swiss-counter;
    list-style: none;
  }

  .markdown-body :global(ol li) {
    position: relative;
    padding-left: 28px;
    margin-bottom: 6px;
    line-height: 1.65;
    counter-increment: swiss-counter;
  }

  .markdown-body :global(ol li::before) {
    content: counter(swiss-counter) '.';
    position: absolute;
    left: 0;
    top: 0;
    font-weight: 900;
    color: #ff0000;
    font-size: 0.95em;
    font-family: 'Inter', sans-serif;
  }

  /* Tables */

  .markdown-body :global(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 24px 0;
    font-size: 0.95em;
  }

  .markdown-body :global(thead) {
    border-bottom: 3px solid #ff0000;
  }

  .markdown-body :global(th) {
    padding: 10px 16px;
    text-align: left;
    font-weight: 700;
    color: #111111;
    font-size: 0.88em;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .markdown-body :global(td) {
    padding: 10px 16px;
    border-bottom: 1px solid #dddddd;
  }

  .markdown-body :global(tbody tr:hover) {
    background: #f5f5f5;
  }

  /* Horizontal rule */

  .markdown-body :global(hr) {
    border: none;
    height: 2px;
    background: #ff0000;
    margin: 40px 0;
  }

  /* Images */

  .markdown-body :global(img) {
    max-width: 100%;
    height: auto;
    margin: 24px 0;
    border: 1px solid #e0e0e0;
  }

  /* Definition lists */

  .markdown-body :global(dl) {
    margin: 16px 0;
  }

  .markdown-body :global(dt) {
    font-weight: 700;
    color: #111111;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-size: 0.9em;
    margin-top: 16px;
  }

  .markdown-body :global(dd) {
    margin-left: 0;
    padding-left: 20px;
    border-left: 3px solid #ff0000;
    margin-bottom: 8px;
    color: #333333;
  }

  /* Keyboard input */

  .markdown-body :global(kbd) {
    font-family: 'Fira Code', monospace;
    background: #f5f5f5;
    border: 1px solid #cccccc;
    border-bottom: 2px solid #aaaaaa;
    border-radius: 0;
    padding: 2px 7px;
    font-size: 0.84em;
  }

  /* Mark / highlight */

  .markdown-body :global(mark) {
    background: rgba(255, 0, 0, 0.12);
    padding: 1px 4px;
  }

  /* Subscript & superscript */

  .markdown-body :global(sub),
  .markdown-body :global(sup) {
    font-size: 0.75em;
  }

  /* Abbreviation */

  .markdown-body :global(abbr) {
    text-decoration: underline dotted #ff0000;
    cursor: help;
  }

  /* Details / summary */

  .markdown-body :global(details) {
    border: 1px solid #e0e0e0;
    border-left: 4px solid #ff0000;
    padding: 16px 20px;
    margin: 16px 0;
  }

  .markdown-body :global(summary) {
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-size: 0.92em;
    cursor: pointer;
    color: #111111;
  }

  /* Task list checkboxes */

  .markdown-body :global(input[type='checkbox']) {
    accent-color: #ff0000;
    margin-right: 8px;
    transform: scale(1.1);
  }

  /* Nested blockquotes */

  .markdown-body :global(blockquote blockquote) {
    border-left-color: #333333;
    margin: 12px 0;
  }

  /* Footnotes */

  .markdown-body :global(.footnotes) {
    border-top: 2px solid #111111;
    margin-top: 48px;
    padding-top: 20px;
    font-size: 0.88em;
    color: #333333;
  }

  /* Selection */

  .markdown-body :global(::selection) {
    background: rgba(255, 0, 0, 0.2);
    color: #111111;
  }
</style>
