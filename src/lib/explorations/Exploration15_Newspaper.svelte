<script lang="ts">
  import { sampleMarkdownHtml } from '$lib/sample-markdown';
</script>

<div class="exploration">
  <div class="label">15 — Newspaper</div>
  <div class="markdown-body">
    {@html sampleMarkdownHtml}
  </div>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap');

  .exploration {
    font-family: 'Lora', serif;
    background: #fdf8ef;
    color: #222222;
    min-height: 100%;
    padding: 0;
  }

  .label {
    font-family: 'Playfair Display', serif;
    font-weight: 700;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 3px;
    background: #8b0000;
    color: #fdf8ef;
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
    font-size: 16.5px;
    font-weight: 400;
    text-align: left;
  }

  /* Headings */
  .markdown-body :global(h1) {
    font-family: 'Playfair Display', serif;
    font-weight: 900;
    font-size: 3em;
    color: #8b0000;
    margin: 1.5em 0 0.4em;
    text-align: center;
    line-height: 1.1;
    padding-bottom: 0.3em;
    border-bottom: 3px double #222;
  }

  .markdown-body :global(h1:first-child) {
    margin-top: 0;
  }

  .markdown-body :global(h2) {
    font-family: 'Playfair Display', serif;
    font-weight: 700;
    font-size: 1.4em;
    color: #222;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin: 2em 0 0.5em;
    padding-bottom: 0.3em;
    border-bottom: 1px solid #222;
    line-height: 1.3;
  }

  .markdown-body :global(h3) {
    font-family: 'Lora', serif;
    font-weight: 500;
    font-style: italic;
    font-size: 1.2em;
    color: #333;
    margin: 1.5em 0 0.4em;
    line-height: 1.4;
  }

  .markdown-body :global(h4) {
    font-family: 'Playfair Display', serif;
    font-weight: 700;
    font-size: 1.05em;
    color: #8b0000;
    margin: 1.4em 0 0.4em;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .markdown-body :global(h5) {
    font-family: 'Lora', serif;
    font-weight: 600;
    font-size: 1em;
    color: #555;
    margin: 1.2em 0 0.3em;
    font-style: italic;
  }

  .markdown-body :global(h6) {
    font-family: 'Lora', serif;
    font-weight: 600;
    font-size: 0.9em;
    color: #666;
    margin: 1em 0 0.3em;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  /* Paragraphs — first paragraph lede style */
  .markdown-body :global(p) {
    margin: 0 0 1.1em;
    line-height: 1.75;
    text-align: justify;
    hyphens: auto;
  }

  .markdown-body :global(h1 + p),
  .markdown-body :global(h2 + p) {
    font-size: 1.1em;
    line-height: 1.8;
  }

  .markdown-body :global(h1 + p::first-line) {
    font-variant: small-caps;
    font-weight: 600;
    font-size: 1.05em;
  }

  /* Links */
  .markdown-body :global(a) {
    color: #8b0000;
    text-decoration: none;
    transition: text-decoration 0.2s;
  }

  .markdown-body :global(a:hover) {
    text-decoration: underline;
  }

  /* Strong and emphasis */
  .markdown-body :global(strong) {
    font-weight: 700;
    color: #111;
  }

  .markdown-body :global(em) {
    font-style: italic;
  }

  /* Code blocks */
  .markdown-body :global(pre) {
    background: #f5f0e4;
    border: 1px solid #d0c8b8;
    border-radius: 2px;
    padding: 18px 22px;
    margin: 1.5em 0;
    overflow-x: auto;
  }

  .markdown-body :global(pre code) {
    font-family: 'Courier Prime', 'Courier New', monospace;
    font-size: 0.88em;
    line-height: 1.7;
    color: #333;
    background: none;
    padding: 0;
    border: none;
  }

  /* Inline code */
  .markdown-body :global(code) {
    font-family: 'Courier Prime', 'Courier New', monospace;
    font-size: 0.9em;
    color: #8b0000;
    background: none;
    padding: 0;
  }

  /* Blockquotes */
  .markdown-body :global(blockquote) {
    border-left: none;
    margin: 1.8em 0;
    padding: 8px 24px 8px 48px;
    position: relative;
    font-style: italic;
    color: #333;
  }

  .markdown-body :global(blockquote::before) {
    content: '\201C';
    font-family: 'Playfair Display', serif;
    font-size: 3.5em;
    font-weight: 900;
    color: #8b0000;
    position: absolute;
    left: 0;
    top: -8px;
    line-height: 1;
  }

  .markdown-body :global(blockquote p) {
    margin: 0 0 0.6em;
    text-align: left;
  }

  .markdown-body :global(blockquote p:last-child) {
    margin-bottom: 0;
  }

  .markdown-body :global(blockquote blockquote) {
    margin: 0.8em 0;
    padding-left: 32px;
  }

  .markdown-body :global(blockquote blockquote::before) {
    font-size: 2em;
    color: #b85050;
    top: -4px;
  }

  /* Tables */
  .markdown-body :global(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 1.5em 0;
    font-size: 0.93em;
    border-top: 2px solid #222;
    border-bottom: 2px solid #222;
  }

  .markdown-body :global(thead) {
    border-bottom: 1px solid #222;
  }

  .markdown-body :global(th) {
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    text-align: left;
    padding: 8px 14px;
    font-size: 0.85em;
    font-family: 'Playfair Display', serif;
  }

  .markdown-body :global(td) {
    padding: 8px 14px;
    border-bottom: 1px solid #ddd;
  }

  .markdown-body :global(tbody tr:last-child td) {
    border-bottom: none;
  }

  /* Horizontal rules */
  .markdown-body :global(hr) {
    border: none;
    border-top: 1px solid #222;
    border-bottom: 1px solid #222;
    height: 3px;
    margin: 2.5em auto;
    max-width: 300px;
  }

  /* Lists */
  .markdown-body :global(ul) {
    margin: 1em 0;
    padding-left: 2em;
    list-style: disc;
  }

  .markdown-body :global(ul li) {
    margin: 0.4em 0;
    padding-left: 0.3em;
    line-height: 1.7;
  }

  .markdown-body :global(ul li::marker) {
    color: #222;
  }

  .markdown-body :global(ol) {
    margin: 1em 0;
    padding-left: 2em;
  }

  .markdown-body :global(ol li) {
    margin: 0.4em 0;
    padding-left: 0.3em;
    line-height: 1.7;
  }

  .markdown-body :global(ol li::marker) {
    color: #222;
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
    border: 1px solid #d0c8b8;
    margin: 1.2em 0;
  }

  /* Definition lists */
  .markdown-body :global(dl) {
    margin: 1em 0;
  }

  .markdown-body :global(dt) {
    font-weight: 700;
    color: #222;
    margin-top: 1em;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    font-size: 0.9em;
    font-family: 'Playfair Display', serif;
  }

  .markdown-body :global(dd) {
    margin-left: 2em;
    margin-bottom: 0.5em;
    color: #444;
  }

  /* Task lists */
  .markdown-body :global(input[type='checkbox']) {
    accent-color: #8b0000;
    margin-right: 8px;
  }

  /* Keyboard input */
  .markdown-body :global(kbd) {
    font-family: 'Courier Prime', monospace;
    font-size: 0.85em;
    background: #f5f0e4;
    border: 1px solid #d0c8b8;
    border-radius: 2px;
    padding: 1px 5px;
  }

  /* Abbreviations */
  .markdown-body :global(abbr) {
    text-decoration: underline dotted #8b0000;
    cursor: help;
  }

  /* Mark / highlight */
  .markdown-body :global(mark) {
    background: #fce8b2;
    color: #222;
    padding: 1px 3px;
  }

  /* Superscript and subscript */
  .markdown-body :global(sup),
  .markdown-body :global(sub) {
    font-size: 0.8em;
    color: #8b0000;
  }

  /* Footnotes */
  .markdown-body :global(section.footnotes) {
    margin-top: 3em;
    padding-top: 1.5em;
    border-top: 2px solid #222;
    font-size: 0.88em;
    color: #555;
  }

  /* Details / Summary */
  .markdown-body :global(details) {
    margin: 1em 0;
    padding: 12px 16px;
    background: #f5f0e4;
    border: 1px solid #d0c8b8;
    border-radius: 2px;
  }

  .markdown-body :global(summary) {
    cursor: pointer;
    font-weight: 700;
    color: #8b0000;
    font-family: 'Playfair Display', serif;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-size: 0.9em;
  }

  /* Drop cap for first paragraph after h1 */
  .markdown-body :global(h1 + p::first-letter) {
    font-family: 'Playfair Display', serif;
    font-weight: 900;
    font-size: 3.5em;
    float: left;
    line-height: 0.8;
    margin: 0.05em 0.1em 0 0;
    color: #8b0000;
  }
</style>
