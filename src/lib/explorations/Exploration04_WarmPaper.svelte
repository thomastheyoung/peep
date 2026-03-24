<script lang="ts">
  import { sampleMarkdownHtml } from '$lib/sample-markdown';
</script>

<div class="exploration">
  <div class="label">04 — Warm Paper</div>
  <div class="markdown-body">
    {@html sampleMarkdownHtml}
  </div>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;1,300;1,400&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap');

  .exploration {
    font-family: 'Merriweather', Georgia, serif;
    background: #fdf6ec;
    color: #3d3229;
    min-height: 100%;
    padding: 0;
  }

  .label {
    font-family: 'Playfair Display', serif;
    font-weight: 500;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 4px;
    background: #3d3229;
    color: #fdf6ec;
    padding: 14px 28px;
    border-bottom: 2px solid #c0392b;
  }

  .markdown-body {
    padding: 56px 48px;
    max-width: 640px;
    margin: 0 auto;
    line-height: 1.9;
    font-size: 16px;
    font-weight: 400;
  }

  /* Headings */
  .markdown-body :global(h1) {
    font-family: 'Playfair Display', serif;
    font-weight: 700;
    font-size: 36px;
    color: #2c241d;
    border-bottom: 1px solid #d4c5a9;
    padding-bottom: 16px;
    margin-top: 56px;
    margin-bottom: 28px;
    line-height: 1.3;
    letter-spacing: -0.3px;
  }

  .markdown-body :global(h2) {
    font-family: 'Playfair Display', serif;
    font-weight: 500;
    font-style: italic;
    font-size: 26px;
    color: #3d3229;
    margin-top: 44px;
    margin-bottom: 18px;
    line-height: 1.35;
  }

  .markdown-body :global(h3) {
    font-family: 'Playfair Display', serif;
    font-weight: 600;
    font-size: 20px;
    color: #3d3229;
    margin-top: 36px;
    margin-bottom: 14px;
    line-height: 1.4;
  }

  .markdown-body :global(h4) {
    font-family: 'Playfair Display', serif;
    font-weight: 600;
    font-size: 17px;
    color: #4a3f35;
    margin-top: 28px;
    margin-bottom: 10px;
    line-height: 1.4;
    font-style: italic;
  }

  /* Paragraphs */
  .markdown-body :global(p) {
    margin-bottom: 18px;
    line-height: 1.9;
    color: #3d3229;
    font-size: 16px;
  }

  /* Strong and emphasis */
  .markdown-body :global(strong) {
    font-weight: 700;
    color: #2c241d;
  }

  .markdown-body :global(em) {
    font-style: italic;
    color: #4a3f35;
  }

  /* Links */
  .markdown-body :global(a) {
    color: #c0392b;
    text-decoration: none;
    transition: all 0.2s ease;
    border-bottom: 1px solid transparent;
  }

  .markdown-body :global(a:hover) {
    border-bottom-color: #c0392b;
  }

  /* Code blocks */
  .markdown-body :global(pre) {
    background: #f5ede0;
    border: 1px solid #d4c5a9;
    border-radius: 4px;
    padding: 24px;
    overflow-x: auto;
    margin: 28px 0;
    font-size: 14px;
    line-height: 1.65;
  }

  .markdown-body :global(pre code) {
    font-family: 'Courier Prime', 'Courier New', monospace;
    background: none;
    border: none;
    padding: 0;
    color: #3d3229;
    font-size: 14px;
  }

  .markdown-body :global(pre code span) {
    font-family: 'Courier Prime', 'Courier New', monospace;
  }

  /* Inline code */
  .markdown-body :global(code) {
    font-family: 'Courier Prime', 'Courier New', monospace;
    background: #f0e7d8;
    border-radius: 3px;
    padding: 2px 6px;
    font-size: 0.88em;
    color: #c0392b;
  }

  /* Blockquotes */
  .markdown-body :global(blockquote) {
    border-left: 2px solid #b8a88a;
    margin: 28px 0;
    padding: 8px 28px;
    font-style: italic;
    font-size: 1.1em;
    color: #5c4f42;
    background: transparent;
  }

  .markdown-body :global(blockquote p) {
    margin-bottom: 0;
    font-size: inherit;
    line-height: 1.85;
    color: #5c4f42;
  }

  /* Tables */
  .markdown-body :global(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 28px 0;
    font-size: 15px;
  }

  .markdown-body :global(thead) {
    border-bottom: 2px solid #b8a88a;
  }

  .markdown-body :global(th) {
    font-family: 'Playfair Display', serif;
    font-weight: 600;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    padding: 10px 16px;
    text-align: left;
    color: #3d3229;
    border-bottom: 2px solid #b8a88a;
  }

  .markdown-body :global(td) {
    padding: 10px 16px;
    border-bottom: 1px solid #e0d5c3;
    color: #4a3f35;
    font-size: 15px;
  }

  .markdown-body :global(tbody tr:hover) {
    background: rgba(184, 168, 138, 0.08);
  }

  /* Horizontal rule — decorative three asterisks */
  .markdown-body :global(hr) {
    border: none;
    text-align: center;
    margin: 48px 0;
    overflow: visible;
    height: auto;
    line-height: 1;
  }

  .markdown-body :global(hr::after) {
    content: '* * *';
    display: block;
    font-family: 'Playfair Display', serif;
    font-size: 16px;
    letter-spacing: 8px;
    color: #b8a88a;
  }

  /* Unordered lists */
  .markdown-body :global(ul) {
    list-style-type: disc;
    padding-left: 24px;
    margin: 18px 0;
  }

  .markdown-body :global(ul li) {
    margin-bottom: 10px;
    line-height: 1.8;
    padding-left: 4px;
  }

  .markdown-body :global(ul li::marker) {
    color: #b8a88a;
    font-size: 0.8em;
  }

  /* Ordered lists */
  .markdown-body :global(ol) {
    padding-left: 24px;
    margin: 18px 0;
  }

  .markdown-body :global(ol li) {
    margin-bottom: 10px;
    line-height: 1.8;
    padding-left: 4px;
  }

  .markdown-body :global(ol li::marker) {
    color: #b8a88a;
    font-weight: 400;
    font-family: 'Playfair Display', serif;
  }

  /* Images */
  .markdown-body :global(img) {
    max-width: 100%;
    border-radius: 4px;
    margin: 20px 0;
    box-shadow: 0 2px 8px rgba(61, 50, 41, 0.1);
  }

  /* Selection */
  .markdown-body :global(::selection) {
    background: rgba(192, 57, 43, 0.15);
    color: #2c241d;
  }

  /* BR */
  .markdown-body :global(br) {
    line-height: 1.9;
  }
</style>
