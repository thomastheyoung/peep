<script lang="ts">
  import { sampleMarkdownHtml } from '$lib/sample-markdown';
</script>

<div class="exploration">
  <div class="label">19 — Electric Blue</div>
  <div class="markdown-body">
    {@html sampleMarkdownHtml}
  </div>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Source+Code+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');

  .exploration {
    font-family: 'Source Code Pro', monospace;
    font-weight: 400;
    background: #0c1222;
    color: #c8d6e5;
    min-height: 100%;
    padding: 0;
    line-height: 1.7;
  }

  .label {
    font-family: 'Source Code Pro', monospace;
    font-weight: 700;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 2px;
    background: #3b82f6;
    color: #fff;
    padding: 12px 24px;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .markdown-body {
    max-width: 760px;
    margin: 0 auto;
    padding: 48px 32px 80px;
    font-size: 15px;
  }

  /* Headings */
  .markdown-body :global(h1) {
    font-family: 'Source Code Pro', monospace;
    font-weight: 700;
    font-size: 2em;
    color: #3b82f6;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 1.6em 0 0.5em;
    padding-bottom: 0.4em;
    border-bottom: 2px solid #3b82f6;
    line-height: 1.3;
  }

  .markdown-body :global(h1:first-child) {
    margin-top: 0;
  }

  .markdown-body :global(h2) {
    font-family: 'Source Code Pro', monospace;
    font-weight: 600;
    font-size: 1.5em;
    color: #60a5fa;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    margin: 1.4em 0 0.5em;
    line-height: 1.3;
  }

  .markdown-body :global(h3) {
    font-family: 'Source Code Pro', monospace;
    font-weight: 600;
    font-size: 1.25em;
    color: #3b82f6;
    margin: 1.3em 0 0.4em;
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  .markdown-body :global(h4) {
    font-family: 'Source Code Pro', monospace;
    font-weight: 500;
    font-size: 1.1em;
    color: #60a5fa;
    margin: 1.2em 0 0.4em;
  }

  .markdown-body :global(h5) {
    font-family: 'Source Code Pro', monospace;
    font-weight: 500;
    font-size: 1em;
    color: #3b82f6;
    margin: 1.1em 0 0.3em;
  }

  .markdown-body :global(h6) {
    font-family: 'Source Code Pro', monospace;
    font-weight: 400;
    font-size: 0.9em;
    color: #60a5fa;
    margin: 1em 0 0.3em;
    opacity: 0.7;
  }

  /* Paragraphs */
  .markdown-body :global(p) {
    margin: 0 0 1.15em;
    line-height: 1.75;
  }

  /* Strong and emphasis */
  .markdown-body :global(strong) {
    font-weight: 700;
    color: #3b82f6;
  }

  .markdown-body :global(em) {
    font-style: italic;
    color: #60a5fa;
  }

  /* Links */
  .markdown-body :global(a) {
    color: #3b82f6;
    text-decoration: underline;
    text-underline-offset: 3px;
    transition: color 0.15s ease;
  }

  .markdown-body :global(a:hover) {
    color: #60a5fa;
  }

  /* Code blocks */
  .markdown-body :global(pre) {
    background: #0a0f1e;
    border: 1px solid #3b82f6;
    border-radius: 0;
    padding: 20px 24px;
    overflow-x: auto;
    margin: 1.5em 0;
    box-shadow: 0 0 10px rgba(59, 130, 246, 0.15);
  }

  .markdown-body :global(pre code) {
    font-family: 'Source Code Pro', monospace;
    color: #10b981;
    font-size: 14px;
    line-height: 1.6;
    background: none;
    padding: 0;
    border: none;
    border-radius: 0;
    box-shadow: none;
  }

  /* Inline code */
  .markdown-body :global(code) {
    background: rgba(59, 130, 246, 0.15);
    color: #3b82f6;
    padding: 2px 8px;
    border-radius: 0;
    font-size: 0.9em;
    font-family: 'Source Code Pro', monospace;
  }

  /* Blockquotes */
  .markdown-body :global(blockquote) {
    border-left: 3px solid #3b82f6;
    background: #111827;
    padding: 16px 24px;
    margin: 1.5em 0;
    color: #60a5fa;
    border-radius: 0;
  }

  .markdown-body :global(blockquote p) {
    margin: 0 0 0.5em;
  }

  .markdown-body :global(blockquote p:last-child) {
    margin-bottom: 0;
  }

  /* Tables */
  .markdown-body :global(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 1.5em 0;
    border: 1px solid #3b82f6;
    font-family: 'Source Code Pro', monospace;
    font-size: 14px;
  }

  .markdown-body :global(thead) {
    background: #3b82f6;
  }

  .markdown-body :global(th) {
    color: #fff;
    font-weight: 700;
    padding: 10px 16px;
    text-align: left;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    font-size: 0.85em;
    border: 1px solid #3b82f6;
  }

  .markdown-body :global(td) {
    padding: 8px 16px;
    border: 1px solid rgba(59, 130, 246, 0.25);
  }

  .markdown-body :global(tbody tr:hover) {
    background: rgba(59, 130, 246, 0.05);
  }

  /* Lists */
  .markdown-body :global(ul) {
    padding-left: 24px;
    margin: 1em 0;
    list-style-type: square;
  }

  .markdown-body :global(ol) {
    padding-left: 24px;
    margin: 1em 0;
  }

  .markdown-body :global(li) {
    margin: 0.3em 0;
    line-height: 1.7;
  }

  .markdown-body :global(ul li::marker) {
    color: #3b82f6;
  }

  .markdown-body :global(ol li::marker) {
    color: #3b82f6;
    font-weight: 700;
  }

  .markdown-body :global(li > ul),
  .markdown-body :global(li > ol) {
    margin: 0.2em 0;
  }

  /* Horizontal rule */
  .markdown-body :global(hr) {
    border: none;
    border-top: 1px solid #3b82f6;
    margin: 2em 0;
  }

  /* Images */
  .markdown-body :global(img) {
    max-width: 100%;
    border: 1px solid #3b82f6;
    margin: 1em 0;
  }

  /* Definition lists */
  .markdown-body :global(dl) {
    margin: 1em 0;
  }

  .markdown-body :global(dt) {
    font-weight: 700;
    color: #3b82f6;
    margin-top: 0.8em;
    text-transform: uppercase;
    font-size: 0.9em;
    letter-spacing: 0.03em;
  }

  .markdown-body :global(dd) {
    margin-left: 24px;
    margin-bottom: 0.5em;
    color: #c8d6e5;
  }

  /* Details and summary */
  .markdown-body :global(details) {
    margin: 1em 0;
    padding: 12px 16px;
    background: #111827;
    border: 1px solid rgba(59, 130, 246, 0.3);
  }

  .markdown-body :global(summary) {
    cursor: pointer;
    color: #3b82f6;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.9em;
    letter-spacing: 0.03em;
  }

  /* Task lists */
  .markdown-body :global(input[type='checkbox']) {
    accent-color: #3b82f6;
    margin-right: 8px;
  }

  /* Keyboard */
  .markdown-body :global(kbd) {
    background: #111827;
    border: 1px solid #3b82f6;
    padding: 2px 7px;
    font-size: 0.85em;
    color: #60a5fa;
    font-family: 'Source Code Pro', monospace;
  }

  /* Mark */
  .markdown-body :global(mark) {
    background: rgba(59, 130, 246, 0.2);
    color: #60a5fa;
    padding: 1px 4px;
  }

  /* Sub / sup */
  .markdown-body :global(sub),
  .markdown-body :global(sup) {
    font-size: 0.75em;
    color: #10b981;
  }

  /* Abbreviation */
  .markdown-body :global(abbr) {
    text-decoration: underline dotted #3b82f6;
    cursor: help;
  }

  /* Footnotes */
  .markdown-body :global(.footnotes) {
    margin-top: 2em;
    padding-top: 1em;
    border-top: 1px solid rgba(59, 130, 246, 0.3);
    font-size: 0.9em;
    color: rgba(200, 214, 229, 0.6);
  }
</style>
