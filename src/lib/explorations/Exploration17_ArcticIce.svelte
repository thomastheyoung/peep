<script lang="ts">
  import { sampleMarkdownHtml } from '$lib/sample-markdown';
</script>

<div class="exploration">
  <div class="label">17 — Arctic Ice</div>
  <div class="markdown-body">
    {@html sampleMarkdownHtml}
  </div>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');

  .exploration {
    font-family: 'Outfit', sans-serif;
    font-weight: 400;
    background: #f0f7ff;
    color: #1e3a5f;
    min-height: 100%;
    padding: 0;
    line-height: 1.7;
  }

  .label {
    font-weight: 700;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 2px;
    background: #0284c7;
    color: #fff;
    padding: 12px 24px;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .markdown-body {
    max-width: 720px;
    margin: 0 auto;
    padding: 48px 32px 80px;
    font-size: 16px;
  }

  /* Headings */
  .markdown-body :global(h1) {
    font-weight: 700;
    font-size: 2.2em;
    color: #1e3a5f;
    margin: 1.6em 0 0.5em;
    padding-bottom: 0.4em;
    border-bottom: 2px solid #bae6fd;
    line-height: 1.2;
    text-shadow: 0 1px 2px rgba(2, 132, 199, 0.06);
  }

  .markdown-body :global(h1:first-child) {
    margin-top: 0;
  }

  .markdown-body :global(h2) {
    font-weight: 500;
    font-size: 1.7em;
    color: #0284c7;
    margin: 1.4em 0 0.5em;
    line-height: 1.3;
  }

  .markdown-body :global(h3) {
    font-weight: 600;
    font-size: 1.3em;
    color: #1e3a5f;
    margin: 1.3em 0 0.4em;
  }

  .markdown-body :global(h4) {
    font-weight: 600;
    font-size: 1.1em;
    color: #0284c7;
    margin: 1.2em 0 0.4em;
  }

  .markdown-body :global(h5) {
    font-weight: 600;
    font-size: 1em;
    color: #1e3a5f;
    margin: 1.1em 0 0.3em;
  }

  .markdown-body :global(h6) {
    font-weight: 500;
    font-size: 0.9em;
    color: #0284c7;
    margin: 1em 0 0.3em;
    opacity: 0.8;
  }

  /* Paragraphs */
  .markdown-body :global(p) {
    margin: 0 0 1.15em;
    line-height: 1.8;
  }

  /* Strong and emphasis */
  .markdown-body :global(strong) {
    font-weight: 700;
    color: #1e3a5f;
  }

  .markdown-body :global(em) {
    font-style: italic;
    color: #0284c7;
  }

  /* Links */
  .markdown-body :global(a) {
    color: #0284c7;
    text-decoration: none;
    transition: text-decoration-color 0.2s ease;
  }

  .markdown-body :global(a:hover) {
    text-decoration: underline;
    text-decoration-color: #7dd3fc;
  }

  /* Code blocks */
  .markdown-body :global(pre) {
    background: #fff;
    border: 1px solid #bae6fd;
    border-radius: 10px;
    padding: 20px 24px;
    overflow-x: auto;
    margin: 1.5em 0;
    box-shadow: 0 2px 12px rgba(2, 132, 199, 0.08);
  }

  .markdown-body :global(pre code) {
    font-family: 'Outfit', monospace;
    color: #1e3a5f;
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
    background: #e0f2fe;
    color: #0284c7;
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 0.9em;
    font-family: 'Outfit', monospace;
  }

  /* Blockquotes */
  .markdown-body :global(blockquote) {
    border-left: 4px solid #0284c7;
    background: #f0f9ff;
    padding: 16px 24px;
    margin: 1.5em 0;
    border-radius: 0 10px 10px 0;
    color: #1e3a5f;
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
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #bae6fd;
    box-shadow: 0 2px 8px rgba(2, 132, 199, 0.06);
  }

  .markdown-body :global(thead) {
    background: #0284c7;
  }

  .markdown-body :global(th) {
    color: #fff;
    font-weight: 600;
    padding: 12px 16px;
    text-align: left;
    font-size: 0.9em;
    letter-spacing: 0.03em;
  }

  .markdown-body :global(td) {
    padding: 10px 16px;
    border-top: 1px solid #e0f2fe;
  }

  .markdown-body :global(tbody tr:nth-child(even)) {
    background: #f8fbff;
  }

  .markdown-body :global(tbody tr:hover) {
    background: #e0f2fe;
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
    line-height: 1.7;
  }

  .markdown-body :global(ul li::marker) {
    color: #0284c7;
  }

  .markdown-body :global(ol li::marker) {
    color: #0284c7;
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
    background: linear-gradient(90deg, #bae6fd, #0284c7, #bae6fd);
    margin: 2em 0;
    border-radius: 1px;
  }

  /* Images */
  .markdown-body :global(img) {
    max-width: 100%;
    border-radius: 12px;
    border: 1px solid #bae6fd;
    box-shadow: 0 4px 16px rgba(2, 132, 199, 0.1);
    margin: 1em 0;
  }

  /* Definition lists */
  .markdown-body :global(dl) {
    margin: 1em 0;
  }

  .markdown-body :global(dt) {
    font-weight: 700;
    color: #1e3a5f;
    margin-top: 0.8em;
  }

  .markdown-body :global(dd) {
    margin-left: 24px;
    margin-bottom: 0.5em;
    color: #3b6b94;
  }

  /* Details and summary */
  .markdown-body :global(details) {
    margin: 1em 0;
    padding: 12px 16px;
    background: #fff;
    border: 1px solid #bae6fd;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(2, 132, 199, 0.06);
  }

  .markdown-body :global(summary) {
    cursor: pointer;
    color: #0284c7;
    font-weight: 500;
  }

  /* Task lists */
  .markdown-body :global(input[type='checkbox']) {
    accent-color: #0284c7;
    margin-right: 8px;
  }

  /* Keyboard */
  .markdown-body :global(kbd) {
    background: #fff;
    border: 1px solid #bae6fd;
    border-radius: 6px;
    padding: 2px 7px;
    font-size: 0.85em;
    color: #1e3a5f;
    box-shadow: 0 1px 2px rgba(2, 132, 199, 0.1);
  }

  /* Mark */
  .markdown-body :global(mark) {
    background: #bae6fd;
    color: #1e3a5f;
    padding: 1px 5px;
    border-radius: 4px;
  }

  /* Sub / sup */
  .markdown-body :global(sub),
  .markdown-body :global(sup) {
    font-size: 0.75em;
    color: #0284c7;
  }

  /* Abbreviation */
  .markdown-body :global(abbr) {
    text-decoration: underline dotted #7dd3fc;
    cursor: help;
  }

  /* Footnotes */
  .markdown-body :global(.footnotes) {
    margin-top: 2em;
    padding-top: 1em;
    border-top: 1px solid #bae6fd;
    font-size: 0.9em;
    color: #3b6b94;
  }
</style>
