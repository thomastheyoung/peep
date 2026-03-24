<script lang="ts">
  import { sampleMarkdownHtml } from '$lib/sample-markdown';
</script>

<div class="exploration">
  <div class="label">11 — Forest Earth</div>
  <div class="markdown-body">
    {@html sampleMarkdownHtml}
  </div>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Bitter:ital,wght@0,400;0,500;0,700;1,400&family=DM+Sans:wght@400;500;700&family=Fira+Code:wght@400;500&display=swap');

  .exploration {
    font-family: 'Bitter', serif;
    background: #f5f0e8;
    color: #2d3a2e;
    min-height: 100%;
    padding: 0;
  }

  .label {
    font-family: 'DM Sans', sans-serif;
    font-weight: 700;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 2px;
    background: #4a7c59;
    color: #f5f0e8;
    padding: 12px 24px;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .markdown-body {
    max-width: 700px;
    margin: 0 auto;
    padding: 48px 32px 80px;
    line-height: 1.8;
    font-size: 16px;
  }

  /* Headings */
  .markdown-body :global(h1) {
    font-family: 'DM Sans', sans-serif;
    font-weight: 700;
    font-size: 1.8em;
    color: #4a7c59;
    margin: 2em 0 0.6em;
    padding-bottom: 0.4em;
    border-bottom: 2px solid #c4956a;
    line-height: 1.3;
  }

  .markdown-body :global(h1:first-child) {
    margin-top: 0;
  }

  .markdown-body :global(h2) {
    font-family: 'DM Sans', sans-serif;
    font-weight: 600;
    font-size: 1.4em;
    color: #8b5e3c;
    margin: 1.8em 0 0.5em;
    line-height: 1.35;
  }

  .markdown-body :global(h3) {
    font-family: 'DM Sans', sans-serif;
    font-weight: 600;
    font-size: 1.15em;
    color: #4a7c59;
    margin: 1.5em 0 0.4em;
    line-height: 1.4;
  }

  .markdown-body :global(h4) {
    font-family: 'DM Sans', sans-serif;
    font-weight: 600;
    font-size: 1em;
    color: #8b5e3c;
    margin: 1.4em 0 0.4em;
  }

  .markdown-body :global(h5),
  .markdown-body :global(h6) {
    font-family: 'DM Sans', sans-serif;
    font-weight: 600;
    font-size: 0.9em;
    color: #2d3a2e;
    margin: 1.2em 0 0.3em;
  }

  /* Paragraphs */
  .markdown-body :global(p) {
    margin: 0 0 1.2em;
    line-height: 1.8;
  }

  /* Links */
  .markdown-body :global(a) {
    color: #4a7c59;
    text-decoration: underline;
    text-underline-offset: 3px;
    text-decoration-color: #4a7c5980;
    transition: text-decoration-color 0.2s;
  }

  .markdown-body :global(a:hover) {
    text-decoration-color: #4a7c59;
  }

  /* Strong and emphasis */
  .markdown-body :global(strong) {
    font-weight: 700;
    color: #2d3a2e;
  }

  .markdown-body :global(em) {
    font-style: italic;
    color: #3d4d3e;
  }

  /* Code blocks */
  .markdown-body :global(pre) {
    background: #fefcf8;
    border-left: 3px solid #4a7c59;
    border-radius: 6px;
    padding: 20px 24px;
    margin: 1.5em 0;
    overflow-x: auto;
    box-shadow: 0 2px 8px rgba(139, 94, 60, 0.08);
  }

  .markdown-body :global(pre code) {
    font-family: 'Fira Code', monospace;
    font-size: 0.88em;
    line-height: 1.7;
    color: #2d3a2e;
    background: none;
    padding: 0;
    border-radius: 0;
  }

  /* Inline code */
  .markdown-body :global(code) {
    font-family: 'Fira Code', monospace;
    font-size: 0.88em;
    background: #e8f0e8;
    color: #4a7c59;
    padding: 2px 7px;
    border-radius: 4px;
  }

  /* Blockquotes */
  .markdown-body :global(blockquote) {
    border-left: 4px solid #8b5e3c;
    background: #faf5ee;
    margin: 1.5em 0;
    padding: 16px 24px;
    font-style: italic;
    color: #4d3a2a;
    border-radius: 0 6px 6px 0;
  }

  .markdown-body :global(blockquote p) {
    margin: 0 0 0.6em;
  }

  .markdown-body :global(blockquote p:last-child) {
    margin-bottom: 0;
  }

  .markdown-body :global(blockquote blockquote) {
    margin: 0.8em 0;
    border-left-color: #c4956a;
  }

  /* Tables */
  .markdown-body :global(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 1.5em 0;
    font-size: 0.95em;
  }

  .markdown-body :global(thead) {
    border-bottom: 2px solid #c4956a;
  }

  .markdown-body :global(th) {
    color: #4a7c59;
    font-weight: 700;
    text-align: left;
    padding: 10px 14px;
    font-family: 'DM Sans', sans-serif;
  }

  .markdown-body :global(td) {
    padding: 10px 14px;
    border-bottom: 1px solid #e0d8ce;
  }

  .markdown-body :global(tr:nth-child(even)) {
    background: #f0ece4;
  }

  .markdown-body :global(tr:nth-child(odd)) {
    background: #edf2ed;
  }

  .markdown-body :global(tbody tr:last-child td) {
    border-bottom: 2px solid #c4956a;
  }

  /* Horizontal rules */
  .markdown-body :global(hr) {
    border: none;
    height: 2px;
    background: #c4956a;
    max-width: 200px;
    margin: 2.5em auto;
  }

  /* Lists */
  .markdown-body :global(ul) {
    margin: 1em 0;
    padding-left: 1.6em;
    list-style: disc;
  }

  .markdown-body :global(ul li) {
    margin: 0.4em 0;
    padding-left: 0.3em;
  }

  .markdown-body :global(ul li::marker) {
    color: #4a7c59;
  }

  .markdown-body :global(ol) {
    margin: 1em 0;
    padding-left: 1.6em;
  }

  .markdown-body :global(ol li) {
    margin: 0.4em 0;
    padding-left: 0.3em;
  }

  .markdown-body :global(ol li::marker) {
    color: #4a7c59;
    font-weight: 600;
  }

  /* Nested lists */
  .markdown-body :global(ul ul),
  .markdown-body :global(ol ul),
  .markdown-body :global(ul ol),
  .markdown-body :global(ol ol) {
    margin: 0.3em 0;
  }

  /* Images */
  .markdown-body :global(img) {
    max-width: 100%;
    height: auto;
    border-radius: 6px;
    margin: 1em 0;
    box-shadow: 0 2px 12px rgba(139, 94, 60, 0.1);
  }

  /* Definition-like patterns and details */
  .markdown-body :global(dl) {
    margin: 1em 0;
  }

  .markdown-body :global(dt) {
    font-weight: 700;
    color: #4a7c59;
    margin-top: 1em;
  }

  .markdown-body :global(dd) {
    margin-left: 1.5em;
    margin-bottom: 0.5em;
    color: #3d4d3e;
  }

  /* Task lists */
  .markdown-body :global(input[type='checkbox']) {
    accent-color: #4a7c59;
    margin-right: 8px;
  }

  /* Keyboard input */
  .markdown-body :global(kbd) {
    font-family: 'Fira Code', monospace;
    font-size: 0.85em;
    background: #e8f0e8;
    border: 1px solid #c4d4c4;
    border-radius: 4px;
    padding: 2px 6px;
    box-shadow: 0 1px 2px rgba(45, 58, 46, 0.1);
  }

  /* Abbreviations */
  .markdown-body :global(abbr) {
    text-decoration: underline dotted #8b5e3c;
    cursor: help;
  }

  /* Mark / highlight */
  .markdown-body :global(mark) {
    background: #e8dcc8;
    color: #2d3a2e;
    padding: 1px 4px;
    border-radius: 3px;
  }

  /* Superscript and subscript */
  .markdown-body :global(sup),
  .markdown-body :global(sub) {
    font-size: 0.8em;
    color: #4a7c59;
  }

  /* Footnotes section */
  .markdown-body :global(section.footnotes) {
    margin-top: 3em;
    padding-top: 1.5em;
    border-top: 1px solid #c4956a;
    font-size: 0.9em;
    color: #5a6a5b;
  }

  /* Details / Summary */
  .markdown-body :global(details) {
    margin: 1em 0;
    padding: 12px 16px;
    background: #faf5ee;
    border-radius: 6px;
    border: 1px solid #e0d8ce;
  }

  .markdown-body :global(summary) {
    cursor: pointer;
    font-weight: 600;
    color: #4a7c59;
    font-family: 'DM Sans', sans-serif;
  }
</style>
