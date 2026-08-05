import { trustedConstant } from "./sanitize-html";

/**
 * Pre-rendered HTML representing a typical markdown document.
 * Used by design exploration components to showcase styling variations.
 *
 * Branded via `trustedConstant` because 20 exploration components inject it
 * with `{@html}`. It is an author-written literal in this repo with no
 * interpolation, so sanitizing it would be theatre — but leaving it a bare
 * `string` would make those 20 sinks accept unbranded input, which would
 * falsify the whole point of `SanitizedHtml`: that every `{@html}` in the repo
 * is typed, so adding a new one with raw input fails `pnpm check`.
 */
export const sampleMarkdownHtml = trustedConstant(`
<h1>Welcome to Markdown Viewer</h1>
<p>A beautiful, fast markdown viewer built with <strong>Tauri</strong> + <strong>Svelte 5</strong>. This paragraph contains <em>emphasized text</em>, <code>inline code</code>, and a <a href="#">hyperlink</a> to test all inline styles.</p>

<h2>Features</h2>
<ul>
  <li>Live file watching with instant re-render</li>
  <li>Syntax-highlighted code blocks</li>
  <li>Dark and light themes</li>
  <li>Tabbed interface for multiple files</li>
</ul>

<h3>Getting started</h3>
<p>Install the app and run <code>md readme.md</code> from your terminal. You can also pass directories to open all markdown files within.</p>

<ol>
  <li>Download the latest release</li>
  <li>Install to your Applications folder</li>
  <li>Open a terminal and run <code>md &lt;file.md&gt;</code></li>
</ol>

<h2>Code example</h2>
<pre><code><span style="color:#c678dd">async function</span> <span style="color:#61afef">renderMarkdown</span>(<span style="color:#e06c75">source</span>: <span style="color:#e5c07b">string</span>) {
  <span style="color:#c678dd">const</span> <span style="color:#e06c75">highlighter</span> = <span style="color:#c678dd">await</span> <span style="color:#61afef">createHighlighter</span>({
    <span style="color:#e06c75">themes</span>: [<span style="color:#98c379">"github-dark"</span>, <span style="color:#98c379">"github-light"</span>],
    <span style="color:#e06c75">langs</span>: [<span style="color:#98c379">"typescript"</span>, <span style="color:#98c379">"rust"</span>],
  });
  <span style="color:#c678dd">return</span> <span style="color:#e06c75">marked</span>.<span style="color:#61afef">parse</span>(<span style="color:#e06c75">source</span>);
}</code></pre>

<h2>Blockquote</h2>
<blockquote>
  <p>"The best way to predict the future is to invent it."<br>— Alan Kay</p>
</blockquote>

<h2>Table</h2>
<table>
  <thead>
    <tr><th>Feature</th><th>Status</th><th>Priority</th></tr>
  </thead>
  <tbody>
    <tr><td>Markdown rendering</td><td>Done</td><td>High</td></tr>
    <tr><td>Syntax highlighting</td><td>Done</td><td>High</td></tr>
    <tr><td>File watching</td><td>Done</td><td>Medium</td></tr>
    <tr><td>Themes</td><td>Done</td><td>Low</td></tr>
  </tbody>
</table>

<hr>

<h4>A note on performance</h4>
<p>The markdown parser uses <strong>marked</strong> for speed and <strong>shiki</strong> for accurate syntax highlighting. Files are re-rendered on every save, with typical render times under <code>5ms</code> for most documents.</p>

<p><em>Edit this file and watch it update live!</em></p>
`);
