<script lang="ts">
  import { sampleMarkdownHtml } from '$lib/sample-markdown';
</script>

<div class="exploration">
  <div class="label">13 — Candy Pop</div>
  <div class="markdown-body">
    {@html sampleMarkdownHtml}
  </div>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:ital,wght@0,400;0,600;0,700;1,400&display=swap');

  .exploration {
    font-family: 'Nunito', sans-serif;
    background: #fffbfe;
    color: #4a2153;
    min-height: 100%;
    padding: 0;
  }

  .label {
    font-family: 'Fredoka', sans-serif;
    font-weight: 700;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 2px;
    background: linear-gradient(90deg, #ff6b9d, #ffd93d, #6bcb77, #4d96ff, #ff922b);
    color: #fff;
    padding: 12px 24px;
    position: sticky;
    top: 0;
    z-index: 10;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
  }

  .markdown-body {
    max-width: 740px;
    margin: 0 auto;
    padding: 48px 32px 80px;
    line-height: 1.8;
    font-size: 16px;
    font-weight: 400;
  }

  /* Headings */
  .markdown-body :global(h1) {
    font-family: 'Fredoka', sans-serif;
    font-weight: 700;
    font-size: 2.5em;
    background: linear-gradient(90deg, #ff6b9d, #ffd93d, #6bcb77, #4d96ff, #ff922b);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 1.5em 0 0.6em;
    line-height: 1.2;
  }

  .markdown-body :global(h1:first-child) {
    margin-top: 0;
  }

  .markdown-body :global(h2) {
    font-family: 'Fredoka', sans-serif;
    font-weight: 600;
    font-size: 1.7em;
    color: #ff6b9d;
    margin: 1.8em 0 0.5em;
    padding-bottom: 0.3em;
    border-bottom: 3px solid #ffd93d;
    line-height: 1.3;
  }

  .markdown-body :global(h3) {
    font-family: 'Fredoka', sans-serif;
    font-weight: 600;
    font-size: 1.3em;
    color: #4d96ff;
    margin: 1.5em 0 0.4em;
    line-height: 1.35;
  }

  .markdown-body :global(h4) {
    font-family: 'Fredoka', sans-serif;
    font-weight: 600;
    font-size: 1.1em;
    color: #6bcb77;
    margin: 1.3em 0 0.4em;
  }

  .markdown-body :global(h5) {
    font-family: 'Fredoka', sans-serif;
    font-weight: 600;
    font-size: 1em;
    color: #ff922b;
    margin: 1.2em 0 0.3em;
  }

  .markdown-body :global(h6) {
    font-family: 'Fredoka', sans-serif;
    font-weight: 500;
    font-size: 0.95em;
    color: #ff6b9d;
    margin: 1em 0 0.3em;
  }

  /* Paragraphs */
  .markdown-body :global(p) {
    margin: 0 0 1.2em;
    line-height: 1.8;
  }

  /* Links */
  .markdown-body :global(a) {
    color: #4d96ff;
    font-weight: 700;
    text-decoration: underline;
    text-decoration-style: wavy;
    text-decoration-color: #4d96ff80;
    text-underline-offset: 3px;
    transition: text-decoration-color 0.2s;
  }

  .markdown-body :global(a:hover) {
    text-decoration-color: #4d96ff;
    color: #ff6b9d;
  }

  /* Strong and emphasis */
  .markdown-body :global(strong) {
    font-weight: 700;
    color: #4a2153;
  }

  .markdown-body :global(em) {
    font-style: italic;
    color: #6a3173;
  }

  /* Code blocks */
  .markdown-body :global(pre) {
    background: #fffde7;
    border: 2px dashed #ff6b9d;
    border-radius: 20px;
    padding: 24px 28px;
    margin: 1.5em 0;
    overflow-x: auto;
  }

  .markdown-body :global(pre code) {
    font-family: 'Courier New', monospace;
    font-size: 0.88em;
    line-height: 1.7;
    color: #4a2153;
    background: none;
    padding: 0;
    border: none;
    border-radius: 0;
  }

  /* Inline code */
  .markdown-body :global(code) {
    font-family: 'Courier New', monospace;
    font-size: 0.88em;
    background: #e3f2fd;
    color: #4d96ff;
    padding: 3px 8px;
    border-radius: 12px;
    font-weight: 700;
  }

  /* Blockquotes */
  .markdown-body :global(blockquote) {
    border-left: 4px solid transparent;
    border-image: linear-gradient(180deg, #ff6b9d, #ffd93d, #6bcb77, #4d96ff, #ff922b) 1;
    background: #fce4ec;
    margin: 1.5em 0;
    padding: 20px 24px;
    border-radius: 0 16px 16px 0;
    color: #4a2153;
  }

  .markdown-body :global(blockquote p) {
    margin: 0 0 0.6em;
  }

  .markdown-body :global(blockquote p:last-child) {
    margin-bottom: 0;
  }

  .markdown-body :global(blockquote blockquote) {
    margin: 0.8em 0;
    background: #f8bbd0;
  }

  /* Tables */
  .markdown-body :global(table) {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    margin: 1.5em 0;
    font-size: 0.95em;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 16px rgba(74, 33, 83, 0.08);
  }

  .markdown-body :global(th:nth-child(5n + 1)) {
    background: #ff6b9d;
  }

  .markdown-body :global(th:nth-child(5n + 2)) {
    background: #ffd93d;
  }

  .markdown-body :global(th:nth-child(5n + 3)) {
    background: #6bcb77;
  }

  .markdown-body :global(th:nth-child(5n + 4)) {
    background: #4d96ff;
  }

  .markdown-body :global(th:nth-child(5n + 5)) {
    background: #ff922b;
  }

  .markdown-body :global(th) {
    color: #fff;
    font-weight: 700;
    text-align: left;
    padding: 12px 16px;
    font-family: 'Fredoka', sans-serif;
  }

  .markdown-body :global(td) {
    padding: 10px 16px;
    background: #fff;
    border-bottom: 1px solid #f0e0f5;
  }

  /* Horizontal rules */
  .markdown-body :global(hr) {
    border: none;
    height: 4px;
    background: linear-gradient(90deg, #ff6b9d, #ffd93d, #6bcb77, #4d96ff, #ff922b);
    margin: 2.5em 0;
    border-radius: 4px;
  }

  /* Lists */
  .markdown-body :global(ul) {
    margin: 1em 0;
    padding-left: 1.6em;
    list-style: disc;
  }

  .markdown-body :global(ul li) {
    margin: 0.5em 0;
    padding-left: 0.3em;
  }

  .markdown-body :global(ul > li:nth-child(5n + 1)::marker) {
    color: #ff6b9d;
  }

  .markdown-body :global(ul > li:nth-child(5n + 2)::marker) {
    color: #ffd93d;
  }

  .markdown-body :global(ul > li:nth-child(5n + 3)::marker) {
    color: #6bcb77;
  }

  .markdown-body :global(ul > li:nth-child(5n + 4)::marker) {
    color: #4d96ff;
  }

  .markdown-body :global(ul > li:nth-child(5n + 5)::marker) {
    color: #ff922b;
  }

  .markdown-body :global(ol) {
    margin: 1em 0;
    padding-left: 1.6em;
  }

  .markdown-body :global(ol li) {
    margin: 0.5em 0;
    padding-left: 0.3em;
  }

  .markdown-body :global(ol > li:nth-child(5n + 1)::marker) {
    color: #ff6b9d;
    font-weight: 700;
  }

  .markdown-body :global(ol > li:nth-child(5n + 2)::marker) {
    color: #ffd93d;
    font-weight: 700;
  }

  .markdown-body :global(ol > li:nth-child(5n + 3)::marker) {
    color: #6bcb77;
    font-weight: 700;
  }

  .markdown-body :global(ol > li:nth-child(5n + 4)::marker) {
    color: #4d96ff;
    font-weight: 700;
  }

  .markdown-body :global(ol > li:nth-child(5n + 5)::marker) {
    color: #ff922b;
    font-weight: 700;
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
    border-radius: 20px;
    margin: 1em 0;
    box-shadow: 0 6px 20px rgba(74, 33, 83, 0.12);
  }

  /* Definition lists */
  .markdown-body :global(dl) {
    margin: 1em 0;
  }

  .markdown-body :global(dt) {
    font-weight: 700;
    color: #ff6b9d;
    font-family: 'Fredoka', sans-serif;
    margin-top: 1em;
  }

  .markdown-body :global(dd) {
    margin-left: 1.5em;
    margin-bottom: 0.5em;
    color: #6a3173;
  }

  /* Task lists */
  .markdown-body :global(input[type='checkbox']) {
    accent-color: #ff6b9d;
    margin-right: 8px;
    width: 18px;
    height: 18px;
  }

  /* Keyboard input */
  .markdown-body :global(kbd) {
    font-family: 'Nunito', sans-serif;
    font-size: 0.85em;
    background: #f3e5f5;
    border: 2px solid #ff6b9d;
    border-radius: 12px;
    padding: 2px 8px;
    color: #4a2153;
    font-weight: 700;
  }

  /* Abbreviations */
  .markdown-body :global(abbr) {
    text-decoration: underline dotted #ff6b9d;
    cursor: help;
  }

  /* Mark / highlight */
  .markdown-body :global(mark) {
    background: #ffd93d80;
    color: #4a2153;
    padding: 2px 6px;
    border-radius: 8px;
  }

  /* Superscript and subscript */
  .markdown-body :global(sup),
  .markdown-body :global(sub) {
    font-size: 0.8em;
    color: #ff6b9d;
    font-weight: 700;
  }

  /* Footnotes */
  .markdown-body :global(section.footnotes) {
    margin-top: 3em;
    padding-top: 1.5em;
    border-top: 3px solid;
    border-image: linear-gradient(90deg, #ff6b9d, #ffd93d, #6bcb77, #4d96ff, #ff922b) 1;
    font-size: 0.9em;
    color: #6a3173;
  }

  /* Details / Summary */
  .markdown-body :global(details) {
    margin: 1em 0;
    padding: 16px 20px;
    background: #f3e5f5;
    border-radius: 20px;
    border: 2px dashed #6bcb77;
  }

  .markdown-body :global(summary) {
    cursor: pointer;
    font-weight: 700;
    color: #ff6b9d;
    font-family: 'Fredoka', sans-serif;
  }
</style>
