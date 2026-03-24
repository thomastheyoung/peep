<script lang="ts">
  import { sampleMarkdownHtml } from '$lib/sample-markdown';
</script>

<div class="exploration">
  <div class="label">03 — Retro Terminal<span class="cursor">_</span></div>
  <div class="markdown-body">
    {@html sampleMarkdownHtml}
  </div>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap');

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .exploration {
    font-family: 'IBM Plex Mono', monospace;
    background: #0a0a0a;
    color: #00ff41;
    min-height: 100%;
    padding: 0;
    text-shadow: 0 0 5px rgba(0, 255, 65, 0.5);
  }

  .label {
    font-family: 'IBM Plex Mono', monospace;
    font-weight: 600;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 3px;
    background: #0d0d0d;
    color: #00ff41;
    padding: 12px 24px;
    border-bottom: 1px solid #00ff41;
    text-shadow: 0 0 8px rgba(0, 255, 65, 0.6);
  }

  .cursor {
    animation: blink 1s step-end infinite;
    margin-left: 2px;
  }

  .markdown-body {
    padding: 40px 32px;
    max-width: 800px;
    line-height: 1.7;
    font-size: 15px;
    background-image: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 1px,
      rgba(0, 255, 65, 0.03) 1px,
      rgba(0, 255, 65, 0.03) 2px
    );
  }

  /* Headings */
  .markdown-body :global(h1) {
    font-family: 'IBM Plex Mono', monospace;
    font-weight: 600;
    font-size: 28px;
    color: #00ff41;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-top: 40px;
    margin-bottom: 20px;
    line-height: 1.3;
    text-shadow: 0 0 10px rgba(0, 255, 65, 0.7);
  }

  .markdown-body :global(h1::before) {
    content: '## ';
    opacity: 0.5;
  }

  .markdown-body :global(h2) {
    font-family: 'IBM Plex Mono', monospace;
    font-weight: 600;
    font-size: 22px;
    color: #00ff41;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    margin-top: 36px;
    margin-bottom: 16px;
    line-height: 1.3;
    text-shadow: 0 0 8px rgba(0, 255, 65, 0.6);
  }

  .markdown-body :global(h2::before) {
    content: '## ';
    opacity: 0.5;
  }

  .markdown-body :global(h3) {
    font-family: 'IBM Plex Mono', monospace;
    font-weight: 500;
    font-size: 18px;
    color: #00ff41;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-top: 28px;
    margin-bottom: 12px;
    text-shadow: 0 0 6px rgba(0, 255, 65, 0.5);
  }

  .markdown-body :global(h3::before) {
    content: '### ';
    opacity: 0.5;
  }

  .markdown-body :global(h4) {
    font-family: 'IBM Plex Mono', monospace;
    font-weight: 500;
    font-size: 16px;
    color: #00ff41;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-top: 24px;
    margin-bottom: 10px;
    text-shadow: 0 0 6px rgba(0, 255, 65, 0.5);
  }

  .markdown-body :global(h4::before) {
    content: '#### ';
    opacity: 0.5;
  }

  /* Paragraphs */
  .markdown-body :global(p) {
    margin-bottom: 16px;
    line-height: 1.75;
    color: #00ff41;
  }

  /* Strong and emphasis */
  .markdown-body :global(strong) {
    font-weight: 600;
    color: #33ff66;
    text-shadow: 0 0 8px rgba(0, 255, 65, 0.7);
  }

  .markdown-body :global(em) {
    font-style: italic;
    color: #00dd38;
  }

  /* Links */
  .markdown-body :global(a) {
    color: #00ff41;
    text-decoration: underline;
    text-underline-offset: 3px;
    animation: pulse 2s ease-in-out infinite;
    font-weight: 500;
  }

  .markdown-body :global(a:hover) {
    color: #66ff88;
    text-shadow: 0 0 12px rgba(0, 255, 65, 0.9);
  }

  /* Code blocks */
  .markdown-body :global(pre) {
    background: #111111;
    border: 1px dashed #00ff41;
    border-radius: 0;
    padding: 20px 24px;
    overflow-x: auto;
    margin: 24px 0;
    font-size: 14px;
    line-height: 1.6;
    color: #00ff41;
  }

  .markdown-body :global(pre code) {
    font-family: 'IBM Plex Mono', monospace;
    background: none;
    border: none;
    padding: 0;
    color: #00ff41;
    font-size: 14px;
    text-shadow: 0 0 4px rgba(0, 255, 65, 0.4);
  }

  .markdown-body :global(pre code span) {
    color: #00ff41 !important;
  }

  /* Inline code */
  .markdown-body :global(code) {
    font-family: 'IBM Plex Mono', monospace;
    background: rgba(0, 255, 65, 0.12);
    border-radius: 0;
    padding: 1px 6px;
    font-size: 0.9em;
    color: #00ff41;
    border: 1px solid rgba(0, 255, 65, 0.2);
  }

  /* Blockquotes */
  .markdown-body :global(blockquote) {
    border-left: 2px solid #00ff41;
    margin: 24px 0;
    padding: 12px 20px;
    color: #00cc33;
    background: rgba(0, 255, 65, 0.03);
  }

  .markdown-body :global(blockquote::before) {
    content: '> ';
    opacity: 0.5;
    font-weight: 600;
  }

  .markdown-body :global(blockquote p) {
    margin-bottom: 0;
    display: inline;
    color: #00cc33;
  }

  /* Tables */
  .markdown-body :global(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 24px 0;
    font-family: 'IBM Plex Mono', monospace;
  }

  .markdown-body :global(thead) {
    border-bottom: 1px dashed #00ff41;
  }

  .markdown-body :global(th) {
    font-weight: 600;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 1px;
    padding: 8px 16px;
    text-align: left;
    color: #00ff41;
    border: 1px dashed rgba(0, 255, 65, 0.3);
  }

  .markdown-body :global(td) {
    padding: 6px 16px;
    border: 1px dashed rgba(0, 255, 65, 0.2);
    font-size: 14px;
    color: #00dd38;
  }

  .markdown-body :global(tbody tr:hover) {
    background: rgba(0, 255, 65, 0.05);
  }

  /* Horizontal rule */
  .markdown-body :global(hr) {
    border: none;
    border-top: 1px dashed #00ff41;
    margin: 32px 0;
    opacity: 0.6;
  }

  /* Unordered lists */
  .markdown-body :global(ul) {
    list-style: none;
    padding-left: 20px;
    margin: 16px 0;
  }

  .markdown-body :global(ul li) {
    margin-bottom: 6px;
    line-height: 1.7;
    color: #00ff41;
  }

  .markdown-body :global(ul li::before) {
    content: '- ';
    opacity: 0.6;
  }

  /* Ordered lists */
  .markdown-body :global(ol) {
    list-style: none;
    padding-left: 20px;
    margin: 16px 0;
    counter-reset: terminal-counter;
  }

  .markdown-body :global(ol li) {
    margin-bottom: 6px;
    line-height: 1.7;
    color: #00ff41;
    counter-increment: terminal-counter;
  }

  .markdown-body :global(ol li::before) {
    content: counter(terminal-counter) '. ';
    opacity: 0.6;
  }

  /* Images */
  .markdown-body :global(img) {
    max-width: 100%;
    border: 1px dashed #00ff41;
    margin: 16px 0;
    filter: grayscale(100%) brightness(0.8) sepia(100%) hue-rotate(70deg) saturate(5);
  }

  /* Selection */
  .markdown-body :global(::selection) {
    background: #00ff41;
    color: #0a0a0a;
    text-shadow: none;
  }
</style>
