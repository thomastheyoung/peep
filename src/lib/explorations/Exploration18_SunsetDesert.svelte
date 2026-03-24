<script lang="ts">
  import { sampleMarkdownHtml } from '$lib/sample-markdown';
</script>

<div class="exploration">
  <div class="label">18 — Sunset Desert</div>
  <div class="markdown-body">
    {@html sampleMarkdownHtml}
  </div>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@300;400;600;700&family=Source+Sans+3:ital,wght@0,300;0,400;0,600;0,700;1,400&display=swap');

  .exploration {
    font-family: 'Source Sans 3', sans-serif;
    font-weight: 400;
    background: #fef7ed;
    color: #5c3d2e;
    min-height: 100%;
    padding: 0;
    line-height: 1.8;
  }

  .label {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 600;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 2px;
    background: #e07a5f;
    color: #fff;
    padding: 12px 24px;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .markdown-body {
    max-width: 740px;
    margin: 0 auto;
    padding: 48px 32px 80px;
    font-size: 16px;
  }

  /* Headings */
  .markdown-body :global(h1) {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 600;
    font-size: 2.4em;
    color: #e07a5f;
    margin: 1.6em 0 0.5em;
    letter-spacing: 0.02em;
    line-height: 1.2;
  }

  .markdown-body :global(h1:first-child) {
    margin-top: 0;
  }

  .markdown-body :global(h2) {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 300;
    font-size: 1.5em;
    color: #81b29a;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin: 1.5em 0 0.5em;
    line-height: 1.3;
  }

  .markdown-body :global(h3) {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 600;
    font-size: 1.3em;
    color: #5c3d2e;
    margin: 1.3em 0 0.4em;
  }

  .markdown-body :global(h4) {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 600;
    font-size: 1.1em;
    color: #e07a5f;
    margin: 1.2em 0 0.4em;
  }

  .markdown-body :global(h5) {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 400;
    font-size: 1em;
    color: #81b29a;
    margin: 1.1em 0 0.3em;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .markdown-body :global(h6) {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 300;
    font-size: 0.9em;
    color: #5c3d2e;
    margin: 1em 0 0.3em;
    opacity: 0.7;
  }

  /* Paragraphs */
  .markdown-body :global(p) {
    margin: 0 0 1.2em;
    line-height: 1.8;
  }

  /* Strong and emphasis */
  .markdown-body :global(strong) {
    font-weight: 700;
    color: #e07a5f;
  }

  .markdown-body :global(em) {
    font-style: italic;
    color: #81b29a;
  }

  /* Links */
  .markdown-body :global(a) {
    color: #81b29a;
    font-weight: 600;
    text-decoration: none;
    transition: text-decoration 0.2s ease;
  }

  .markdown-body :global(a:hover) {
    text-decoration: underline;
  }

  /* Code blocks */
  .markdown-body :global(pre) {
    background: #fffbf5;
    border-left: 4px solid #e07a5f;
    border-radius: 8px;
    padding: 20px 24px;
    overflow-x: auto;
    margin: 1.5em 0;
    box-shadow: 0 2px 12px rgba(224, 122, 95, 0.08);
  }

  .markdown-body :global(pre code) {
    font-family: 'Source Sans 3', monospace;
    color: #5c3d2e;
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
    background: #fef3c7;
    color: #5c3d2e;
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 0.9em;
    font-family: 'Source Sans 3', monospace;
  }

  /* Blockquotes */
  .markdown-body :global(blockquote) {
    border-left: 5px solid #f2cc8f;
    background: rgba(255, 251, 235, 0.5);
    padding: 16px 24px;
    margin: 1.5em 0;
    font-style: italic;
    color: #5c3d2e;
    border-radius: 0 8px 8px 0;
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
    border-collapse: separate;
    border-spacing: 0;
    margin: 1.5em 0;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid rgba(224, 122, 95, 0.25);
  }

  .markdown-body :global(thead) {
    background: #e07a5f;
  }

  .markdown-body :global(th) {
    color: #fff;
    font-weight: 600;
    padding: 12px 16px;
    text-align: left;
    font-size: 0.9em;
    font-family: 'Josefin Sans', sans-serif;
    letter-spacing: 0.03em;
  }

  .markdown-body :global(td) {
    padding: 10px 16px;
    border-top: 1px solid rgba(224, 122, 95, 0.12);
  }

  .markdown-body :global(tbody tr:nth-child(odd)) {
    background: #fef7ed;
  }

  .markdown-body :global(tbody tr:nth-child(even)) {
    background: #fff;
  }

  .markdown-body :global(tbody tr:hover) {
    background: #fef3c7;
  }

  /* Lists */
  .markdown-body :global(ul) {
    padding-left: 24px;
    margin: 1em 0;
    list-style-type: disc;
  }

  .markdown-body :global(ol) {
    padding-left: 24px;
    margin: 1em 0;
  }

  .markdown-body :global(li) {
    margin: 0.35em 0;
    line-height: 1.8;
  }

  .markdown-body :global(ul li::marker) {
    color: #e07a5f;
  }

  .markdown-body :global(ol li::marker) {
    color: #e07a5f;
    font-weight: 600;
  }

  .markdown-body :global(li > ul),
  .markdown-body :global(li > ol) {
    margin: 0.25em 0;
  }

  /* Horizontal rule */
  .markdown-body :global(hr) {
    border: none;
    height: 2px;
    background: linear-gradient(90deg, #e07a5f, #f2cc8f);
    margin: 2em 0;
    border-radius: 1px;
  }

  /* Images */
  .markdown-body :global(img) {
    max-width: 100%;
    border-radius: 10px;
    border: 1px solid rgba(224, 122, 95, 0.2);
    box-shadow: 0 4px 16px rgba(92, 61, 46, 0.08);
    margin: 1em 0;
  }

  /* Definition lists */
  .markdown-body :global(dl) {
    margin: 1em 0;
  }

  .markdown-body :global(dt) {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 600;
    color: #e07a5f;
    margin-top: 0.8em;
  }

  .markdown-body :global(dd) {
    margin-left: 24px;
    margin-bottom: 0.5em;
  }

  /* Details and summary */
  .markdown-body :global(details) {
    margin: 1em 0;
    padding: 12px 16px;
    background: #fffbf5;
    border: 1px solid rgba(242, 204, 143, 0.4);
    border-radius: 8px;
  }

  .markdown-body :global(summary) {
    cursor: pointer;
    color: #e07a5f;
    font-weight: 600;
    font-family: 'Josefin Sans', sans-serif;
  }

  /* Task lists */
  .markdown-body :global(input[type='checkbox']) {
    accent-color: #e07a5f;
    margin-right: 8px;
  }

  /* Keyboard */
  .markdown-body :global(kbd) {
    background: #fff;
    border: 1px solid rgba(224, 122, 95, 0.25);
    border-radius: 6px;
    padding: 2px 7px;
    font-size: 0.85em;
    color: #5c3d2e;
    box-shadow: 0 1px 2px rgba(92, 61, 46, 0.1);
  }

  /* Mark */
  .markdown-body :global(mark) {
    background: #fef3c7;
    color: #5c3d2e;
    padding: 1px 5px;
    border-radius: 4px;
  }

  /* Sub / sup */
  .markdown-body :global(sub),
  .markdown-body :global(sup) {
    font-size: 0.75em;
    color: #e07a5f;
  }

  /* Abbreviation */
  .markdown-body :global(abbr) {
    text-decoration: underline dotted #81b29a;
    cursor: help;
  }

  /* Footnotes */
  .markdown-body :global(.footnotes) {
    margin-top: 2em;
    padding-top: 1em;
    border-top: 1px solid rgba(224, 122, 95, 0.2);
    font-size: 0.9em;
    color: rgba(92, 61, 46, 0.7);
  }
</style>
