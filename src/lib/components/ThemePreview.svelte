<script module lang="ts">
	import type { ThemeMeta } from "$lib/themes/types";

	// Keyed `${id}@${revision}`, not just `id` — see `revisionOf` below for why
	// a builtin's revision is a constant `0` and a user theme's is its file
	// mtime. Module-level (not per-component-instance) so switching between two
	// palette rows for the SAME theme id reuses one fetch+sanitize instead of
	// re-running it per mount.
	const cssCache = new Map<string, string>();

	/**
	 * Builtins are immutable within a session — their CSS is a static import,
	 * never re-read from disk — so `0` is a stable, never-colliding revision
	 * for them. A user theme's `revision` is the file's mtime (see `UserTheme`
	 * in types.ts): re-importing a theme after editing it on disk bumps this,
	 * which is what invalidates the cache entry instead of showing stale CSS
	 * for a file that changed underneath an already-cached id.
	 */
	function revisionOf(meta: ThemeMeta): number {
		return meta.source === "user" ? meta.revision : 0;
	}
</script>

<script lang="ts">
	import { themeState } from "$lib/themes/theme.svelte";
	import { renderMarkdown } from "$lib/markdown";
	import baseCssRaw from "$lib/themes/base.css?raw";

	let { themeId, markdown }: { themeId: string; markdown?: string } = $props();

	let hostEl: HTMLDivElement | undefined = $state();
	let shadow: ShadowRoot | undefined;
	let styleEl: HTMLStyleElement | undefined;
	let contentEl: HTMLDivElement | undefined;

	const PREVIEW_OVERRIDES = `
		.app { margin: 0; }
		.markdown-body {
			max-width: none;
			margin-left: auto;
			margin-right: auto;
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

	function ensureShadow(): boolean {
		if (shadow) return true;
		if (!hostEl) return false;

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
		return true;
	}

	// Set up shadow DOM + load theme CSS (reacts to themeId changes)
	$effect(() => {
		if (!ensureShadow() || !styleEl) return;

		const id = themeId;
		// Resolve against the LIVE merged registry (themeState.all — builtins +
		// discovered user themes), not a static import of the builtin-only
		// table. The static import could never resolve a user theme id at all,
		// which fell through the old `if (!meta) return` below and left
		// whatever CSS the PREVIOUS themeId had painted still in the style
		// element — a WRONG pane, not a blank one, for every user theme.
		const meta = themeState.all.find((t) => t.id === id);
		if (!meta) {
			styleEl.textContent = "";
			return;
		}

		const cacheKey = `${id}@${revisionOf(meta)}`;
		// `.has()`, not truthy `cssCache.get(...)`: `combined` below is always
		// prefixed with `baseCssRaw`, so no entry this component itself inserts
		// can be empty today — but truthy-checking a cache lookup is the wrong
		// invariant to depend on regardless of whether the current insert path
		// happens to keep it true. A `.get()`-returns-falsy check silently
		// degrades to "refetch every render" the moment ANY future change
		// (a different combine order, a theme with genuinely empty CSS) makes
		// an entry falsy, and nothing here would signal that it broke.
		if (cssCache.has(cacheKey)) {
			styleEl.textContent = cssCache.get(cacheKey)!;
			return;
		}

		let cancelled = false;
		meta.load().then((result) => {
			if (cancelled) return;
			if (!result.ok) {
				// A rejected theme shows nothing rather than the previous theme's
				// CSS — silently keeping stale styling would look like the
				// rejected theme succeeded. Deliberately NOT cached: caching a
				// failure under this key would make a transient rejection (or one
				// fixed by a sanitizer update — see sanitize-theme-css.ts's
				// inject-time doctrine) sticky for the rest of the session.
				if (styleEl && themeId === id) styleEl.textContent = "";
				return;
			}
			const combined = baseCssRaw + "\n" + result.css + "\n" + PREVIEW_OVERRIDES;
			// Insert-time per-id eviction: drop any other cached entry for this
			// SAME theme id before inserting the new one, so an id whose theme
			// changed (re-imported at a new revision) doesn't leave its stale
			// `${id}@${oldRevision}` entry sitting in the map forever — each id
			// keeps at most one live cache entry.
			for (const key of cssCache.keys()) {
				if (key.startsWith(`${id}@`)) cssCache.delete(key);
			}
			cssCache.set(cacheKey, combined);
			if (styleEl && themeId === id) styleEl.textContent = combined;
		});

		return () => {
			cancelled = true;
		};
	});

	// Render markdown content (reacts to markdown prop changes)
	$effect(() => {
		if (!ensureShadow() || !contentEl) return;
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
