<script lang="ts">
	import { invoke } from "@tauri-apps/api/core";
	import { listen } from "@tauri-apps/api/event";
	import { getCurrentWindow } from "@tauri-apps/api/window";
	import { onMount } from "svelte";
	import { renderMarkdown } from "$lib/markdown";
	import { getTabs } from "$lib/tabs.svelte";
	import type { FileContent } from "$lib/types";
	import { getPreferences } from "$lib/preferences.svelte";
	import { open as openDialog } from "@tauri-apps/plugin-dialog";
	import Preferences from "$lib/components/Preferences.svelte";
	import "$lib/themes/base.css";

	const tabs = getTabs();
	const prefs = getPreferences();

	function handleTitlebarDrag(e: MouseEvent) {
		if (e.button !== 0) return;
		if (!(e.target instanceof HTMLElement)) return;
		if (e.target.closest(".tab, button")) return;
		getCurrentWindow().startDragging();
	}

	async function openFile(path: string) {
		try {
			const result = await invoke<FileContent>("read_file", { path });
			const rendered = await renderMarkdown(result.content);
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
					const rendered = await renderMarkdown(payload.content);
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
		prefs.init();

		const unlistenChanged = listen<FileContent>("file-changed", (event) => {
			handleFileChanged(event.payload);
		});

		invoke<string[]>("get_initial_files").then(async (files) => {
			for (const path of files) {
				await openFile(path);
			}
		});

		return () => {
			unlistenChanged.then((fn) => fn());
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
		outline: 2px solid var(--md-accent, #58a6ff);
		outline-offset: -2px;
		border-radius: 2px;
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

	.empty-hint code,
	.empty-hint kbd {
		font-family: "SF Mono", "Fira Code", monospace;
		padding: 2px 6px;
		border-radius: 4px;
		font-size: 0.9em;
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
