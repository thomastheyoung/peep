<script lang="ts">
	import { invoke } from "@tauri-apps/api/core";
	import { listen } from "@tauri-apps/api/event";
	import { getCurrentWindow } from "@tauri-apps/api/window";
	import { onMount } from "svelte";
	import { renderMarkdown } from "$lib/markdown";
	import { getTabs } from "$lib/tabs.svelte";
	import type { FileContent } from "$lib/types";

	const tabs = getTabs();
	let theme = $state<"dark" | "light">("dark");
	let renderGeneration = 0;

	function handleTitlebarDrag(e: MouseEvent) {
		if (e.button !== 0) return;
		if (!(e.target instanceof HTMLElement)) return;
		if (e.target.closest(".tab, .theme-toggle, button")) return;
		getCurrentWindow().startDragging();
	}

	async function openFile(path: string) {
		try {
			const result = await invoke<FileContent>("read_file", { path });
			const rendered = await renderMarkdown(result.content, theme);
			tabs.add({ ...result, rendered });
			await invoke("watch_file", { path: result.path });
		} catch (err) {
			console.error(`Failed to open ${path}:`, err);
		}
	}

	async function closeTab(index: number) {
		const tab = tabs.items[index];
		if (!tab) return;
		const { path } = tab;
		tabs.close(index);
		try {
			await invoke("unwatch_file", { path });
		} catch {
			// best effort
		}
	}

	function toggleTheme() {
		theme = theme === "dark" ? "light" : "dark";
		reRenderAll();
	}

	async function reRenderAll() {
		const gen = ++renderGeneration;
		const active = tabs.active;

		if (active) {
			const rendered = await renderMarkdown(active.content, theme);
			if (gen !== renderGeneration) return;
			tabs.update(active.path, active.content, rendered);
		}

		await Promise.all(
			tabs.items
				.filter((t) => t !== active)
				.map(async (tab) => {
					const rendered = await renderMarkdown(tab.content, theme);
					if (gen !== renderGeneration) return;
					tabs.update(tab.path, tab.content, rendered);
				}),
		);
	}

	function handleMiddleClick(e: MouseEvent, index: number) {
		if (e.button === 1) {
			e.preventDefault();
			closeTab(index);
		}
	}

	const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

	function handleFileChanged(payload: FileContent) {
		const existing = debounceTimers.get(payload.path);
		if (existing) clearTimeout(existing);
		debounceTimers.set(
			payload.path,
			setTimeout(async () => {
				debounceTimers.delete(payload.path);
				try {
					const rendered = await renderMarkdown(payload.content, theme);
					tabs.update(payload.path, payload.content, rendered);
				} catch (err) {
					console.error(`Failed to render ${payload.path}:`, err);
				}
			}, 150),
		);
	}

	function handleTabListKeydown(e: KeyboardEvent) {
		if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
			e.preventDefault();
			const dir = e.key === "ArrowRight" ? 1 : -1;
			const next =
				(tabs.activeIndex + dir + tabs.items.length) % tabs.items.length;
			tabs.activate(next);
			const tablist = e.currentTarget as HTMLElement;
			const tabEls = tablist.querySelectorAll('[role="tab"]');
			(tabEls[next] as HTMLElement | undefined)?.focus();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		const mod = e.metaKey || e.ctrlKey;
		if (mod && e.key === "w" && tabs.items.length > 0) {
			e.preventDefault();
			closeTab(tabs.activeIndex);
		}
	}

	onMount(() => {
		const mq = window.matchMedia("(prefers-color-scheme: light)");
		if (mq.matches) theme = "light";
		const themeHandler = (e: MediaQueryListEvent) => {
			theme = e.matches ? "light" : "dark";
			reRenderAll();
		};
		mq.addEventListener("change", themeHandler);

		const unlistenChanged = listen<FileContent>("file-changed", (event) => {
			handleFileChanged(event.payload);
		});

		invoke<string[]>("get_initial_files").then(async (files) => {
			for (const path of files) {
				await openFile(path);
			}
		});

		return () => {
			mq.removeEventListener("change", themeHandler);
			unlistenChanged.then((fn) => fn());
			for (const timer of debounceTimers.values()) clearTimeout(timer);
		};
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="app" data-theme={theme}>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<header class="titlebar" onmousedown={handleTitlebarDrag}>
		<div class="titlebar-spacer"></div>
		{#if tabs.items.length > 0}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<nav class="tabs" role="tablist" onkeydown={handleTabListKeydown}>
				{#each tabs.items as tab, i}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="tab"
						class:active={i === tabs.activeIndex}
						onclick={() => tabs.activate(i)}
						onmousedown={(e) => handleMiddleClick(e, i)}
						role="tab"
						tabindex={i === tabs.activeIndex ? 0 : -1}
						aria-selected={i === tabs.activeIndex}
					>
						<span class="tab-name">{tab.filename}</span>
						<button
							class="tab-close"
							onclick={(e: MouseEvent) => {
								e.stopPropagation();
								closeTab(i);
							}}
							tabindex={-1}
							aria-label="Close {tab.filename}">&times;</button
						>
					</div>
				{/each}
			</nav>
		{/if}
		<div class="titlebar-actions">
			<button
				class="theme-toggle"
				onclick={toggleTheme}
				aria-label="Toggle theme"
			>
				{theme === "dark" ? "☀" : "☾"}
			</button>
		</div>
	</header>

	<main class="content">
		{#if tabs.active}
			<article class="markdown-body">
				{@html tabs.active.rendered}
			</article>
		{:else}
			<div class="empty-state">
				<p class="empty-title">No files open</p>
				<p class="empty-hint">
					Run <code>md &lt;file.md&gt;</code> to open a markdown file
				</p>
			</div>
		{/if}
	</main>
</div>

<style>
	:global(*) {
		margin: 0;
		padding: 0;
		box-sizing: border-box;
	}

	:global(body) {
		overflow: hidden;
	}

	.app {
		height: 100vh;
		display: flex;
		flex-direction: column;
		font-family:
			-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial,
			sans-serif;
		transition:
			background-color 0.2s,
			color 0.2s;
	}

	.app[data-theme="dark"] {
		background: #0d1117;
		color: #e6edf3;
	}

	.app[data-theme="light"] {
		background: #ffffff;
		color: #1f2328;
	}

	/* Titlebar / tab bar */
	.titlebar {
		display: flex;
		align-items: center;
		height: 44px;
		flex-shrink: 0;
		user-select: none;
		-webkit-user-select: none;
		border-bottom: 1px solid;
	}

	.app[data-theme="dark"] .titlebar {
		background: #161b22;
		border-color: #30363d;
	}

	.app[data-theme="light"] .titlebar {
		background: #f6f8fa;
		border-color: #d1d9e0;
	}

	.titlebar-spacer {
		width: 80px;
		flex-shrink: 0;
	}

	.tabs {
		display: flex;
		flex: 1;
		overflow-x: auto;
		gap: 1px;
		align-items: stretch;
		height: 100%;
	}

	.tabs::-webkit-scrollbar {
		display: none;
	}

	.tab {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 0 14px;
		font-size: 12px;
		border: none;
		cursor: pointer;
		white-space: nowrap;
		transition: background-color 0.15s;
		font-family: inherit;
		height: 100%;
	}

	.tab:focus-visible {
		outline: 2px solid #58a6ff;
		outline-offset: -2px;
		border-radius: 2px;
	}

	.app[data-theme="dark"] .tab {
		background: transparent;
		color: #8b949e;
	}

	.app[data-theme="dark"] .tab:hover {
		background: #1c2129;
	}

	.app[data-theme="dark"] .tab.active {
		background: #0d1117;
		color: #e6edf3;
	}

	.app[data-theme="light"] .tab {
		background: transparent;
		color: #656d76;
	}

	.app[data-theme="light"] .tab:hover {
		background: #eaeef2;
	}

	.app[data-theme="light"] .tab.active {
		background: #ffffff;
		color: #1f2328;
	}

	.tab-name {
		max-width: 160px;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.tab-close {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		border: none;
		border-radius: 4px;
		font-size: 14px;
		cursor: pointer;
		opacity: 0;
		transition:
			opacity 0.1s,
			background-color 0.1s;
		background: transparent;
		color: inherit;
		font-family: inherit;
	}

	.tab:hover .tab-close {
		opacity: 0.6;
	}

	.tab-close:hover {
		opacity: 1 !important;
	}

	.app[data-theme="dark"] .tab-close:hover {
		background: #30363d;
	}

	.app[data-theme="light"] .tab-close:hover {
		background: #d1d9e0;
	}

	.titlebar-actions {
		display: flex;
		align-items: center;
		padding: 0 12px;
		flex-shrink: 0;
	}

	.theme-toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 14px;
		transition: background-color 0.15s;
		background: transparent;
		color: inherit;
	}

	.theme-toggle:focus-visible {
		outline: 2px solid #58a6ff;
		outline-offset: -2px;
	}

	.app[data-theme="dark"] .theme-toggle:hover {
		background: #30363d;
	}

	.app[data-theme="light"] .theme-toggle:hover {
		background: #d1d9e0;
	}

	/* Content area */
	.content {
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
	}

	.content::-webkit-scrollbar {
		width: 8px;
	}

	.content::-webkit-scrollbar-track {
		background: transparent;
	}

	.app[data-theme="dark"] .content::-webkit-scrollbar-thumb {
		background: #30363d;
		border-radius: 4px;
	}

	.app[data-theme="light"] .content::-webkit-scrollbar-thumb {
		background: #d1d9e0;
		border-radius: 4px;
	}

	/* Markdown content styling */
	.markdown-body {
		max-width: 780px;
		margin: 0 auto;
		padding: 32px 40px 80px;
		line-height: 1.7;
		font-size: 15px;
	}

	/* Headings */
	.markdown-body :global(h1) {
		font-size: 2em;
		font-weight: 600;
		margin: 0 0 16px;
		padding-bottom: 0.3em;
		border-bottom: 1px solid;
		line-height: 1.25;
	}

	.markdown-body :global(h2) {
		font-size: 1.5em;
		font-weight: 600;
		margin: 24px 0 16px;
		padding-bottom: 0.3em;
		border-bottom: 1px solid;
		line-height: 1.25;
	}

	.markdown-body :global(h3) {
		font-size: 1.25em;
		font-weight: 600;
		margin: 24px 0 16px;
		line-height: 1.25;
	}

	.markdown-body :global(h4),
	.markdown-body :global(h5),
	.markdown-body :global(h6) {
		font-weight: 600;
		margin: 24px 0 16px;
		line-height: 1.25;
	}

	.app[data-theme="dark"] .markdown-body :global(h1),
	.app[data-theme="dark"] .markdown-body :global(h2) {
		border-color: #30363d;
	}

	.app[data-theme="light"] .markdown-body :global(h1),
	.app[data-theme="light"] .markdown-body :global(h2) {
		border-color: #d1d9e0;
	}

	/* Paragraphs & text */
	.markdown-body :global(p) {
		margin: 0 0 16px;
	}

	.markdown-body :global(strong) {
		font-weight: 600;
	}

	/* Links */
	.app[data-theme="dark"] .markdown-body :global(a) {
		color: #58a6ff;
	}

	.app[data-theme="light"] .markdown-body :global(a) {
		color: #0969da;
	}

	.markdown-body :global(a) {
		text-decoration: none;
	}

	.markdown-body :global(a:hover) {
		text-decoration: underline;
	}

	/* Code (inline) */
	.markdown-body :global(code) {
		font-family: "SF Mono", "Fira Code", "JetBrains Mono", monospace;
		font-size: 0.875em;
		padding: 0.2em 0.4em;
		border-radius: 6px;
	}

	.app[data-theme="dark"] .markdown-body :global(:not(pre) > code) {
		background: rgba(110, 118, 129, 0.4);
	}

	.app[data-theme="light"] .markdown-body :global(:not(pre) > code) {
		background: rgba(175, 184, 193, 0.2);
	}

	/* Code blocks (from shiki) */
	.markdown-body :global(pre) {
		margin: 0 0 16px;
		padding: 16px;
		border-radius: 8px;
		overflow-x: auto;
		font-size: 13px;
		line-height: 1.5;
	}

	.markdown-body :global(pre code) {
		padding: 0;
		background: none;
		font-size: inherit;
	}

	.app[data-theme="dark"] .markdown-body :global(pre:not(.shiki)) {
		background: #161b22;
	}

	.app[data-theme="light"] .markdown-body :global(pre:not(.shiki)) {
		background: #f6f8fa;
	}

	.markdown-body :global(.shiki) {
		border-radius: 8px;
	}

	/* Blockquotes */
	.markdown-body :global(blockquote) {
		margin: 0 0 16px;
		padding: 0 1em;
		border-left: 0.25em solid;
	}

	.app[data-theme="dark"] .markdown-body :global(blockquote) {
		border-color: #30363d;
		color: #8b949e;
	}

	.app[data-theme="light"] .markdown-body :global(blockquote) {
		border-color: #d1d9e0;
		color: #656d76;
	}

	/* Lists */
	.markdown-body :global(ul),
	.markdown-body :global(ol) {
		margin: 0 0 16px;
		padding-left: 2em;
	}

	.markdown-body :global(li) {
		margin: 4px 0;
	}

	.markdown-body :global(li + li) {
		margin-top: 4px;
	}

	/* Tables */
	.markdown-body :global(table) {
		width: 100%;
		border-collapse: collapse;
		margin: 0 0 16px;
		font-size: 14px;
	}

	.markdown-body :global(th),
	.markdown-body :global(td) {
		padding: 6px 13px;
		border: 1px solid;
	}

	.app[data-theme="dark"] .markdown-body :global(th),
	.app[data-theme="dark"] .markdown-body :global(td) {
		border-color: #30363d;
	}

	.app[data-theme="light"] .markdown-body :global(th),
	.app[data-theme="light"] .markdown-body :global(td) {
		border-color: #d1d9e0;
	}

	.markdown-body :global(th) {
		font-weight: 600;
	}

	.app[data-theme="dark"] .markdown-body :global(tr:nth-child(2n)) {
		background: #161b22;
	}

	.app[data-theme="light"] .markdown-body :global(tr:nth-child(2n)) {
		background: #f6f8fa;
	}

	/* Horizontal rule */
	.markdown-body :global(hr) {
		height: 0.25em;
		margin: 24px 0;
		border: 0;
		border-radius: 2px;
	}

	.app[data-theme="dark"] .markdown-body :global(hr) {
		background: #30363d;
	}

	.app[data-theme="light"] .markdown-body :global(hr) {
		background: #d1d9e0;
	}

	/* Images */
	.markdown-body :global(img) {
		max-width: 100%;
		border-radius: 8px;
	}

	/* Task lists */
	.markdown-body :global(input[type="checkbox"]) {
		margin-right: 0.5em;
	}

	/* Empty state */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		gap: 8px;
		opacity: 0.5;
	}

	.empty-title {
		font-size: 18px;
		font-weight: 500;
	}

	.empty-hint {
		font-size: 14px;
	}

	.empty-hint code {
		font-family: "SF Mono", "Fira Code", monospace;
		padding: 2px 6px;
		border-radius: 4px;
	}

	.app[data-theme="dark"] .empty-hint code {
		background: rgba(110, 118, 129, 0.4);
	}

	.app[data-theme="light"] .empty-hint code {
		background: rgba(175, 184, 193, 0.2);
	}
</style>
