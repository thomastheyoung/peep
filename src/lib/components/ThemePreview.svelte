<script lang="ts">
	import { themes } from "$lib/themes/registry";
	import { renderMarkdown } from "$lib/markdown";
	import baseCssRaw from "$lib/themes/base.css?raw";

	let { themeId, markdown }: { themeId: string; markdown?: string } = $props();

	let hostEl: HTMLDivElement | undefined = $state();
	let shadow: ShadowRoot | undefined;
	let styleEl: HTMLStyleElement | undefined = $state();
	let contentEl: HTMLDivElement | undefined = $state();

	const cssCache = new Map<string, string>();

	const PREVIEW_OVERRIDES = `
		.app { margin: 0; }
		.markdown-body {
			max-width: none;
			padding: 20px;
			font-size: 13px;
		}
		.markdown-body h1 {
			font-size: 1.4em;
			margin-top: 0;
		}
		.markdown-body pre {
			overflow: hidden;
		}
	`;

	// Fallback when no document is open
	const SAMPLE_HTML = `<h1>Heading</h1>
<p>Body text with a <a href="#">hyperlink</a> and some <strong>bold words</strong> in a paragraph.</p>
<blockquote><p>A blockquote adds emphasis to a passage.</p></blockquote>
<hr>
<pre><code>const theme = "preview";</code></pre>
<ul><li>List item one</li><li>List item <a href="#">with link</a></li></ul>`;

	function setContent(el: HTMLDivElement, html: string) {
		// Safe: HTML comes from our own renderMarkdown pipeline (marked + shiki)
		// operating on local files in a desktop app. Shadow DOM provides isolation.
		el.innerHTML = html;
	}

	// Set up shadow DOM structure (runs once)
	$effect(() => {
		if (!hostEl) return;
		if (shadow) return;

		shadow = hostEl.attachShadow({ mode: "open" });
		styleEl = document.createElement("style");
		shadow.appendChild(styleEl);

		const app = document.createElement("div");
		app.className = "app";
		contentEl = document.createElement("div");
		contentEl.className = "markdown-body";
		setContent(contentEl, SAMPLE_HTML);
		app.appendChild(contentEl);
		shadow.appendChild(app);
	});

	// Render markdown content (reacts to markdown prop changes)
	$effect(() => {
		if (!contentEl) return;
		const src = markdown;

		if (!src) {
			setContent(contentEl, SAMPLE_HTML);
			return;
		}

		let cancelled = false;
		renderMarkdown(src).then(({ html }) => {
			if (cancelled) return;
			if (contentEl) setContent(contentEl, html);
		});

		return () => {
			cancelled = true;
		};
	});

	// Load theme CSS (reacts to themeId changes)
	$effect(() => {
		if (!styleEl) return;

		const id = themeId;
		const cached = cssCache.get(id);
		if (cached) {
			styleEl.textContent = cached;
			return;
		}

		const meta = themes.find((t) => t.id === id);
		if (!meta) return;

		let cancelled = false;
		meta.load().then((themeCss) => {
			if (cancelled) return;
			const combined = baseCssRaw + "\n" + themeCss + "\n" + PREVIEW_OVERRIDES;
			cssCache.set(id, combined);
			if (styleEl && themeId === id) styleEl.textContent = combined;
		});

		return () => {
			cancelled = true;
		};
	});
</script>

<div bind:this={hostEl} class="theme-preview-host"></div>

<style>
	.theme-preview-host {
		width: 100%;
		height: 100%;
		overflow-y: auto;
		overflow-x: hidden;
	}
</style>
