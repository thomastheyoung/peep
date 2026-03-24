<script lang="ts">
  import { sampleMarkdownHtml } from '$lib/sample-markdown';
</script>

<div class="exploration">
  <div class="label">06 — Pastel Dream</div>
  <div class="markdown-body">
    {@html sampleMarkdownHtml}
  </div>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700&family=Fira+Code:wght@400;500&display=swap');

  .exploration {
    font-family: 'Nunito', sans-serif;
    background: #fef9ff;
    color: #4a3f6b;
    min-height: 100%;
    padding: 0;
  }

  .label {
    font-family: 'Nunito', sans-serif;
    font-weight: 700;
    font-size: 14px;
    letter-spacing: 2px;
    text-transform: uppercase;
    background: linear-gradient(135deg, #b388ff 0%, #ff80ab 50%, #80d8ff 100%);
    color: #ffffff;
    padding: 14px 28px;
    box-shadow: 0 4px 20px rgba(179, 136, 255, 0.25);
  }

  .markdown-body {
    padding: 48px 44px;
    max-width: 780px;
    line-height: 1.8;
    font-size: 16px;
    margin: 0 auto;
  }

  /* Headings */

  .markdown-body :global(h1) {
    font-family: 'Nunito', sans-serif;
    font-weight: 700;
    font-size: 2.4em;
    background: linear-gradient(135deg, #b388ff 0%, #ff80ab 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0 0 24px 0;
    line-height: 1.3;
    letter-spacing: -0.01em;
  }

  .markdown-body :global(h2) {
    font-family: 'Nunito', sans-serif;
    font-weight: 700;
    font-size: 1.7em;
    color: #b388ff;
    margin: 40px 0 16px 0;
    line-height: 1.35;
  }

  .markdown-body :global(h3) {
    font-family: 'Nunito', sans-serif;
    font-weight: 700;
    font-size: 1.3em;
    color: #9c6eff;
    margin: 32px 0 12px 0;
    line-height: 1.4;
  }

  .markdown-body :global(h4) {
    font-family: 'Nunito', sans-serif;
    font-weight: 700;
    font-size: 1.1em;
    color: #a87fff;
    margin: 28px 0 10px 0;
  }

  .markdown-body :global(h5) {
    font-family: 'Nunito', sans-serif;
    font-weight: 700;
    font-size: 1em;
    color: #b388ff;
    margin: 24px 0 8px 0;
  }

  .markdown-body :global(h6) {
    font-family: 'Nunito', sans-serif;
    font-weight: 700;
    font-size: 0.9em;
    color: #c9a7ff;
    margin: 20px 0 8px 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* Paragraphs */

  .markdown-body :global(p) {
    margin: 0 0 18px 0;
    line-height: 1.8;
  }

  /* Strong and emphasis */

  .markdown-body :global(strong) {
    font-weight: 700;
    color: #3d3460;
  }

  .markdown-body :global(em) {
    font-style: italic;
    color: #6a5fa0;
  }

  /* Links */

  .markdown-body :global(a) {
    color: #ff80ab;
    font-weight: 700;
    text-decoration: none;
    transition: all 0.2s ease;
  }

  .markdown-body :global(a:hover) {
    text-decoration: underline;
    text-decoration-style: dotted;
    text-underline-offset: 4px;
  }

  /* Inline code */

  .markdown-body :global(code) {
    font-family: 'Fira Code', monospace;
    background: #fce4ec;
    color: #6a3d6b;
    padding: 3px 10px;
    border-radius: 12px;
    font-size: 0.88em;
    font-weight: 400;
  }

  /* Code blocks */

  .markdown-body :global(pre) {
    background: #e8f5e9;
    border: 2px solid #fce4ec;
    border-radius: 16px;
    padding: 24px 28px;
    overflow-x: auto;
    margin: 24px 0;
    box-shadow: 0 4px 20px rgba(179, 136, 255, 0.1);
  }

  .markdown-body :global(pre code) {
    font-family: 'Fira Code', monospace;
    background: transparent;
    color: #4a3f6b;
    padding: 0;
    border-radius: 0;
    font-size: 0.88em;
    line-height: 1.7;
  }

  /* Blockquotes */

  .markdown-body :global(blockquote) {
    border-left: 6px solid #b388ff;
    border-radius: 4px;
    background: rgba(243, 229, 245, 0.5);
    padding: 20px 28px;
    margin: 24px 0;
    border-top-left-radius: 16px;
    border-bottom-left-radius: 16px;
    border-top-right-radius: 16px;
    border-bottom-right-radius: 16px;
    box-shadow: 0 4px 16px rgba(179, 136, 255, 0.08);
  }

  .markdown-body :global(blockquote p) {
    margin: 0 0 8px 0;
    color: #5c4f8a;
  }

  .markdown-body :global(blockquote p:last-child) {
    margin-bottom: 0;
  }

  /* Unordered lists */

  .markdown-body :global(ul) {
    list-style: none;
    padding-left: 24px;
    margin: 16px 0;
  }

  .markdown-body :global(ul li) {
    position: relative;
    padding-left: 20px;
    margin-bottom: 10px;
    line-height: 1.7;
  }

  .markdown-body :global(ul li::before) {
    content: '';
    position: absolute;
    left: 0;
    top: 10px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #b388ff;
  }

  .markdown-body :global(ul li:nth-child(2n)::before) {
    background: #ff80ab;
  }

  .markdown-body :global(ul li:nth-child(3n)::before) {
    background: #80d8ff;
  }

  .markdown-body :global(ul li:nth-child(4n)::before) {
    background: #b9f6ca;
  }

  /* Ordered lists */

  .markdown-body :global(ol) {
    padding-left: 24px;
    margin: 16px 0;
    counter-reset: pastel-counter;
    list-style: none;
  }

  .markdown-body :global(ol li) {
    position: relative;
    padding-left: 24px;
    margin-bottom: 10px;
    line-height: 1.7;
    counter-increment: pastel-counter;
  }

  .markdown-body :global(ol li::before) {
    content: counter(pastel-counter);
    position: absolute;
    left: 0;
    top: 2px;
    width: 22px;
    height: 22px;
    background: #b388ff;
    color: #fff;
    border-radius: 50%;
    font-size: 0.72em;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .markdown-body :global(ol li:nth-child(2n)::before) {
    background: #ff80ab;
  }

  .markdown-body :global(ol li:nth-child(3n)::before) {
    background: #80d8ff;
    color: #4a3f6b;
  }

  /* Tables */

  .markdown-body :global(table) {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    margin: 24px 0;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(179, 136, 255, 0.12);
  }

  .markdown-body :global(thead) {
    background: linear-gradient(135deg, #b388ff 0%, #ff80ab 100%);
  }

  .markdown-body :global(th) {
    padding: 14px 18px;
    text-align: left;
    font-weight: 700;
    color: #ffffff;
    font-size: 0.92em;
    letter-spacing: 0.02em;
  }

  .markdown-body :global(td) {
    padding: 12px 18px;
    font-size: 0.95em;
  }

  .markdown-body :global(tbody tr:nth-child(odd)) {
    background: rgba(255, 128, 171, 0.08);
  }

  .markdown-body :global(tbody tr:nth-child(even)) {
    background: rgba(128, 216, 255, 0.08);
  }

  .markdown-body :global(tbody tr:hover) {
    background: rgba(179, 136, 255, 0.1);
  }

  /* Horizontal rule */

  .markdown-body :global(hr) {
    border: none;
    height: 3px;
    background: linear-gradient(90deg, #b388ff 0%, #ff80ab 50%, #80d8ff 100%);
    border-radius: 9999px;
    margin: 40px 0;
  }

  /* Images */

  .markdown-body :global(img) {
    max-width: 100%;
    height: auto;
    border-radius: 20px;
    box-shadow: 0 8px 30px rgba(179, 136, 255, 0.15);
    margin: 24px 0;
  }

  /* Definition lists (if any) */

  .markdown-body :global(dl) {
    margin: 16px 0;
  }

  .markdown-body :global(dt) {
    font-weight: 700;
    color: #b388ff;
    margin-top: 12px;
  }

  .markdown-body :global(dd) {
    margin-left: 24px;
    margin-bottom: 8px;
    color: #5c4f8a;
  }

  /* Keyboard input */

  .markdown-body :global(kbd) {
    font-family: 'Fira Code', monospace;
    background: #ffffff;
    border: 2px solid #e0d6f2;
    border-radius: 10px;
    padding: 2px 8px;
    font-size: 0.85em;
    box-shadow: 0 2px 4px rgba(179, 136, 255, 0.12);
  }

  /* Mark / highlight */

  .markdown-body :global(mark) {
    background: linear-gradient(135deg, rgba(179, 136, 255, 0.25), rgba(255, 128, 171, 0.25));
    padding: 2px 6px;
    border-radius: 6px;
  }

  /* Subscript & superscript */

  .markdown-body :global(sub),
  .markdown-body :global(sup) {
    font-size: 0.75em;
  }

  /* Abbreviation */

  .markdown-body :global(abbr) {
    text-decoration: underline dotted #b388ff;
    cursor: help;
  }

  /* Details / summary */

  .markdown-body :global(details) {
    background: rgba(243, 229, 245, 0.4);
    border-radius: 16px;
    padding: 16px 20px;
    margin: 16px 0;
    box-shadow: 0 2px 12px rgba(179, 136, 255, 0.08);
  }

  .markdown-body :global(summary) {
    font-weight: 700;
    color: #b388ff;
    cursor: pointer;
  }

  /* Task list checkboxes */

  .markdown-body :global(input[type='checkbox']) {
    accent-color: #b388ff;
    margin-right: 8px;
    transform: scale(1.15);
  }

  /* Nested blockquotes */

  .markdown-body :global(blockquote blockquote) {
    border-left-color: #ff80ab;
    background: rgba(252, 228, 236, 0.4);
    margin: 12px 0;
  }

  /* Footnotes */

  .markdown-body :global(.footnotes) {
    border-top: 2px solid #e8dff5;
    margin-top: 40px;
    padding-top: 20px;
    font-size: 0.9em;
    color: #7a6fa5;
  }

  /* Selection */

  .markdown-body :global(::selection) {
    background: rgba(179, 136, 255, 0.3);
    color: #3d3460;
  }
</style>
