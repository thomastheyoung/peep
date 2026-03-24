<script lang="ts">
  import { sampleMarkdownHtml } from '$lib/sample-markdown';
</script>

<div class="exploration">
  <div class="label">05 — Neon Cyberpunk</div>
  <div class="markdown-body">
    {@html sampleMarkdownHtml}
  </div>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Orbitron:wght@400;500;600;700;800&display=swap');

  @keyframes neon-flicker {
    0%, 100% { opacity: 1; }
    92% { opacity: 1; }
    93% { opacity: 0.8; }
    94% { opacity: 1; }
    96% { opacity: 0.9; }
    97% { opacity: 1; }
  }

  @keyframes glow-pulse {
    0%, 100% { text-shadow: 0 0 10px rgba(255, 255, 0, 0.6), 0 0 30px rgba(255, 255, 0, 0.2); }
    50% { text-shadow: 0 0 15px rgba(255, 255, 0, 0.9), 0 0 40px rgba(255, 255, 0, 0.4); }
  }

  .exploration {
    font-family: 'JetBrains Mono', monospace;
    background: #0a0014;
    color: #e0d4ff;
    min-height: 100%;
    padding: 0;
  }

  .label {
    font-family: 'Orbitron', sans-serif;
    font-weight: 700;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 4px;
    background: linear-gradient(90deg, #1a0a2e, #0a0014);
    color: #ff00ff;
    padding: 14px 28px;
    border-bottom: 2px solid #ff00ff;
    text-shadow: 0 0 10px #ff00ff, 0 0 30px rgba(255, 0, 255, 0.3);
    animation: neon-flicker 4s infinite;
    box-shadow: 0 2px 20px rgba(255, 0, 255, 0.2);
  }

  .markdown-body {
    padding: 48px 40px;
    max-width: 820px;
    line-height: 1.8;
    font-size: 15px;
  }

  /* Headings */
  .markdown-body :global(h1) {
    font-family: 'Orbitron', sans-serif;
    font-weight: 800;
    font-size: 34px;
    color: #ff00ff;
    text-shadow: 0 0 10px #ff00ff, 0 0 40px rgba(255, 0, 255, 0.3);
    margin-top: 48px;
    margin-bottom: 24px;
    line-height: 1.3;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .markdown-body :global(h2) {
    font-family: 'Orbitron', sans-serif;
    font-weight: 700;
    font-size: 24px;
    color: #00ffff;
    text-shadow: 0 0 8px #00ffff, 0 0 30px rgba(0, 255, 255, 0.3);
    margin-top: 40px;
    margin-bottom: 18px;
    line-height: 1.35;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .markdown-body :global(h3) {
    font-family: 'Orbitron', sans-serif;
    font-weight: 600;
    font-size: 18px;
    color: #ff00ff;
    text-shadow: 0 0 6px rgba(255, 0, 255, 0.6);
    margin-top: 32px;
    margin-bottom: 14px;
    line-height: 1.4;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .markdown-body :global(h4) {
    font-family: 'Orbitron', sans-serif;
    font-weight: 600;
    font-size: 16px;
    color: #00ffff;
    text-shadow: 0 0 6px rgba(0, 255, 255, 0.5);
    margin-top: 28px;
    margin-bottom: 12px;
    line-height: 1.4;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* Paragraphs */
  .markdown-body :global(p) {
    margin-bottom: 16px;
    line-height: 1.8;
    color: #e0d4ff;
  }

  /* Strong and emphasis */
  .markdown-body :global(strong) {
    font-weight: 700;
    color: #ffffff;
    text-shadow: 0 0 4px rgba(255, 255, 255, 0.3);
  }

  .markdown-body :global(em) {
    font-style: italic;
    color: #c8b8f0;
  }

  /* Links */
  .markdown-body :global(a) {
    color: #ffff00;
    text-decoration: none;
    text-shadow: 0 0 8px rgba(255, 255, 0, 0.4);
    transition: all 0.3s ease;
    border-bottom: 1px solid transparent;
  }

  .markdown-body :global(a:hover) {
    animation: glow-pulse 1.5s ease-in-out infinite;
    border-bottom-color: #ffff00;
  }

  /* Code blocks */
  .markdown-body :global(pre) {
    background: #1a0a2e;
    border: 1px solid #ff00ff;
    border-radius: 8px;
    padding: 24px;
    overflow-x: auto;
    margin: 24px 0;
    font-size: 14px;
    line-height: 1.65;
    box-shadow: 0 0 15px rgba(255, 0, 255, 0.2), inset 0 0 30px rgba(255, 0, 255, 0.03);
  }

  .markdown-body :global(pre code) {
    font-family: 'JetBrains Mono', monospace;
    background: none;
    border: none;
    padding: 0;
    color: #e0d4ff;
    font-size: 14px;
    text-shadow: none;
  }

  .markdown-body :global(pre code span) {
    text-shadow: 0 0 3px rgba(224, 212, 255, 0.2);
  }

  /* Inline code */
  .markdown-body :global(code) {
    font-family: 'JetBrains Mono', monospace;
    background: rgba(0, 255, 255, 0.1);
    border-radius: 4px;
    padding: 2px 7px;
    font-size: 0.88em;
    color: #00ffff;
    border: 1px solid rgba(0, 255, 255, 0.15);
  }

  /* Blockquotes */
  .markdown-body :global(blockquote) {
    border-left: 3px solid;
    border-image: linear-gradient(180deg, #ff00ff, #00ffff) 1;
    margin: 24px 0;
    padding: 16px 24px;
    background: rgba(255, 0, 255, 0.04);
    box-shadow: 0 0 10px rgba(255, 0, 255, 0.08);
  }

  .markdown-body :global(blockquote p) {
    margin-bottom: 0;
    color: #c8b8f0;
    font-style: italic;
  }

  /* Tables */
  .markdown-body :global(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 24px 0;
    border: 1px solid rgba(255, 0, 255, 0.4);
    box-shadow: 0 0 10px rgba(255, 0, 255, 0.1);
  }

  .markdown-body :global(thead) {
    background: linear-gradient(90deg, rgba(255, 0, 255, 0.2), rgba(100, 0, 180, 0.3));
    border-bottom: 1px solid #ff00ff;
  }

  .markdown-body :global(th) {
    font-family: 'Orbitron', sans-serif;
    font-weight: 600;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 2px;
    padding: 12px 16px;
    text-align: left;
    color: #ff00ff;
    text-shadow: 0 0 5px rgba(255, 0, 255, 0.5);
    border: 1px solid rgba(255, 0, 255, 0.3);
  }

  .markdown-body :global(td) {
    padding: 10px 16px;
    border: 1px solid rgba(255, 0, 255, 0.2);
    font-size: 14px;
    color: #d0c4ee;
  }

  .markdown-body :global(tbody tr:hover) {
    background: rgba(255, 0, 255, 0.06);
  }

  .markdown-body :global(tbody tr:nth-child(even)) {
    background: rgba(0, 255, 255, 0.02);
  }

  /* Horizontal rule */
  .markdown-body :global(hr) {
    border: none;
    height: 2px;
    background: linear-gradient(90deg, #ff00ff, #00ffff, #ff00ff);
    margin: 40px 0;
    box-shadow: 0 0 10px rgba(255, 0, 255, 0.3), 0 0 20px rgba(0, 255, 255, 0.15);
  }

  /* Unordered lists */
  .markdown-body :global(ul) {
    list-style: none;
    padding-left: 24px;
    margin: 16px 0;
  }

  .markdown-body :global(ul li) {
    margin-bottom: 8px;
    line-height: 1.8;
    position: relative;
    padding-left: 16px;
  }

  .markdown-body :global(ul li::before) {
    content: '▸';
    position: absolute;
    left: -8px;
    color: #00ffff;
    text-shadow: 0 0 6px rgba(0, 255, 255, 0.5);
    font-size: 14px;
  }

  /* Ordered lists */
  .markdown-body :global(ol) {
    padding-left: 24px;
    margin: 16px 0;
  }

  .markdown-body :global(ol li) {
    margin-bottom: 8px;
    line-height: 1.8;
    padding-left: 4px;
  }

  .markdown-body :global(ol li::marker) {
    color: #ff00ff;
    text-shadow: 0 0 5px rgba(255, 0, 255, 0.4);
    font-weight: 600;
  }

  /* Images */
  .markdown-body :global(img) {
    max-width: 100%;
    border-radius: 8px;
    border: 1px solid rgba(255, 0, 255, 0.3);
    box-shadow: 0 0 20px rgba(255, 0, 255, 0.15);
    margin: 16px 0;
  }

  /* Selection */
  .markdown-body :global(::selection) {
    background: rgba(255, 0, 255, 0.35);
    color: #ffffff;
    text-shadow: none;
  }
</style>
