<script lang="ts">
  import { sampleMarkdownHtml } from '$lib/sample-markdown';
</script>

<div class="exploration">
  <div class="label">09 — Cosmic Purple</div>
  <div class="markdown-body">
    {@html sampleMarkdownHtml}
  </div>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');

  .exploration {
    font-family: 'Outfit', sans-serif;
    background: #0f0720;
    background-image: radial-gradient(ellipse at 50% 40%, #1a0d3a 0%, #0f0720 70%);
    color: #e8dff5;
    min-height: 100%;
    padding: 0;
  }

  .label {
    font-family: 'Space Mono', monospace;
    font-weight: 700;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 4px;
    background: linear-gradient(135deg, #1a0d3a 0%, #2d1660 100%);
    color: #c084fc;
    padding: 12px 24px;
    border-bottom: 1px solid rgba(192, 132, 252, 0.3);
  }

  .markdown-body {
    padding: 48px 44px;
    max-width: 780px;
    line-height: 1.8;
    font-size: 16px;
    margin: 0 auto;
    border: 1px solid rgba(192, 132, 252, 0.2);
    border-top: none;
    box-shadow: 0 0 60px rgba(192, 132, 252, 0.1);
  }

  /* Headings */

  .markdown-body :global(h1) {
    font-family: 'Outfit', sans-serif;
    font-weight: 700;
    font-size: 2.5em;
    color: #c084fc;
    margin: 0 0 28px 0;
    line-height: 1.2;
    text-shadow: 0 0 40px rgba(192, 132, 252, 0.3);
  }

  .markdown-body :global(h2) {
    font-family: 'Outfit', sans-serif;
    font-weight: 600;
    font-size: 1.7em;
    color: #f472b6;
    margin: 44px 0 16px 0;
    line-height: 1.3;
    text-shadow: 0 0 30px rgba(244, 114, 182, 0.2);
  }

  .markdown-body :global(h3) {
    font-family: 'Outfit', sans-serif;
    font-weight: 600;
    font-size: 1.3em;
    color: #c084fc;
    margin: 36px 0 12px 0;
    line-height: 1.4;
  }

  .markdown-body :global(h4) {
    font-family: 'Outfit', sans-serif;
    font-weight: 600;
    font-size: 1.1em;
    color: #d8b4fe;
    margin: 32px 0 10px 0;
  }

  .markdown-body :global(h5) {
    font-family: 'Outfit', sans-serif;
    font-weight: 600;
    font-size: 1em;
    color: #f472b6;
    margin: 28px 0 8px 0;
  }

  .markdown-body :global(h6) {
    font-family: 'Outfit', sans-serif;
    font-weight: 500;
    font-size: 0.9em;
    color: #a78bfa;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin: 24px 0 8px 0;
  }

  /* Paragraphs */

  .markdown-body :global(p) {
    margin: 0 0 18px 0;
    line-height: 1.8;
    color: #e8dff5;
  }

  /* Strong and emphasis */

  .markdown-body :global(strong) {
    font-weight: 700;
    color: #f5f0ff;
  }

  .markdown-body :global(em) {
    font-style: italic;
    color: #d8b4fe;
  }

  /* Links */

  .markdown-body :global(a) {
    color: #67e8f9;
    text-decoration: none;
    transition: all 0.2s ease;
  }

  .markdown-body :global(a:hover) {
    text-shadow: 0 0 12px rgba(103, 232, 249, 0.5);
    color: #a5f3fc;
  }

  /* Inline code */

  .markdown-body :global(code) {
    font-family: 'Space Mono', monospace;
    background: rgba(192, 132, 252, 0.2);
    color: #d8b4fe;
    padding: 3px 9px;
    border-radius: 6px;
    font-size: 0.86em;
  }

  /* Code blocks */

  .markdown-body :global(pre) {
    background: #140a2e;
    border: 1px solid rgba(192, 132, 252, 0.3);
    border-radius: 12px;
    padding: 24px 28px;
    overflow-x: auto;
    margin: 24px 0;
    box-shadow: 0 0 30px rgba(192, 132, 252, 0.08);
  }

  .markdown-body :global(pre code) {
    font-family: 'Space Mono', monospace;
    background: transparent;
    color: #e8dff5;
    padding: 0;
    border-radius: 0;
    font-size: 0.86em;
    line-height: 1.7;
  }

  /* Blockquotes */

  .markdown-body :global(blockquote) {
    border-left: 4px solid transparent;
    border-image: linear-gradient(180deg, #c084fc, #f472b6) 1;
    background: rgba(192, 132, 252, 0.08);
    padding: 20px 24px;
    margin: 24px 0;
    border-radius: 0 12px 12px 0;
    font-style: italic;
  }

  .markdown-body :global(blockquote p) {
    color: #d8b4fe;
    margin-bottom: 8px;
  }

  .markdown-body :global(blockquote p:last-child) {
    margin-bottom: 0;
  }

  /* Unordered lists */

  .markdown-body :global(ul) {
    list-style: none;
    padding-left: 22px;
    margin: 16px 0;
  }

  .markdown-body :global(ul li) {
    position: relative;
    padding-left: 20px;
    margin-bottom: 10px;
    line-height: 1.75;
  }

  .markdown-body :global(ul li::before) {
    content: '';
    position: absolute;
    left: 0;
    top: 10px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #c084fc;
    box-shadow: 0 0 8px rgba(192, 132, 252, 0.5);
  }

  /* Ordered lists */

  .markdown-body :global(ol) {
    padding-left: 22px;
    margin: 16px 0;
    counter-reset: cosmic-counter;
    list-style: none;
  }

  .markdown-body :global(ol li) {
    position: relative;
    padding-left: 28px;
    margin-bottom: 10px;
    line-height: 1.75;
    counter-increment: cosmic-counter;
  }

  .markdown-body :global(ol li::before) {
    content: counter(cosmic-counter);
    position: absolute;
    left: 0;
    top: 2px;
    width: 22px;
    height: 22px;
    background: rgba(192, 132, 252, 0.25);
    color: #c084fc;
    border-radius: 50%;
    font-size: 0.72em;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Space Mono', monospace;
    border: 1px solid rgba(192, 132, 252, 0.4);
  }

  /* Tables */

  .markdown-body :global(table) {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    margin: 24px 0;
    border: 1px solid rgba(192, 132, 252, 0.2);
    border-radius: 12px;
    overflow: hidden;
  }

  .markdown-body :global(thead) {
    background: rgba(192, 132, 252, 0.15);
  }

  .markdown-body :global(th) {
    padding: 12px 16px;
    text-align: left;
    font-weight: 700;
    color: #c084fc;
    font-size: 0.9em;
    letter-spacing: 0.03em;
    border-bottom: 1px solid rgba(192, 132, 252, 0.3);
  }

  .markdown-body :global(td) {
    padding: 10px 16px;
    border-bottom: 1px solid rgba(192, 132, 252, 0.1);
    font-size: 0.95em;
  }

  .markdown-body :global(tbody tr:nth-child(even)) {
    background: rgba(244, 114, 182, 0.04);
  }

  .markdown-body :global(tbody tr:hover) {
    background: rgba(192, 132, 252, 0.08);
  }

  /* Horizontal rule */

  .markdown-body :global(hr) {
    border: none;
    height: 2px;
    background: linear-gradient(90deg, #c084fc 0%, #f472b6 50%, #67e8f9 100%);
    border-radius: 9999px;
    margin: 40px 0;
    box-shadow: 0 0 20px rgba(192, 132, 252, 0.3);
  }

  /* Images */

  .markdown-body :global(img) {
    max-width: 100%;
    height: auto;
    border-radius: 12px;
    border: 1px solid rgba(192, 132, 252, 0.2);
    box-shadow: 0 0 30px rgba(192, 132, 252, 0.1);
    margin: 24px 0;
  }

  /* Definition lists */

  .markdown-body :global(dl) {
    margin: 16px 0;
  }

  .markdown-body :global(dt) {
    font-weight: 700;
    color: #c084fc;
    margin-top: 14px;
  }

  .markdown-body :global(dd) {
    margin-left: 24px;
    margin-bottom: 8px;
    color: #c9b8e8;
  }

  /* Keyboard input */

  .markdown-body :global(kbd) {
    font-family: 'Space Mono', monospace;
    background: #1a0d3a;
    border: 1px solid rgba(192, 132, 252, 0.3);
    border-radius: 6px;
    padding: 2px 8px;
    font-size: 0.84em;
    color: #d8b4fe;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  /* Mark / highlight */

  .markdown-body :global(mark) {
    background: rgba(192, 132, 252, 0.3);
    color: #f5f0ff;
    padding: 2px 6px;
    border-radius: 4px;
  }

  /* Subscript & superscript */

  .markdown-body :global(sub),
  .markdown-body :global(sup) {
    font-size: 0.75em;
  }

  /* Abbreviation */

  .markdown-body :global(abbr) {
    text-decoration: underline dotted #c084fc;
    cursor: help;
  }

  /* Details / summary */

  .markdown-body :global(details) {
    background: rgba(192, 132, 252, 0.06);
    border: 1px solid rgba(192, 132, 252, 0.2);
    border-radius: 12px;
    padding: 16px 20px;
    margin: 16px 0;
  }

  .markdown-body :global(summary) {
    font-weight: 600;
    color: #c084fc;
    cursor: pointer;
  }

  /* Task list checkboxes */

  .markdown-body :global(input[type='checkbox']) {
    accent-color: #c084fc;
    margin-right: 8px;
    transform: scale(1.1);
  }

  /* Nested blockquotes */

  .markdown-body :global(blockquote blockquote) {
    border-image: linear-gradient(180deg, #f472b6, #67e8f9) 1;
    background: rgba(244, 114, 182, 0.06);
    margin: 12px 0;
  }

  /* Footnotes */

  .markdown-body :global(.footnotes) {
    border-top: 1px solid rgba(192, 132, 252, 0.2);
    margin-top: 40px;
    padding-top: 20px;
    font-size: 0.88em;
    color: #a78bfa;
  }

  /* Selection */

  .markdown-body :global(::selection) {
    background: rgba(192, 132, 252, 0.4);
    color: #f5f0ff;
  }
</style>
