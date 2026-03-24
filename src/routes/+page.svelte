<script lang="ts">
	import { invoke } from "@tauri-apps/api/core";
	import { listen } from "@tauri-apps/api/event";
	import { type Window } from "@tauri-apps/api/window";
	import { getCurrentWindow } from "@tauri-apps/api/window";
	import { onMount } from "svelte";
	import { renderMarkdown, isLatestRender } from "$lib/markdown";
	import { getTabs } from "$lib/tabs.svelte";
	import type { FileContent } from "$lib/types";
	import { getPreferences } from "$lib/preferences.svelte";
	import { open as openDialog } from "@tauri-apps/plugin-dialog";
	import Preferences from "$lib/components/Preferences.svelte";
	import "$lib/themes/base.css";

	const tabs = getTabs();
	const prefs = getPreferences();
	let appWindow: Window;

	function handleTitlebarDrag(e: MouseEvent) {
		if (e.button !== 0) return;
		if (!(e.target instanceof HTMLElement)) return;
		if (e.target.closest(".tab, button")) return;
		appWindow.startDragging();
	}

	async function openFile(path: string) {
		try {
			const result = await invoke<FileContent>("read_file", { path });
			const { html } = await renderMarkdown(result.content);
			tabs.add({ ...result, rendered: html });
			await invoke("watch_file", { path: result.path });
		} catch (err) {
			console.error(`Failed to open ${path}:`, err);
		}
	}

	async function closeTab(index: number) {
		const tab = tabs.items[index];
		if (!tab) return;
		const { path } = tab;
		const timer = debounceTimers.get(path);
		if (timer) {
			clearTimeout(timer);
			debounceTimers.delete(path);
		}
		tabs.close(index);
		try {
			await invoke("unwatch_file", { path });
		} catch {
			// best effort
		}
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
					const { html, generation } = await renderMarkdown(payload.content);
					if (!isLatestRender(generation)) return;
					tabs.update(payload.path, payload.content, html);
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

	async function openFileDialog() {
		const result = await openDialog({
			multiple: true,
			filters: [
				{ name: "Markdown", extensions: ["md", "markdown"] },
			],
		});
		if (result) {
			const paths = Array.isArray(result) ? result : [result];
			for (const path of paths) {
				await openFile(path);
			}
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		const mod = e.metaKey || e.ctrlKey;
		if (mod && e.key === ",") {
			e.preventDefault();
			prefs.togglePanel();
		}
		if (mod && e.key === "o") {
			e.preventDefault();
			openFileDialog();
		}
		if (mod && e.key === "w" && tabs.items.length > 0) {
			e.preventDefault();
			closeTab(tabs.activeIndex);
		}
	}

	onMount(() => {
		appWindow = getCurrentWindow();
		prefs.init();

		const unlistenChanged = listen<FileContent>("file-changed", (event) => {
			handleFileChanged(event.payload);
		});

		const unlistenOpen = listen<string>("open-file", (event) => {
			openFile(event.payload);
		});

		const unlistenZoom = listen<string>("zoom", (event) => {
			console.log("[zoom] event received:", event.payload);
			switch (event.payload) {
				case "in":
					prefs.zoomIn();
					break;
				case "out":
					prefs.zoomOut();
					break;
				case "reset":
					prefs.resetZoom();
					break;
			}
			console.log("[zoom] level now:", prefs.zoomLevel);
		});

		invoke<string[]>("get_initial_files").then(async (files) => {
			for (const path of files) {
				await openFile(path);
			}
		});

		return () => {
			unlistenChanged.then((fn) => fn());
			unlistenOpen.then((fn) => fn());
			unlistenZoom.then((fn) => fn());
			for (const timer of debounceTimers.values()) clearTimeout(timer);
		};
	});
</script>

<svelte:head>
	{#if prefs.theme.css}
		{@html `<style id="md-theme">${prefs.theme.css}</style>`}
	{/if}
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<Preferences />

<div class="app" style:--md-content-width={prefs.contentWidthCss}>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<header class="titlebar" data-tauri-drag-region onmousedown={handleTitlebarDrag}>
		<div class="titlebar-spacer" data-tauri-drag-region></div>
		{#if tabs.items.length > 0}
			<div class="tabs" role="tablist" tabindex={-1} onkeydown={handleTabListKeydown}>
				{#each tabs.items as tab, i}
					<button
						class="tab"
						class:active={i === tabs.activeIndex}
						onclick={() => tabs.activate(i)}
						onmousedown={(e) => handleMiddleClick(e, i)}
						role="tab"
						tabindex={i === tabs.activeIndex ? 0 : -1}
						aria-selected={i === tabs.activeIndex}
						type="button"
					>
						<span class="tab-name">{tab.filename}</span>
						<span
							class="tab-close"
							onclick={(e: MouseEvent) => {
								e.stopPropagation();
								closeTab(i);
							}}
							onkeydown={(e: KeyboardEvent) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									e.stopPropagation();
									closeTab(i);
								}
							}}
							tabindex={-1}
							role="button"
							aria-label="Close {tab.filename}">&times;</span
						>
					</button>
				{/each}
			</div>
		{/if}
	</header>

	<main class="content" style:zoom={prefs.zoomLevel}>
		{#if tabs.active}
			<article class="markdown-body">
				{@html tabs.active.rendered}
			</article>
		{:else}
			<div class="empty-state">
				<p class="empty-title">No files open</p>
				<p class="empty-hint">
					Run <code>md &lt;file.md&gt;</code> or press
					<kbd>&#8984;O</kbd> to open a file
				</p>
				<button class="open-file-btn" onclick={openFileDialog}>
					Open file
				</button>
			</div>
		{/if}
	</main>
</div>

<style>
	:global(*, *::before, *::after) {
		box-sizing: border-box;
	}

	:global(body) {
		margin: 0;
		padding: 0;
		overflow: hidden;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
		text-rendering: optimizeLegibility;
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

	/* Titlebar / tab bar — fixed dark chrome */
	.titlebar {
		display: flex;
		align-items: center;
		height: 44px;
		flex-shrink: 0;
		user-select: none;
		-webkit-user-select: none;
		background: #161b22;
		border-bottom: 1px solid #30363d;
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica,
			Arial, sans-serif;
	}

	.titlebar-spacer {
		width: 80px;
		flex-shrink: 0;
	}

	.tabs {
		display: flex;
		flex: 1;
		overflow-x: auto;
		gap: 6px;
		align-items: center;
		height: 100%;
		padding: 0 4px;
	}

	.tabs::-webkit-scrollbar {
		display: none;
	}

	.tab {
		display: flex;
		align-items: center;
		gap: 5px;
		padding: 4px 12px;
		font-size: 12px;
		font-weight: 600;
		border: 2px solid #30363d;
		border-radius: 0;
		cursor: pointer;
		white-space: nowrap;
		transition: all 0.1s ease;
		font-family: inherit;
		box-shadow: 2px 2px 0 #30363d;
		background: #21262d;
		color: #8b949e;
	}

	.tab:hover:not(.active) {
		transform: translate(-1px, -1px);
		box-shadow: 3px 3px 0 #30363d;
	}

	.tab:active {
		transform: translate(1px, 1px);
		box-shadow: 1px 1px 0 #30363d;
	}

	.tab.active {
		background: #58a6ff;
		color: #0d1117;
		border-color: #1f6feb;
		box-shadow: 2px 2px 0 #1f6feb;
	}

	.tab:focus-visible {
		outline: 2px solid #58a6ff;
		outline-offset: 2px;
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
		width: 16px;
		height: 16px;
		border: 1px solid currentColor;
		border-radius: 0;
		font-size: 12px;
		font-weight: 800;
		line-height: 1;
		cursor: pointer;
		opacity: 0;
		transition: all 0.1s ease;
		background: transparent;
		color: inherit;
		font-family: inherit;
	}

	.tab:hover .tab-close {
		opacity: 0.6;
	}

	.tab-close:hover {
		opacity: 1 !important;
		background: #ef4444;
		color: #fff;
		border-color: #ef4444;
	}

	/* Content area */
	.content {
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
		scroll-behavior: smooth;
		overscroll-behavior-y: contain;
		scrollbar-gutter: stable;
	}

	.content::-webkit-scrollbar {
		width: 8px;
	}

	.content::-webkit-scrollbar-track {
		background: transparent;
	}

	.content::-webkit-scrollbar-thumb {
		background: #30363d;
		border-radius: 4px;
	}

	/* Empty state */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		gap: 8px;
		color: #8b949e;
	}

	.empty-title {
		font-size: 18px;
		font-weight: 500;
	}

	.empty-hint {
		font-size: 14px;
	}

	.empty-hint code,
	.empty-hint kbd {
		font-family: "SF Mono", "Fira Code", monospace;
		padding: 2px 6px;
		border-radius: 4px;
		font-size: 0.9em;
		background: rgba(110, 118, 129, 0.4);
	}

	.open-file-btn {
		margin-top: 12px;
		padding: 8px 20px;
		border: 1px solid currentColor;
		border-radius: 6px;
		background: transparent;
		color: inherit;
		font-family: inherit;
		font-size: 14px;
		cursor: pointer;
		opacity: 0.7;
		transition:
			opacity 0.15s,
			background-color 0.15s;
	}

	.open-file-btn:hover {
		opacity: 1;
		background: rgba(128, 128, 128, 0.1);
	}
</style>
