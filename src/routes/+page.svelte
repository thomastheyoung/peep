<script lang="ts">
	import { invoke } from "@tauri-apps/api/core";
	import { listen } from "@tauri-apps/api/event";
	import { tick, untrack, onDestroy } from "svelte";
	import { tabs, type Tab } from "$lib/tabs.svelte";
	import type { FileContent } from "$lib/types";
	import { preferences as prefs } from "$lib/preferences.svelte";
	import { commandPalette as palette } from "$lib/command-palette.svelte";
	import { updater } from "$lib/updater.svelte";
	import { buildCommands } from "$lib/commands";
	import { openFile, closeTab, openFileDialog, handleFileChanged, clearAllTimers } from "$lib/files";
	import { watchUserThemes } from "$lib/ipc";
	import { copyCode } from "$lib/copy-code";
	import { renderMermaid, rerenderMermaid } from "$lib/mermaid";
	import { scrollSpy } from "$lib/scroll-spy";
	import { toc } from "$lib/toc";
	import TabBar from "$lib/components/TabBar.svelte";
	import FloatingDock from "$lib/components/FloatingDock.svelte";
	import EmptyState from "$lib/components/EmptyStateStamp.svelte";
	import Preferences from "$lib/components/Preferences.svelte";
	import CommandPalette from "$lib/components/CommandPalette.svelte";
	import Toast from "$lib/components/Toast.svelte";
	import "$lib/themes/base.css";
	import "katex/dist/katex.min.css";

	let contentEl: HTMLElement | undefined = $state();
	let articleEl: HTMLElement | undefined = $state();

	// Theme CSS injection.
	//
	// This used to be {@html} rendering a raw string containing a style
	// element into <svelte:head>. That is an XSS sink: {@html} hands the
	// string straight to the HTML parser, and a style element is "raw text"
	// per the HTML spec — the parser scans for the literal characters that
	// close it and does not care that they came from a CSS comment or a
	// `content: "..."` string. A theme containing that closing sequence
	// anywhere ends the element early, and the rest is parsed as live HTML in
	// <head>. There is no CSS-level escape: CSS cannot say "don't close my
	// parent tag." Setting `.textContent` instead goes through the DOM text
	// API, so the parser is never invoked on theme data and the sink does not
	// exist — this is not a blocklist that could have a gap.
	//
	// Removal is deliberately on unmount (onDestroy) and NOT an $effect
	// cleanup. An $effect's returned teardown runs before EVERY re-run, so
	// returning `styleEl.remove()` would destroy and rebuild the node on every
	// theme switch — and would make the reuse branch below dead code. Reuse is
	// the point: the same node is repopulated in place.
	//
	// In production this component's root never unmounts, so onDestroy never
	// fires — but Storybook and HMR both remount it, and a leftover node from
	// a previous mount would race the new one in the cascade depending on
	// creation order.
	let themeStyleEl: HTMLStyleElement | undefined;

	$effect(() => {
		// Created lazily in the effect, not at module scope: SSR is disabled
		// here, but module-level `document` access breaks any non-browser
		// evaluation (Vitest, a future SSR build).
		if (!themeStyleEl) {
			themeStyleEl = document.createElement("style");
			themeStyleEl.id = "md-theme";
			document.head.appendChild(themeStyleEl);
		}
		// The empty string is a valid, expected value (no theme loaded yet).
		// The old code guarded injection with {#if}, which is what allowed a
		// previous theme's CSS to linger; writing unconditionally clears it.
		themeStyleEl.textContent = prefs.theme.css;
	});

	onDestroy(() => {
		themeStyleEl?.remove();
		themeStyleEl = undefined;
	});

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

	function openPalette() {
		prefs.closePanel();
		palette.show(buildCommands({ prefs, tabs, updater, openFileDialog, closeTab }));
	}

	function handleKeydown(e: KeyboardEvent) {
		const mod = e.metaKey || e.ctrlKey;
		if (mod && e.key === "k") {
			e.preventDefault();
			if (palette.open) {
				palette.close();
			} else {
				openPalette();
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

		// Native "Check for Updates…" menu item. Opens the palette so the user
		// gets feedback — unlike the silent launch check below.
		const unlistenCheckUpdates = listen("check-updates", () => {
			updater.check().finally(openPalette);
		});

		// `user-themes-changed` is a BARE SIGNAL (no payload) emitted by the
		// Rust filesystem watcher on the themes directory — any add/edit/delete
		// fires it. Debounced 150ms to match the precedent at files.ts:50-65
		// (`handleFileChanged`): an editor saving a theme file can fire several
		// filesystem events in quick succession, and each would otherwise mean
		// its own `discover()` round trip. `redetectThemes()` both re-runs
		// discovery AND reconciles the active theme against the fresh result,
		// so a deleted active theme falls back and persists instead of leaving
		// stale CSS applied while a broken id waits to be written on the next
		// unrelated setter call.
		let userThemesChangedTimer: ReturnType<typeof setTimeout> | undefined;
		const unlistenUserThemesChanged = listen("user-themes-changed", () => {
			clearTimeout(userThemesChangedTimer);
			userThemesChangedTimer = setTimeout(() => {
				prefs.redetectThemes().catch((err) => console.error("Failed to redetect user themes:", err));
			}, 150);
		});

		// Idempotent on the Rust side — started once at startup so theme file
		// changes are live-reloaded for the rest of the session without the
		// user needing to reopen Preferences.
		watchUserThemes().catch((err) => console.error("Failed to watch user themes:", err));

		invoke<string[]>("get_initial_files").then(async (files) => {
			for (const path of files) {
				await openFile(path);
			}
		});

		// Deferred so the launch check never competes with first paint:
		// get_initial_files -> openFile -> shiki init all want the main thread.
		// `checkOnce` latches internally, so an HMR re-run won't re-check.
		const autoCheckTimer = setTimeout(() => {
			updater.checkOnce().catch(() => {});
		}, 3000);

		// Preferences are written through a 150ms debounce, so quitting right
		// after a change would drop it. localStorage writes used to be synchronous
		// and free; on-disk writes are not, and this app persists window geometry
		// across sessions, so users expect settings to survive a quit.
		const flushPrefs = () => {
			prefs.flush().catch(() => {});
		};
		window.addEventListener("beforeunload", flushPrefs);

		return () => {
			unlistenChanged.then((fn) => fn());
			unlistenOpen.then((fn) => fn());
			unlistenZoom.then((fn) => fn());
			unlistenCheckUpdates.then((fn) => fn());
			unlistenUserThemesChanged.then((fn) => fn());
			clearTimeout(userThemesChangedTimer);
			clearTimeout(autoCheckTimer);
			window.removeEventListener("beforeunload", flushPrefs);
			clearAllTimers();
		};
	});

</script>

<svelte:head>
	<title>{tabs.active ? `${tabs.active.filename} — peep` : 'peep'}</title>
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<Preferences />
<CommandPalette />
<Toast />

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
