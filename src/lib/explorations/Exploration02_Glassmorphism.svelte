<script lang="ts">
  import { sampleMarkdownHtml } from '$lib/sample-markdown';
</script>

<div class="exploration">
  <div class="label">02 — Glassmorphism</div>
  <div class="markdown-body">
    {@html sampleMarkdownHtml}
  </div>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');

  .exploration {
    font-family: 'Inter', sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #f0f0f0;
    min-height: 100%;
    padding: 0;
  }

  .label {
    font-family: 'Inter', sans-serif;
    font-weight: 600;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 3px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    color: rgba(255, 255, 255, 0.85);
    padding: 14px 28px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  }

  .markdown-body {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 20px;
    padding: 48px;
    margin: 32px;
    max-width: 800px;
    line-height: 1.8;
    font-size: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  }

  /* Headings */
  .markdown-body :global(h1) {
    font-family: 'Inter', sans-serif;
    font-weight: 300;
    font-size: 40px;
    color: #ffffff;
    margin-top: 40px;
    margin-bottom: 24px;
    line-height: 1.2;
    letter-spacing: -0.5px;
  }

  .markdown-body :global(h2) {
    font-family: 'Inter', sans-serif;
    font-weight: 400;
    font-size: 28px;
    color: rgba(255, 255, 255, 0.95);
    margin-top: 36px;
    margin-bottom: 16px;
    line-height: 1.3;
  }

  .markdown-body :global(h3) {
    font-family: 'Inter', sans-serif;
    font-weight: 500;
    font-size: 22px;
    color: rgba(255, 255, 255, 0.9);
    margin-top: 28px;
    margin-bottom: 12px;
    line-height: 1.4;
  }

  .markdown-body :global(h4) {
    font-family: 'Inter', sans-serif;
    font-weight: 600;
    font-size: 18px;
    color: rgba(255, 255, 255, 0.85);
    margin-top: 24px;
    margin-bottom: 10px;
    line-height: 1.4;
  }

  /* Paragraphs */
  .markdown-body :global(p) {
    margin-bottom: 16px;
    line-height: 1.8;
    color: rgba(240, 240, 240, 0.9);
  }

  /* Strong and emphasis */
  .markdown-body :global(strong) {
    font-weight: 600;
    color: #ffffff;
  }

  .markdown-body :global(em) {
    font-style: italic;
    color: rgba(240, 240, 240, 0.85);
  }

  /* Links */
  .markdown-body :global(a) {
    color: #a8d8ff;
    text-decoration: none;
    transition: all 0.3s ease;
    border-bottom: 1px solid transparent;
  }

  .markdown-body :global(a:hover) {
    color: #c0e6ff;
    text-shadow: 0 0 12px rgba(168, 216, 255, 0.6);
    border-bottom-color: rgba(168, 216, 255, 0.4);
  }

  /* Code blocks */
  .markdown-body :global(pre) {
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 24px;
    overflow-x: auto;
    margin: 24px 0;
    font-size: 14px;
    line-height: 1.6;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }

  .markdown-body :global(pre code) {
    font-family: 'SF Mono', 'Fira Code', monospace;
    background: none;
    border: none;
    padding: 0;
    color: #e0e0e0;
    font-size: 14px;
  }

  .markdown-body :global(pre code span) {
    text-shadow: 0 0 2px rgba(255, 255, 255, 0.1);
  }

  /* Inline code */
  .markdown-body :global(code) {
    font-family: 'SF Mono', 'Fira Code', monospace;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 6px;
    padding: 2px 8px;
    font-size: 0.9em;
    color: #e8e8e8;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  /* Blockquotes */
  .markdown-body :global(blockquote) {
    border-left: 3px solid rgba(255, 255, 255, 0.35);
    margin: 24px 0;
    padding: 12px 24px;
    font-style: italic;
    color: rgba(240, 240, 240, 0.7);
    background: rgba(255, 255, 255, 0.05);
    border-radius: 0 12px 12px 0;
  }

  .markdown-body :global(blockquote p) {
    margin-bottom: 0;
    color: rgba(240, 240, 240, 0.7);
  }

  /* Tables */
  .markdown-body :global(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 24px 0;
    background: transparent;
  }

  .markdown-body :global(thead) {
    background: rgba(255, 255, 255, 0.15);
  }

  .markdown-body :global(th) {
    font-weight: 600;
    font-size: 13px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    padding: 12px 16px;
    text-align: left;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.9);
  }

  .markdown-body :global(td) {
    padding: 10px 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    font-size: 15px;
    color: rgba(240, 240, 240, 0.85);
  }

  .markdown-body :global(tbody tr:hover) {
    background: rgba(255, 255, 255, 0.06);
  }

  /* Horizontal rule */
  .markdown-body :global(hr) {
    border: none;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.4) 30%,
      rgba(255, 255, 255, 0.4) 70%,
      transparent 100%
    );
    margin: 40px 0;
  }

  /* Unordered lists */
  .markdown-body :global(ul) {
    padding-left: 24px;
    margin: 16px 0;
  }

  .markdown-body :global(ul li) {
    margin-bottom: 8px;
    line-height: 1.7;
    color: rgba(240, 240, 240, 0.9);
  }

  .markdown-body :global(ul li::marker) {
    color: rgba(168, 216, 255, 0.7);
  }

  /* Ordered lists */
  .markdown-body :global(ol) {
    padding-left: 24px;
    margin: 16px 0;
  }

  .markdown-body :global(ol li) {
    margin-bottom: 8px;
    line-height: 1.7;
    color: rgba(240, 240, 240, 0.9);
  }

  .markdown-body :global(ol li::marker) {
    color: rgba(168, 216, 255, 0.7);
    font-weight: 500;
  }

  /* Images */
  .markdown-body :global(img) {
    max-width: 100%;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    margin: 16px 0;
  }

  /* Selection */
  .markdown-body :global(::selection) {
    background: rgba(168, 216, 255, 0.35);
    color: #ffffff;
  }
</style>
