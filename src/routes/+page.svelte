<script lang="ts">
	import { invoke } from "@tauri-apps/api/core";
	import { listen } from "@tauri-apps/api/event";
	import { tabs } from "$lib/tabs.svelte";
	import type { FileContent } from "$lib/types";
	import { preferences as prefs } from "$lib/preferences.svelte";
	import { commandPalette as palette } from "$lib/command-palette.svelte";
	import { buildCommands } from "$lib/commands";
	import { openFile, closeTab, openFileDialog, handleFileChanged, clearAllTimers } from "$lib/files";
	import { copyCode } from "$lib/copy-code";
	import { scrollSpy } from "$lib/scroll-spy";
	import { toc } from "$lib/toc";
	import TabBar from "$lib/components/TabBar.svelte";
	import FloatingDock from "$lib/components/FloatingDock.svelte";
	import EmptyState from "$lib/components/EmptyStateStamp.svelte";
	import Preferences from "$lib/components/Preferences.svelte";
	import CommandPalette from "$lib/components/CommandPalette.svelte";
	import "$lib/themes/base.css";
	import "katex/dist/katex.min.css";

	let contentEl: HTMLElement | undefined = $state();

	function handleKeydown(e: KeyboardEvent) {
		const mod = e.metaKey || e.ctrlKey;
		if (mod && e.key === "k") {
			e.preventDefault();
			if (palette.open) {
				palette.close();
			} else {
				prefs.closePanel();
				palette.show(buildCommands({ prefs, tabs, openFileDialog, closeTab }));
			}
			return;
		}
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
		if (mod && tabs.items.length > 1) {
			const dir =
				e.key === "]" || e.key === "ArrowRight" ? 1 :
				e.key === "[" || e.key === "ArrowLeft" ? -1 :
				0;
			if (dir) {
				e.preventDefault();
				tabs.activate(
					(tabs.activeIndex + dir + tabs.items.length) % tabs.items.length,
				);
			}
		}
	}

	$effect(() => {
		prefs.init().catch((err) => console.error("Failed to initialize preferences:", err));

		const unlistenChanged = listen<FileContent>("file-changed", (event) => {
			handleFileChanged(event.payload);
		});

		const unlistenOpen = listen<string>("open-file", (event) => {
			openFile(event.payload);
		});

		const unlistenZoom = listen<"in" | "out" | "reset">("zoom", (event) => {
			const direction = event.payload;
			switch (direction) {
				case "in":
					prefs.zoomIn();
					break;
				case "out":
					prefs.zoomOut();
					break;
				case "reset":
					prefs.resetZoom();
					break;
				default: {
					const _exhaustive: never = direction;
					console.warn(`Unknown zoom direction: ${_exhaustive}`);
				}
			}
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
			clearAllTimers();
		};
	});

</script>

<svelte:head>
	<title>{tabs.active ? `${tabs.active.filename} — peep` : 'peep'}</title>
	{#if prefs.theme.css}
		{@html `<style id="md-theme">${prefs.theme.css}</style>`}
	{/if}
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<Preferences />
<CommandPalette />

<div
	class="app"
	style:--md-content-width={prefs.contentWidthCss}
	style:--md-font-weight={prefs.fontWeightCss}
	style:--md-letter-spacing={prefs.letterSpacingCss}
	style:--md-line-height={prefs.lineHeightCss}
>
	<TabBar onclose={closeTab} />

	<main
		class="content"
		class:no-scroll={!tabs.active}
		style:zoom={prefs.zoomLevel}
		bind:this={contentEl}
		use:scrollSpy={(id) => toc.setActiveId(id)}
	>
		{#if tabs.active}
			<article class="markdown-body" use:copyCode>
				{@html tabs.active.rendered}
			</article>
		{/if}
		<EmptyState onOpenFile={openFileDialog} hidden={!!tabs.active} />
	</main>
	{#if toc.hasHeadings && tabs.active}
		<FloatingDock scrollContainer={contentEl} />
	{/if}
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
		font-family: var(--chrome-font);
		transition:
			background-color 0.2s,
			color 0.2s;
	}

	/* Content area */
	.content {
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
		overscroll-behavior-y: contain;
		scrollbar-gutter: stable;
		contain: content;
	}

	.content::-webkit-scrollbar {
		width: 8px;
	}

	.content::-webkit-scrollbar-track {
		background: transparent;
	}

	.content::-webkit-scrollbar-thumb {
		background: var(--chrome-border);
		border-radius: 4px;
	}

	.content.no-scroll {
		overflow: hidden;
		scrollbar-gutter: auto;
	}
</style>
