<script lang="ts">
  import { sampleMarkdownHtml } from '$lib/sample-markdown';
</script>

<div class="exploration">
  <div class="label">12 — Art Deco</div>
  <div class="markdown-body">
    {@html sampleMarkdownHtml}
  </div>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Raleway:wght@300;400;500;600&display=swap');

  .exploration {
    font-family: 'Raleway', sans-serif;
    background: #1a1a2e;
    color: #f0e6d3;
    min-height: 100%;
    padding: 0;
  }

  .label {
    font-family: 'Raleway', sans-serif;
    font-weight: 600;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 4px;
    background: #d4af37;
    color: #1a1a2e;
    padding: 12px 24px;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .markdown-body {
    max-width: 720px;
    margin: 0 auto;
    padding: 48px 32px 80px;
    line-height: 1.75;
    font-size: 16px;
    font-weight: 400;
  }

  /* Headings */
  .markdown-body :global(h1) {
    font-family: 'Playfair Display', serif;
    font-weight: 700;
    font-size: 2em;
    color: #d4af37;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    margin: 2.5em 0 0.8em;
    padding: 0.5em 0;
    border-top: 2px solid #d4af37;
    border-bottom: 2px solid #d4af37;
    text-align: center;
    line-height: 1.3;
  }

  .markdown-body :global(h1:first-child) {
    margin-top: 0;
  }

  .markdown-body :global(h2) {
    font-family: 'Playfair Display', serif;
    font-weight: 700;
    font-size: 1.5em;
    color: #d4af37;
    letter-spacing: 0.08em;
    margin: 2em 0 0.6em;
    text-align: center;
    line-height: 1.35;
  }

  .markdown-body :global(h2::before) {
    content: '◆  ';
    font-size: 0.6em;
    vertical-align: middle;
  }

  .markdown-body :global(h2::after) {
    content: '  ◆';
    font-size: 0.6em;
    vertical-align: middle;
  }

  .markdown-body :global(h3) {
    font-family: 'Playfair Display', serif;
    font-weight: 700;
    font-size: 1.2em;
    color: #f0e6d3;
    letter-spacing: 0.05em;
    margin: 1.8em 0 0.5em;
    text-transform: uppercase;
    line-height: 1.4;
  }

  .markdown-body :global(h4) {
    font-family: 'Playfair Display', serif;
    font-weight: 700;
    font-size: 1.05em;
    color: #c9a96e;
    margin: 1.5em 0 0.4em;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .markdown-body :global(h5),
  .markdown-body :global(h6) {
    font-family: 'Raleway', sans-serif;
    font-weight: 600;
    font-size: 0.9em;
    color: #c9a96e;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin: 1.2em 0 0.3em;
  }

  /* Paragraphs */
  .markdown-body :global(p) {
    margin: 0 0 1.2em;
    line-height: 1.75;
  }

  /* Links */
  .markdown-body :global(a) {
    color: #d4af37;
    text-decoration: none;
    font-variant: small-caps;
    letter-spacing: 0.04em;
    border-bottom: 1px solid #d4af3750;
    transition: border-color 0.2s;
  }

  .markdown-body :global(a:hover) {
    border-bottom-color: #d4af37;
  }

  /* Strong and emphasis */
  .markdown-body :global(strong) {
    font-weight: 600;
    color: #d4af37;
  }

  .markdown-body :global(em) {
    font-style: italic;
    color: #f0e6d3;
  }

  /* Code blocks */
  .markdown-body :global(pre) {
    background: #12122a;
    border: 1px solid #d4af37;
    border-radius: 0;
    padding: 20px 24px;
    margin: 1.5em 0;
    overflow-x: auto;
  }

  .markdown-body :global(pre code) {
    font-family: 'Courier New', monospace;
    font-size: 0.88em;
    line-height: 1.7;
    color: #c9a96e;
    background: none;
    padding: 0;
    border: none;
    border-radius: 0;
  }

  /* Inline code */
  .markdown-body :global(code) {
    font-family: 'Courier New', monospace;
    font-size: 0.88em;
    background: #12122a;
    color: #d4af37;
    padding: 2px 7px;
    border: 1px solid #d4af37;
    border-radius: 0;
  }

  /* Blockquotes */
  .markdown-body :global(blockquote) {
    border-left: 3px solid #d4af37;
    background: none;
    margin: 1.5em 0;
    padding: 4px 24px;
    font-family: 'Playfair Display', serif;
    font-style: italic;
    color: #f0e6d3;
    border-radius: 0;
  }

  .markdown-body :global(blockquote p) {
    margin: 0 0 0.6em;
  }

  .markdown-body :global(blockquote p:last-child) {
    margin-bottom: 0;
  }

  .markdown-body :global(blockquote blockquote) {
    margin: 0.8em 0;
    border-left-color: #c9a96e;
  }

  /* Tables */
  .markdown-body :global(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 1.5em 0;
    font-size: 0.95em;
    border: 1px solid #d4af37;
    border-radius: 0;
  }

  .markdown-body :global(thead) {
    background: #d4af37;
  }

  .markdown-body :global(th) {
    color: #1a1a2e;
    font-weight: 600;
    text-align: left;
    padding: 10px 14px;
    font-family: 'Raleway', sans-serif;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-size: 0.9em;
    border: 1px solid #d4af37;
  }

  .markdown-body :global(td) {
    padding: 10px 14px;
    border: 1px solid #d4af3740;
  }

  .markdown-body :global(tbody tr:hover) {
    background: #d4af3710;
  }

  /* Horizontal rules */
  .markdown-body :global(hr) {
    border: none;
    height: 1px;
    background: #d4af37;
    margin: 2.5em auto;
    position: relative;
    max-width: 400px;
  }

  .markdown-body :global(hr::before) {
    content: '◆';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #1a1a2e;
    color: #d4af37;
    padding: 0 12px;
    font-size: 14px;
  }

  /* Lists */
  .markdown-body :global(ul) {
    margin: 1em 0;
    padding-left: 1.6em;
    list-style: none;
  }

  .markdown-body :global(ul li) {
    margin: 0.5em 0;
    padding-left: 0.5em;
    position: relative;
  }

  .markdown-body :global(ul li::before) {
    content: '◆';
    color: #d4af37;
    font-size: 0.6em;
    position: absolute;
    left: -1.2em;
    top: 0.55em;
  }

  .markdown-body :global(ol) {
    margin: 1em 0;
    padding-left: 1.6em;
  }

  .markdown-body :global(ol li) {
    margin: 0.5em 0;
    padding-left: 0.3em;
  }

  .markdown-body :global(ol li::marker) {
    color: #d4af37;
    font-weight: 600;
  }

  /* Nested lists */
  .markdown-body :global(ul ul),
  .markdown-body :global(ol ul),
  .markdown-body :global(ul ol),
  .markdown-body :global(ol ol) {
    margin: 0.3em 0;
  }

  .markdown-body :global(ul ul li::before) {
    content: '◇';
  }

  /* Images */
  .markdown-body :global(img) {
    max-width: 100%;
    height: auto;
    border: 1px solid #d4af37;
    margin: 1em 0;
    border-radius: 0;
  }

  /* Definition lists */
  .markdown-body :global(dl) {
    margin: 1em 0;
  }

  .markdown-body :global(dt) {
    font-weight: 600;
    color: #d4af37;
    margin-top: 1em;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-size: 0.95em;
  }

  .markdown-body :global(dd) {
    margin-left: 1.5em;
    margin-bottom: 0.5em;
    color: #f0e6d3;
  }

  /* Task lists */
  .markdown-body :global(input[type='checkbox']) {
    accent-color: #d4af37;
    margin-right: 8px;
  }

  /* Keyboard input */
  .markdown-body :global(kbd) {
    font-family: 'Courier New', monospace;
    font-size: 0.85em;
    background: #12122a;
    border: 1px solid #d4af37;
    border-radius: 0;
    padding: 2px 6px;
    color: #d4af37;
  }

  /* Abbreviations */
  .markdown-body :global(abbr) {
    text-decoration: underline dotted #d4af37;
    cursor: help;
  }

  /* Mark / highlight */
  .markdown-body :global(mark) {
    background: #d4af3730;
    color: #f0e6d3;
    padding: 1px 4px;
    border-radius: 0;
  }

  /* Superscript and subscript */
  .markdown-body :global(sup),
  .markdown-body :global(sub) {
    font-size: 0.8em;
    color: #d4af37;
  }

  /* Footnotes */
  .markdown-body :global(section.footnotes) {
    margin-top: 3em;
    padding-top: 1.5em;
    border-top: 1px solid #d4af37;
    font-size: 0.9em;
    color: #c9a96e;
  }

  /* Details / Summary */
  .markdown-body :global(details) {
    margin: 1em 0;
    padding: 12px 16px;
    background: #12122a;
    border: 1px solid #d4af37;
    border-radius: 0;
  }

  .markdown-body :global(summary) {
    cursor: pointer;
    font-weight: 600;
    color: #d4af37;
    font-family: 'Raleway', sans-serif;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
</style>
