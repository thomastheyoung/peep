<script lang="ts">
	import { invoke } from "@tauri-apps/api/core";
	import { listen } from "@tauri-apps/api/event";
	import { tick, untrack } from "svelte";
	import { tabs, type Tab } from "$lib/tabs.svelte";
	import type { FileContent } from "$lib/types";
	import { preferences as prefs } from "$lib/preferences.svelte";
	import { commandPalette as palette } from "$lib/command-palette.svelte";
	import { buildCommands } from "$lib/commands";
	import { openFile, closeTab, openFileDialog, handleFileChanged, clearAllTimers } from "$lib/files";
	import { copyCode } from "$lib/copy-code";
	import { renderMermaid, rerenderMermaid } from "$lib/mermaid";
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
	let articleEl: HTMLElement | undefined = $state();

	// Re-render mermaid diagrams when the theme CSS changes (dark ↔ light)
	$effect(() => {
		prefs.theme.css; // track theme changes
		if (articleEl) rerenderMermaid(articleEl);
	});

	/* ---------------------------------------------------------------
	   Per-tab scroll position

	   There is one scroll container for every tab — switching tabs only swaps
	   its innerHTML, so `scrollTop` would otherwise carry over between
	   documents. Position is saved per tab on scroll and restored whenever the
	   displayed document changes.

	   All measurements use `offsetTop`/`scrollTop`, never `getBoundingClientRect()`:
	   the container carries `style:zoom`, and rects are in zoomed viewport
	   coordinates while offsets and scrollTop are unzoomed. Mixing the two
	   breaks restore at any zoom level other than 1.
	   --------------------------------------------------------------- */

	const HEADING_SELECTOR = "h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]";
	const ANCHOR_DEBOUNCE_MS = 150;

	/**
	 * Which tab the container is currently *displaying* — deliberately not
	 * `$state`, and deliberately not the same thing as `tabs.active`. Scroll
	 * events arriving mid-switch (including the ones a programmatic restore
	 * emits) are saved against this, so a late event writes the position it
	 * actually describes rather than corrupting the incoming tab.
	 */
	let displayedTab: Tab | undefined;
	/** Tab the most recent scroll event belonged to; the pending frame saves to this. */
	let pendingTab: Tab | undefined;
	let scrollRaf = false;
	let anchorTimer: ReturnType<typeof setTimeout> | undefined;

	/** Nearest heading at or above the current scroll offset. */
	function findAnchor(article: HTMLElement, container: HTMLElement): HTMLElement | null {
		const headings = article.querySelectorAll<HTMLElement>(HEADING_SELECTOR);
		let anchor: HTMLElement | null = null;
		for (const h of headings) {
			if (h.offsetTop <= container.scrollTop) anchor = h;
			else break;
		}
		return anchor;
	}

	function handleScroll() {
		if (!displayedTab) return;
		// Record the *latest* target even when a frame is already pending: the
		// coalesced frame must save to the tab that is displayed now, not to
		// whichever event happened to win the race to schedule it.
		pendingTab = displayedTab;
		clearTimeout(anchorTimer);
		if (scrollRaf) return;
		scrollRaf = true;
		requestAnimationFrame(() => {
			scrollRaf = false;
			const target = pendingTab;
			if (!contentEl || !target || target !== displayedTab) return;
			target.scroll.top = contentEl.scrollTop;

			// The anchor costs a layout read per heading, so it lags the cheap
			// pixel save. Worst case the anchor is one heading stale, and
			// `top` is always current.
			anchorTimer = setTimeout(() => {
				if (!contentEl || !articleEl || target !== displayedTab) return;
				const anchor = findAnchor(articleEl, contentEl);
				target.scroll.headingId = anchor?.id ?? null;
				target.scroll.headingOffset = anchor?.offsetTop ?? 0;
			}, ANCHOR_DEBOUNCE_MS);
		});
	}

	function applyRestore(tab: Tab, container: HTMLElement) {
		const { top, headingId, headingOffset } = tab.scroll;
		let target = top;
		if (headingId) {
			const anchor = container.querySelector<HTMLElement>(`#${CSS.escape(headingId)}`);
			// Re-anchor to where the heading sits *now*, keeping the saved
			// distance from it. Immune to content above it having grown.
			if (anchor) target = anchor.offsetTop - headingOffset + top;
		}
		const max = Math.max(0, container.scrollHeight - container.clientHeight);
		// Plain assignment: per CSSOM View, performing a scroll aborts any
		// ongoing smooth scroll (e.g. a TOC click) on the same box.
		container.scrollTop = Math.max(0, Math.min(max, target));
	}

	// Attached explicitly rather than via `onscroll` because Svelte only marks
	// touchstart/touchmove as passive, and scroll-spy attaches a passive
	// listener to this same element.
	$effect(() => {
		const container = contentEl;
		if (!container) return;
		container.addEventListener("scroll", handleScroll, { passive: true });
		return () => container.removeEventListener("scroll", handleScroll);
	});

	// Tracks both tab identity and rendered content, so this covers switching
	// tabs *and* a live reload replacing the active tab's DOM in place.
	$effect(() => {
		const tab = tabs.active;
		tab?.path;
		tab?.rendered;

		untrack(() => {
			// Retarget before any write so scroll events emitted by the restore
			// below are attributed to the incoming tab, and a pending anchor
			// computation for the outgoing tab is discarded.
			clearTimeout(anchorTimer);
			displayedTab = tab;
			pendingTab = tab;
			if (!tab || !contentEl) return;
			const container = contentEl;
			tick().then(() => {
				// Rapid switches queue multiple restores; only the newest wins.
				if (tabs.active !== tab) return;
				applyRestore(tab, container);
			});
		});
	});

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
		use:scrollSpy={{
			key: tabs.active?.path ?? "",
			onActiveChange: (id) => toc.setActiveId(id),
		}}
	>
		{#if tabs.active}
			<article class="markdown-body" use:copyCode use:renderMermaid bind:this={articleEl}>
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
		/* `contain: content` implies `contain: layout`, which makes this element
		   a containing block for absolutely-positioned descendants and therefore
		   the `offsetParent` of the headings inside. Per-tab scroll restore
		   measures heading `offsetTop` against this element — removing this
		   would silently reparent those offsets to <body> and break restore. */
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
