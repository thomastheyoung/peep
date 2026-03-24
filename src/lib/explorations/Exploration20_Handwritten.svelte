<script lang="ts">
  import { sampleMarkdownHtml } from '$lib/sample-markdown';
</script>

<div class="exploration">
  <div class="label">20 — Handwritten</div>
  <div class="markdown-body">
    {@html sampleMarkdownHtml}
  </div>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&family=Comic+Neue:ital,wght@0,300;0,400;0,700;1,400&family=Fira+Code:wght@400;500&display=swap');

  .exploration {
    font-family: 'Comic Neue', cursive;
    font-weight: 400;
    background:
      repeating-linear-gradient(
        to bottom,
        transparent 0px,
        transparent 31px,
        #e8e0d4 31px,
        #e8e0d4 32px
      ),
      #fffff8;
    color: #333333;
    min-height: 100%;
    padding: 0;
    line-height: 2.0;
  }

  .label {
    font-family: 'Caveat', cursive;
    font-weight: 700;
    font-size: 20px;
    letter-spacing: 1px;
    background: #d5d0c8;
    color: #555;
    padding: 10px 24px;
    position: sticky;
    top: 0;
    z-index: 10;
    border-bottom: 2px solid #bbb;
  }

  .markdown-body {
    max-width: 720px;
    margin: 0 auto;
    padding: 48px 32px 80px 60px;
    font-size: 16px;
    border-left: 2px solid #e74c3c;
    margin-left: max(calc(50% - 360px), 32px);
  }

  /* Headings */
  .markdown-body :global(h1) {
    font-family: 'Caveat', cursive;
    font-weight: 700;
    font-size: 2.5em;
    color: #2980b9;
    margin: 0.8em 0 0.4em;
    transform: rotate(-0.5deg);
    text-decoration: underline wavy #2980b9;
    text-underline-offset: 6px;
    text-decoration-thickness: 2px;
    line-height: 1.3;
  }

  .markdown-body :global(h1:first-child) {
    margin-top: 0;
  }

  .markdown-body :global(h2) {
    font-family: 'Caveat', cursive;
    font-weight: 600;
    font-size: 1.8em;
    color: #e74c3c;
    margin: 0.9em 0 0.4em;
    transform: rotate(0.3deg);
    line-height: 1.3;
  }

  .markdown-body :global(h3) {
    font-family: 'Caveat', cursive;
    font-weight: 600;
    font-size: 1.5em;
    color: #2980b9;
    margin: 0.8em 0 0.3em;
    transform: rotate(-0.2deg);
  }

  .markdown-body :global(h4) {
    font-family: 'Caveat', cursive;
    font-weight: 500;
    font-size: 1.3em;
    color: #e74c3c;
    margin: 0.7em 0 0.3em;
  }

  .markdown-body :global(h5) {
    font-family: 'Caveat', cursive;
    font-weight: 500;
    font-size: 1.15em;
    color: #27ae60;
    margin: 0.7em 0 0.3em;
  }

  .markdown-body :global(h6) {
    font-family: 'Caveat', cursive;
    font-weight: 400;
    font-size: 1.05em;
    color: #2980b9;
    margin: 0.6em 0 0.3em;
    opacity: 0.7;
  }

  /* Paragraphs */
  .markdown-body :global(p) {
    margin: 0 0 1em;
    line-height: 2.0;
  }

  /* Strong and emphasis */
  .markdown-body :global(strong) {
    font-weight: 700;
    color: #e74c3c;
  }

  .markdown-body :global(em) {
    font-style: italic;
    font-family: 'Caveat', cursive;
    font-size: 1.1em;
    color: #2980b9;
  }

  /* Links */
  .markdown-body :global(a) {
    color: #2980b9;
    text-decoration: underline;
    text-decoration-style: solid;
    text-underline-offset: 3px;
    text-decoration-thickness: 1.5px;
  }

  .markdown-body :global(a:hover) {
    color: #e74c3c;
    text-decoration-color: #e74c3c;
  }

  /* Code blocks */
  .markdown-body :global(pre) {
    background: #fffde7;
    border: 2px dashed #999;
    border-radius: 0;
    padding: 20px 24px;
    overflow-x: auto;
    margin: 1.5em 0;
    transform: rotate(-0.3deg);
  }

  .markdown-body :global(pre code) {
    font-family: 'Fira Code', monospace;
    color: #333;
    font-size: 14px;
    line-height: 1.6;
    background: none;
    padding: 0;
    border: none;
    border-radius: 0;
    transform: none;
  }

  /* Inline code */
  .markdown-body :global(code) {
    background: #fef9c3;
    color: #e74c3c;
    padding: 2px 7px;
    border-radius: 3px;
    font-size: 0.9em;
    font-family: 'Fira Code', monospace;
  }

  /* Blockquotes */
  .markdown-body :global(blockquote) {
    border-left: 4px solid #2980b9;
    padding: 12px 20px;
    margin: 1.5em 0;
    color: #2980b9;
    font-style: italic;
    font-family: 'Caveat', cursive;
    font-size: 1.15em;
    background: rgba(41, 128, 185, 0.04);
    transform: rotate(0.2deg);
  }

  .markdown-body :global(blockquote p) {
    margin: 0 0 0.4em;
  }

  .markdown-body :global(blockquote p:last-child) {
    margin-bottom: 0;
  }

  /* Tables */
  .markdown-body :global(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 1.5em 0;
    border: 1px solid #bbb;
    transform: rotate(-0.2deg);
  }

  .markdown-body :global(thead) {
    border-bottom: 2px solid #999;
  }

  .markdown-body :global(th) {
    color: #e74c3c;
    font-family: 'Caveat', cursive;
    font-weight: 700;
    font-size: 1.1em;
    padding: 8px 14px;
    text-align: left;
    text-decoration: underline;
    text-underline-offset: 3px;
    border: 1px solid #bbb;
  }

  .markdown-body :global(td) {
    padding: 8px 14px;
    border: 1px solid #bbb;
  }

  .markdown-body :global(tbody tr:hover) {
    background: rgba(41, 128, 185, 0.04);
  }

  /* Lists */
  .markdown-body :global(ul) {
    padding-left: 24px;
    margin: 1em 0;
    list-style: none;
  }

  .markdown-body :global(ul > li) {
    position: relative;
    padding-left: 8px;
  }

  .markdown-body :global(ul > li::before) {
    content: '\2713';
    color: #27ae60;
    font-weight: 700;
    position: absolute;
    left: -20px;
    font-size: 1.1em;
  }

  .markdown-body :global(ol) {
    padding-left: 24px;
    margin: 1em 0;
  }

  .markdown-body :global(li) {
    margin: 0.3em 0;
    line-height: 2.0;
  }

  .markdown-body :global(ol li::marker) {
    color: #e74c3c;
    font-weight: 700;
    font-family: 'Caveat', cursive;
    font-size: 1.15em;
  }

  .markdown-body :global(li > ul),
  .markdown-body :global(li > ol) {
    margin: 0.2em 0;
  }

  /* Nested list items still get checkmarks */
  .markdown-body :global(ul ul > li::before) {
    color: #2980b9;
    content: '\2022';
  }

  /* Horizontal rule */
  .markdown-body :global(hr) {
    border: none;
    border-top: 3px dashed #ccc;
    margin: 2em 0;
    transform: rotate(0.3deg);
  }

  /* Images */
  .markdown-body :global(img) {
    max-width: 100%;
    border: 2px solid #ccc;
    transform: rotate(-0.5deg);
    margin: 1em 0;
    box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.08);
  }

  /* Definition lists */
  .markdown-body :global(dl) {
    margin: 1em 0;
  }

  .markdown-body :global(dt) {
    font-family: 'Caveat', cursive;
    font-weight: 700;
    font-size: 1.2em;
    color: #e74c3c;
    margin-top: 0.8em;
  }

  .markdown-body :global(dd) {
    margin-left: 24px;
    margin-bottom: 0.5em;
    padding-left: 12px;
    border-left: 2px solid #ddd;
  }

  /* Details and summary */
  .markdown-body :global(details) {
    margin: 1em 0;
    padding: 12px 16px;
    background: rgba(255, 253, 231, 0.5);
    border: 2px dashed #ccc;
    transform: rotate(0.2deg);
  }

  .markdown-body :global(summary) {
    cursor: pointer;
    font-family: 'Caveat', cursive;
    font-weight: 700;
    font-size: 1.15em;
    color: #2980b9;
  }

  /* Task lists — override the checkmark for actual task list items */
  .markdown-body :global(input[type='checkbox']) {
    accent-color: #27ae60;
    margin-right: 8px;
    transform: scale(1.2);
  }

  /* Keyboard */
  .markdown-body :global(kbd) {
    background: #f5f5f0;
    border: 1px solid #bbb;
    border-bottom-width: 2px;
    border-radius: 3px;
    padding: 2px 6px;
    font-size: 0.85em;
    font-family: 'Fira Code', monospace;
    color: #555;
  }

  /* Mark */
  .markdown-body :global(mark) {
    background: #fef9c3;
    color: #333;
    padding: 1px 4px;
    border-radius: 2px;
    transform: rotate(0.5deg);
    display: inline-block;
  }

  /* Sub / sup */
  .markdown-body :global(sub),
  .markdown-body :global(sup) {
    font-size: 0.75em;
    color: #e74c3c;
  }

  /* Abbreviation */
  .markdown-body :global(abbr) {
    text-decoration: underline dotted #2980b9;
    cursor: help;
  }

  /* Footnotes */
  .markdown-body :global(.footnotes) {
    margin-top: 2em;
    padding-top: 1em;
    border-top: 2px dashed #ccc;
    font-size: 0.9em;
    color: #777;
    transform: rotate(-0.2deg);
  }
</style>
