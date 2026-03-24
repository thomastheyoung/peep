<script lang="ts">
  import { sampleMarkdownHtml } from '$lib/sample-markdown';
</script>

<div class="exploration">
  <div class="label">10 — Tropical Sunset</div>
  <div class="markdown-body">
    {@html sampleMarkdownHtml}
  </div>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,600;0,700;1,400&family=Fira+Code:wght@400;500&display=swap');

  .exploration {
    font-family: 'Poppins', sans-serif;
    background: linear-gradient(180deg, #fff7ed 0%, #fff1e6 100%);
    color: #4a2c17;
    min-height: 100%;
    padding: 0;
  }

  .label {
    font-family: 'Poppins', sans-serif;
    font-weight: 700;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 3px;
    background: linear-gradient(135deg, #f97316 0%, #ec4899 100%);
    color: #ffffff;
    padding: 13px 26px;
    box-shadow: 0 4px 16px rgba(249, 115, 22, 0.25);
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
    font-family: 'Poppins', sans-serif;
    font-weight: 700;
    font-size: 2.2em;
    background: linear-gradient(135deg, #f97316 0%, #ec4899 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0 0 24px 0;
    line-height: 1.25;
  }

  .markdown-body :global(h2) {
    font-family: 'Poppins', sans-serif;
    font-weight: 600;
    font-size: 1.6em;
    color: #f97316;
    margin: 40px 0 16px 0;
    line-height: 1.3;
  }

  .markdown-body :global(h3) {
    font-family: 'Poppins', sans-serif;
    font-weight: 600;
    font-size: 1.25em;
    color: #ea580c;
    margin: 34px 0 12px 0;
    line-height: 1.35;
  }

  .markdown-body :global(h4) {
    font-family: 'Poppins', sans-serif;
    font-weight: 600;
    font-size: 1.1em;
    color: #c2410c;
    margin: 28px 0 10px 0;
  }

  .markdown-body :global(h5) {
    font-family: 'Poppins', sans-serif;
    font-weight: 600;
    font-size: 1em;
    color: #ec4899;
    margin: 24px 0 8px 0;
  }

  .markdown-body :global(h6) {
    font-family: 'Poppins', sans-serif;
    font-weight: 600;
    font-size: 0.9em;
    color: #f97316;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin: 20px 0 8px 0;
  }

  /* Paragraphs */

  .markdown-body :global(p) {
    margin: 0 0 18px 0;
    line-height: 1.8;
  }

  /* Strong and emphasis */

  .markdown-body :global(strong) {
    font-weight: 700;
    color: #3b1f0d;
  }

  .markdown-body :global(em) {
    font-style: italic;
    color: #6b3a1f;
  }

  /* Links */

  .markdown-body :global(a) {
    color: #0ea5e9;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.2s ease;
  }

  .markdown-body :global(a:hover) {
    text-decoration: underline;
    text-underline-offset: 4px;
    text-decoration-thickness: 2px;
  }

  /* Inline code */

  .markdown-body :global(code) {
    font-family: 'Fira Code', monospace;
    background: #fff7ed;
    color: #ea580c;
    padding: 3px 10px;
    border-radius: 8px;
    font-size: 0.87em;
    border: 1px solid rgba(249, 115, 22, 0.15);
  }

  /* Code blocks */

  .markdown-body :global(pre) {
    background: #ffffff;
    border-left: 4px solid transparent;
    border-image: linear-gradient(180deg, #f97316, #ec4899) 1;
    border-radius: 12px;
    padding: 24px 28px;
    overflow-x: auto;
    margin: 24px 0;
    box-shadow: 0 4px 20px rgba(249, 115, 22, 0.08);
  }

  .markdown-body :global(pre code) {
    font-family: 'Fira Code', monospace;
    background: transparent;
    color: #4a2c17;
    padding: 0;
    border-radius: 0;
    border: none;
    font-size: 0.87em;
    line-height: 1.7;
  }

  /* Blockquotes */

  .markdown-body :global(blockquote) {
    border-left: 5px solid #f97316;
    background: #fef3c7;
    padding: 20px 24px;
    margin: 24px 0;
    border-radius: 0 14px 14px 0;
    box-shadow: 0 2px 12px rgba(249, 115, 22, 0.06);
  }

  .markdown-body :global(blockquote p) {
    color: #78350f;
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
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: #f97316;
  }

  /* Ordered lists */

  .markdown-body :global(ol) {
    padding-left: 22px;
    margin: 16px 0;
    counter-reset: sunset-counter;
    list-style: none;
  }

  .markdown-body :global(ol li) {
    position: relative;
    padding-left: 28px;
    margin-bottom: 10px;
    line-height: 1.75;
    counter-increment: sunset-counter;
  }

  .markdown-body :global(ol li::before) {
    content: counter(sunset-counter);
    position: absolute;
    left: 0;
    top: 2px;
    width: 22px;
    height: 22px;
    background: linear-gradient(135deg, #f97316, #ec4899);
    color: #ffffff;
    border-radius: 50%;
    font-size: 0.72em;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Tables */

  .markdown-body :global(table) {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    margin: 24px 0;
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(249, 115, 22, 0.1);
  }

  .markdown-body :global(thead) {
    background: linear-gradient(135deg, #f97316 0%, #ec4899 100%);
  }

  .markdown-body :global(th) {
    padding: 13px 18px;
    text-align: left;
    font-weight: 700;
    color: #ffffff;
    font-size: 0.92em;
    letter-spacing: 0.02em;
  }

  .markdown-body :global(td) {
    padding: 11px 18px;
    font-size: 0.95em;
  }

  .markdown-body :global(tbody tr:nth-child(odd)) {
    background: #ffffff;
  }

  .markdown-body :global(tbody tr:nth-child(even)) {
    background: #fff7ed;
  }

  .markdown-body :global(tbody tr:hover) {
    background: #fef3c7;
  }

  /* Horizontal rule */

  .markdown-body :global(hr) {
    border: none;
    height: 3px;
    background: linear-gradient(90deg, #f97316 0%, #ec4899 50%, #0ea5e9 100%);
    border-radius: 9999px;
    margin: 40px 0;
  }

  /* Images */

  .markdown-body :global(img) {
    max-width: 100%;
    height: auto;
    border-radius: 16px;
    box-shadow: 0 8px 28px rgba(249, 115, 22, 0.12);
    margin: 24px 0;
  }

  /* Definition lists */

  .markdown-body :global(dl) {
    margin: 16px 0;
  }

  .markdown-body :global(dt) {
    font-weight: 700;
    color: #f97316;
    margin-top: 14px;
  }

  .markdown-body :global(dd) {
    margin-left: 24px;
    margin-bottom: 8px;
    color: #78350f;
  }

  /* Keyboard input */

  .markdown-body :global(kbd) {
    font-family: 'Fira Code', monospace;
    background: #ffffff;
    border: 1px solid #fed7aa;
    border-bottom: 2px solid #fdba74;
    border-radius: 8px;
    padding: 2px 8px;
    font-size: 0.84em;
    box-shadow: 0 1px 3px rgba(249, 115, 22, 0.1);
  }

  /* Mark / highlight */

  .markdown-body :global(mark) {
    background: linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(236, 72, 153, 0.2));
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
    text-decoration: underline dotted #f97316;
    cursor: help;
  }

  /* Details / summary */

  .markdown-body :global(details) {
    background: rgba(255, 247, 237, 0.8);
    border: 1px solid rgba(249, 115, 22, 0.15);
    border-radius: 14px;
    padding: 16px 20px;
    margin: 16px 0;
    box-shadow: 0 2px 10px rgba(249, 115, 22, 0.06);
  }

  .markdown-body :global(summary) {
    font-weight: 600;
    color: #f97316;
    cursor: pointer;
  }

  /* Task list checkboxes */

  .markdown-body :global(input[type='checkbox']) {
    accent-color: #f97316;
    margin-right: 8px;
    transform: scale(1.15);
  }

  /* Nested blockquotes */

  .markdown-body :global(blockquote blockquote) {
    border-left-color: #ec4899;
    background: rgba(236, 72, 153, 0.08);
    margin: 12px 0;
  }

  /* Footnotes */

  .markdown-body :global(.footnotes) {
    border-top: 2px solid #fed7aa;
    margin-top: 40px;
    padding-top: 20px;
    font-size: 0.9em;
    color: #92400e;
  }

  /* Selection */

  .markdown-body :global(::selection) {
    background: rgba(249, 115, 22, 0.25);
    color: #3b1f0d;
  }
</style>
