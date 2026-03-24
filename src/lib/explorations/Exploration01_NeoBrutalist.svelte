<script lang="ts">
  import { sampleMarkdownHtml } from '$lib/sample-markdown';
</script>

<div class="exploration">
  <div class="label">01 — Neo Brutalist</div>
  <div class="markdown-body">
    {@html sampleMarkdownHtml}
  </div>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap');

  .exploration {
    font-family: 'Space Grotesk', sans-serif;
    background: #fffdf0;
    color: #1a1a1a;
    min-height: 100%;
    padding: 0;
  }

  .label {
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 700;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 3px;
    background: #1a1a1a;
    color: #fffdf0;
    padding: 12px 24px;
    border-bottom: 4px solid #ff5722;
  }

  .markdown-body {
    padding: 48px 40px;
    max-width: 800px;
    line-height: 1.7;
    font-size: 16px;
  }

  /* Headings */
  .markdown-body :global(h1) {
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 700;
    font-size: 42px;
    text-transform: uppercase;
    letter-spacing: 1px;
    border-bottom: 4px solid #1a1a1a;
    padding-bottom: 12px;
    margin-top: 48px;
    margin-bottom: 24px;
    line-height: 1.2;
  }

  .markdown-body :global(h2) {
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 700;
    font-size: 28px;
    border-left: 6px solid #ff5722;
    padding-left: 16px;
    margin-top: 40px;
    margin-bottom: 16px;
    line-height: 1.3;
  }

  .markdown-body :global(h3) {
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 700;
    font-size: 22px;
    margin-top: 32px;
    margin-bottom: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .markdown-body :global(h4) {
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 700;
    font-size: 18px;
    margin-top: 28px;
    margin-bottom: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 2px solid #1a1a1a;
    padding-bottom: 6px;
    display: inline-block;
  }

  /* Paragraphs */
  .markdown-body :global(p) {
    margin-bottom: 16px;
    line-height: 1.75;
  }

  /* Strong and emphasis */
  .markdown-body :global(strong) {
    font-weight: 700;
    color: #1a1a1a;
  }

  .markdown-body :global(em) {
    font-style: italic;
    color: #333;
  }

  /* Links */
  .markdown-body :global(a) {
    color: #ff5722;
    text-decoration: underline;
    text-underline-offset: 4px;
    text-decoration-thickness: 3px;
    text-decoration-color: #ff5722;
    font-weight: 500;
    transition: background 0.1s ease;
  }

  .markdown-body :global(a:hover) {
    background: #ff5722;
    color: #fffdf0;
    text-decoration: none;
    padding: 0 4px;
    margin: 0 -4px;
  }

  /* Code blocks */
  .markdown-body :global(pre) {
    background: #1a1a1a;
    color: #00ff41;
    border: 3px solid #1a1a1a;
    border-radius: 0;
    padding: 24px;
    overflow-x: auto;
    margin: 24px 0;
    box-shadow: 6px 6px 0 #ff5722;
    font-size: 14px;
    line-height: 1.6;
  }

  .markdown-body :global(pre code) {
    font-family: 'Space Mono', 'Courier New', monospace;
    background: none;
    border: none;
    padding: 0;
    color: #00ff41;
    font-size: 14px;
  }

  .markdown-body :global(pre code span) {
    color: #00ff41 !important;
  }

  /* Inline code */
  .markdown-body :global(code) {
    font-family: 'Space Mono', 'Courier New', monospace;
    background: #ff5722;
    color: #1a1a1a;
    border: 2px solid #1a1a1a;
    border-radius: 0;
    padding: 2px 6px;
    font-size: 0.9em;
    font-weight: 500;
  }

  /* Blockquotes */
  .markdown-body :global(blockquote) {
    border-left: 6px solid #ff5722;
    margin: 24px 0;
    padding: 16px 24px;
    background: rgba(255, 87, 34, 0.06);
    font-style: italic;
    font-weight: 500;
    transform: rotate(-1deg);
    box-shadow: 4px 4px 0 #1a1a1a;
    border: 3px solid #1a1a1a;
    border-left: 6px solid #ff5722;
  }

  .markdown-body :global(blockquote p) {
    margin-bottom: 0;
    font-size: 17px;
    line-height: 1.6;
  }

  /* Tables */
  .markdown-body :global(table) {
    width: 100%;
    border-collapse: collapse;
    border: 3px solid #1a1a1a;
    margin: 24px 0;
    border-radius: 0;
    box-shadow: 5px 5px 0 #1a1a1a;
  }

  .markdown-body :global(thead) {
    background: #1a1a1a;
    color: #fffdf0;
  }

  .markdown-body :global(th) {
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 13px;
    padding: 12px 16px;
    text-align: left;
    border: 3px solid #1a1a1a;
    color: #fffdf0;
  }

  .markdown-body :global(td) {
    padding: 10px 16px;
    border: 3px solid #1a1a1a;
    font-size: 15px;
  }

  .markdown-body :global(tbody tr:nth-child(even)) {
    background: rgba(255, 87, 34, 0.04);
  }

  .markdown-body :global(tbody tr:hover) {
    background: rgba(255, 87, 34, 0.12);
  }

  /* Horizontal rule */
  .markdown-body :global(hr) {
    border: none;
    border-top: 4px solid #1a1a1a;
    margin: 40px 0;
  }

  /* Unordered lists */
  .markdown-body :global(ul) {
    list-style-type: square;
    padding-left: 24px;
    margin: 16px 0;
  }

  .markdown-body :global(ul li) {
    margin-bottom: 8px;
    line-height: 1.7;
    padding-left: 4px;
  }

  .markdown-body :global(ul li::marker) {
    color: #ff5722;
    font-size: 1.1em;
  }

  /* Ordered lists */
  .markdown-body :global(ol) {
    padding-left: 24px;
    margin: 16px 0;
  }

  .markdown-body :global(ol li) {
    margin-bottom: 8px;
    line-height: 1.7;
    padding-left: 4px;
  }

  .markdown-body :global(ol li::marker) {
    color: #ff5722;
    font-weight: 700;
  }

  /* Images */
  .markdown-body :global(img) {
    max-width: 100%;
    border: 3px solid #1a1a1a;
    box-shadow: 6px 6px 0 #1a1a1a;
    margin: 16px 0;
  }

  /* Selection */
  .markdown-body :global(::selection) {
    background: #ff5722;
    color: #fffdf0;
  }
</style>
