<script lang="ts">
  import { sampleMarkdownHtml } from '$lib/sample-markdown';
</script>

<div class="exploration">
  <div class="label">16 — Vaporwave</div>
  <div class="markdown-body">
    {@html sampleMarkdownHtml}
  </div>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700&family=Righteous&display=swap');

  .exploration {
    font-family: 'DM Sans', sans-serif;
    background:
      repeating-linear-gradient(
        0deg,
        rgba(255, 255, 255, 0.03) 0px,
        rgba(255, 255, 255, 0.03) 1px,
        transparent 1px,
        transparent 40px
      ),
      repeating-linear-gradient(
        90deg,
        rgba(255, 255, 255, 0.03) 0px,
        rgba(255, 255, 255, 0.03) 1px,
        transparent 1px,
        transparent 40px
      ),
      linear-gradient(to bottom, #2d1b69, #1a0033);
    color: #e8c4f0;
    min-height: 100%;
    padding: 0;
    line-height: 1.7;
  }

  .label {
    font-family: 'Righteous', cursive;
    font-size: 14px;
    letter-spacing: 2px;
    text-transform: uppercase;
    background: linear-gradient(135deg, #ff71ce, #b967ff);
    color: #fff;
    padding: 12px 24px;
    position: sticky;
    top: 0;
    z-index: 10;
    text-shadow: 0 0 10px rgba(255, 113, 206, 0.5);
  }

  .markdown-body {
    max-width: 740px;
    margin: 0 auto;
    padding: 48px 32px 80px;
    font-size: 16px;
    font-weight: 400;
  }

  /* Headings */
  .markdown-body :global(h1) {
    font-family: 'Righteous', cursive;
    color: #ff71ce;
    font-size: 2.5em;
    margin: 1.6em 0 0.6em;
    text-shadow: 0 0 20px rgba(185, 103, 255, 0.5), 0 0 40px rgba(255, 113, 206, 0.3);
    line-height: 1.2;
  }

  .markdown-body :global(h1:first-child) {
    margin-top: 0;
  }

  .markdown-body :global(h2) {
    font-family: 'Righteous', cursive;
    color: #01cdfe;
    font-size: 1.8em;
    margin: 1.4em 0 0.5em;
    text-shadow: 0 0 15px rgba(1, 205, 254, 0.4);
    line-height: 1.3;
  }

  .markdown-body :global(h3) {
    font-family: 'Righteous', cursive;
    color: #b967ff;
    font-size: 1.4em;
    margin: 1.3em 0 0.4em;
    text-shadow: 0 0 12px rgba(185, 103, 255, 0.35);
  }

  .markdown-body :global(h4) {
    font-family: 'Righteous', cursive;
    color: #fffb96;
    font-size: 1.15em;
    margin: 1.2em 0 0.4em;
    text-shadow: 0 0 10px rgba(255, 251, 150, 0.3);
  }

  .markdown-body :global(h5) {
    font-family: 'Righteous', cursive;
    color: #ff71ce;
    font-size: 1em;
    margin: 1.1em 0 0.3em;
  }

  .markdown-body :global(h6) {
    font-family: 'Righteous', cursive;
    color: #01cdfe;
    font-size: 0.9em;
    margin: 1em 0 0.3em;
    opacity: 0.8;
  }

  /* Paragraphs */
  .markdown-body :global(p) {
    margin: 0 0 1.2em;
    line-height: 1.8;
  }

  /* Strong and emphasis */
  .markdown-body :global(strong) {
    color: #ff71ce;
    font-weight: 700;
  }

  .markdown-body :global(em) {
    color: #fffb96;
    font-style: italic;
  }

  /* Links */
  .markdown-body :global(a) {
    color: #fffb96;
    text-decoration: none;
    text-shadow: 0 0 8px rgba(255, 251, 150, 0.4);
    transition: text-shadow 0.2s ease;
  }

  .markdown-body :global(a:hover) {
    text-shadow: 0 0 16px rgba(255, 251, 150, 0.7);
  }

  /* Code blocks */
  .markdown-body :global(pre) {
    background: #120029;
    border: 1px solid #ff71ce;
    border-radius: 8px;
    padding: 20px 24px;
    overflow-x: auto;
    margin: 1.5em 0;
    box-shadow: 0 0 20px rgba(255, 113, 206, 0.15);
  }

  .markdown-body :global(pre code) {
    font-family: 'DM Sans', monospace;
    color: #01cdfe;
    font-size: 14px;
    line-height: 1.6;
    background: none;
    padding: 0;
    border: none;
    border-radius: 0;
    box-shadow: none;
  }

  /* Inline code */
  .markdown-body :global(code) {
    background: rgba(185, 103, 255, 0.2);
    color: #ff71ce;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.9em;
    font-family: 'DM Sans', monospace;
  }

  /* Blockquotes */
  .markdown-body :global(blockquote) {
    border-left: 4px solid transparent;
    border-image: linear-gradient(to bottom, #ff71ce, #01cdfe) 1;
    background: rgba(255, 113, 206, 0.05);
    padding: 16px 24px;
    margin: 1.5em 0;
    font-style: italic;
    color: #e8c4f0;
  }

  .markdown-body :global(blockquote p) {
    margin: 0 0 0.5em;
  }

  .markdown-body :global(blockquote p:last-child) {
    margin-bottom: 0;
  }

  /* Tables */
  .markdown-body :global(table) {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    margin: 1.5em 0;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #ff71ce;
  }

  .markdown-body :global(thead) {
    background: linear-gradient(135deg, #ff71ce, #b967ff);
  }

  .markdown-body :global(th) {
    color: #fff;
    font-weight: 700;
    padding: 12px 16px;
    text-align: left;
    font-size: 0.9em;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .markdown-body :global(td) {
    padding: 10px 16px;
    border-top: 1px solid rgba(255, 113, 206, 0.2);
  }

  .markdown-body :global(tbody tr:hover) {
    background: rgba(255, 113, 206, 0.05);
  }

  /* Lists */
  .markdown-body :global(ul) {
    padding-left: 24px;
    margin: 1em 0;
    list-style-type: disc;
  }

  .markdown-body :global(ol) {
    padding-left: 24px;
    margin: 1em 0;
  }

  .markdown-body :global(li) {
    margin: 0.35em 0;
    line-height: 1.7;
  }

  .markdown-body :global(ul li::marker) {
    color: #ff71ce;
  }

  .markdown-body :global(ol li::marker) {
    color: #01cdfe;
    font-weight: 700;
  }

  .markdown-body :global(li > ul),
  .markdown-body :global(li > ol) {
    margin: 0.25em 0;
  }

  /* Horizontal rule */
  .markdown-body :global(hr) {
    border: none;
    height: 3px;
    background: linear-gradient(90deg, #ff71ce, #01cdfe, #b967ff);
    margin: 2em 0;
    border-radius: 2px;
    box-shadow: 0 0 10px rgba(255, 113, 206, 0.3);
  }

  /* Images */
  .markdown-body :global(img) {
    max-width: 100%;
    border-radius: 8px;
    border: 1px solid rgba(255, 113, 206, 0.3);
    box-shadow: 0 0 20px rgba(185, 103, 255, 0.2);
    margin: 1em 0;
  }

  /* Definition lists, details, summary */
  .markdown-body :global(dl) {
    margin: 1em 0;
  }

  .markdown-body :global(dt) {
    font-weight: 700;
    color: #ff71ce;
    margin-top: 0.8em;
  }

  .markdown-body :global(dd) {
    margin-left: 24px;
    margin-bottom: 0.5em;
  }

  .markdown-body :global(details) {
    margin: 1em 0;
    padding: 12px 16px;
    background: rgba(185, 103, 255, 0.08);
    border: 1px solid rgba(185, 103, 255, 0.2);
    border-radius: 8px;
  }

  .markdown-body :global(summary) {
    cursor: pointer;
    color: #01cdfe;
    font-weight: 500;
  }

  /* Task lists */
  .markdown-body :global(input[type='checkbox']) {
    accent-color: #ff71ce;
    margin-right: 8px;
  }

  /* Keyboard */
  .markdown-body :global(kbd) {
    background: rgba(185, 103, 255, 0.15);
    border: 1px solid rgba(185, 103, 255, 0.3);
    border-radius: 4px;
    padding: 2px 6px;
    font-size: 0.85em;
    color: #e8c4f0;
    box-shadow: 0 1px 0 rgba(185, 103, 255, 0.3);
  }

  /* Mark / highlight */
  .markdown-body :global(mark) {
    background: rgba(255, 251, 150, 0.25);
    color: #fffb96;
    padding: 1px 4px;
    border-radius: 3px;
  }

  /* Subscript and superscript */
  .markdown-body :global(sub),
  .markdown-body :global(sup) {
    font-size: 0.75em;
    color: #b967ff;
  }

  /* Abbreviation */
  .markdown-body :global(abbr) {
    text-decoration: underline dotted #01cdfe;
    cursor: help;
  }

  /* Footnotes */
  .markdown-body :global(.footnotes) {
    margin-top: 2em;
    padding-top: 1em;
    border-top: 1px solid rgba(255, 113, 206, 0.2);
    font-size: 0.9em;
    color: rgba(232, 196, 240, 0.7);
  }
</style>
