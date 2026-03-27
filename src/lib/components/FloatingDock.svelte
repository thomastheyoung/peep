<script lang="ts">
	import { toc } from '$lib/toc';

	interface Props {
		scrollContainer: HTMLElement | undefined;
	}

	let { scrollContainer }: Props = $props();

	let tocOpen = $state(false);
	let dockEl: HTMLElement | undefined = $state();
	let tocEl: HTMLElement | undefined = $state();

	function toggleToc() {
		tocOpen = !tocOpen;
	}

	function handleHeadingClick(id: string) {
		if (!scrollContainer) return;
		const el = scrollContainer.querySelector(`#${CSS.escape(id)}`);
		if (el) {
			el.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}

	function handleWindowClick(e: MouseEvent) {
		if (!tocOpen) return;
		const target = e.target as Node;
		if (dockEl?.contains(target) || tocEl?.contains(target)) return;
		tocOpen = false;
	}

	let minLevel = $derived(
		toc.headings.length > 0
			? Math.min(...toc.headings.map((h) => h.level))
			: 1
	);

	/** Bar width: h1 = 24px, each deeper level = 4px shorter */
	function barWidth(level: number): number {
		return Math.max(8, 24 - (level - minLevel) * 4);
	}

	/** Indent for expanded text: based on depth */
	function indent(level: number): number {
		return (level - minLevel) * 16;
	}
</script>

<svelte:window onclick={handleWindowClick} />

<!-- ToC side strip -->
{#if tocOpen}
	<nav class="toc-strip" bind:this={tocEl} aria-label="Table of contents">
		{#each toc.headings as heading (heading.id)}
			{@const isActive = toc.activeId === heading.id}
			<button
				class="toc-line"
				class:active={isActive}
				onclick={() => handleHeadingClick(heading.id)}
				aria-current={isActive ? 'location' : undefined}
			>
				<span class="toc-bar" style:width="{barWidth(heading.level)}px"></span>
				<span class="toc-label" style:padding-left="{indent(heading.level)}px">
					{heading.text}
				</span>
			</button>
		{/each}
	</nav>
{/if}

<!-- Bottom dock -->
<div class="dock" bind:this={dockEl}>
	<button
		class="dock-btn"
		class:active={tocOpen}
		onclick={toggleToc}
		aria-label="Table of contents"
		aria-expanded={tocOpen}
		type="button"
	>
		<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
			<path d="M3 4h10M3 8h10M3 12h7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
		</svg>
	</button>
</div>

<style>
	/* --------------------------------------------------------
	   Dock — brutalist, matches the tab bar chrome
	   -------------------------------------------------------- */
	.dock {
		position: fixed;
		bottom: 16px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 100;
		display: flex;
		align-items: center;
		gap: 2px;
		padding: 4px;
		background: var(--chrome-surface);
		border: 2px solid var(--chrome-border);
		box-shadow: 3px 3px 0 var(--chrome-border);
		animation: dock-in 200ms ease-out;
	}

	@keyframes dock-in {
		from {
			opacity: 0;
			transform: translateX(-50%) translateY(6px);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
	}

	.dock-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 28px;
		border: none;
		background: transparent;
		color: var(--chrome-text);
		cursor: pointer;
		padding: 0;
		transition:
			background 100ms ease,
			color 100ms ease;
	}

	.dock-btn:hover {
		color: var(--chrome-text-active);
		background: var(--chrome-bg-hover);
	}

	.dock-btn.active {
		color: var(--chrome-text-active);
		background: var(--chrome-border);
	}

	.dock-btn:focus-visible {
		outline: 2px solid var(--chrome-accent);
		outline-offset: -2px;
	}

	/* --------------------------------------------------------
	   ToC strip — left edge, Notion-style minimap
	   -------------------------------------------------------- */
	.toc-strip {
		position: fixed;
		left: 0;
		top: 50%;
		transform: translateY(-50%);
		z-index: 90;
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 8px 0;
		animation: strip-in 150ms ease-out;
	}

	@keyframes strip-in {
		from {
			opacity: 0;
			transform: translateY(-50%) translateX(-4px);
		}
		to {
			opacity: 1;
			transform: translateY(-50%) translateX(0);
		}
	}

	.toc-line {
		all: unset;
		display: flex;
		align-items: center;
		height: 14px;
		cursor: pointer;
		padding-left: 6px;
		padding-right: 8px;
		position: relative;
	}

	.toc-bar {
		display: block;
		height: 2px;
		border-radius: 1px;
		background: currentColor;
		opacity: 0.15;
		flex-shrink: 0;
		transition:
			opacity 150ms ease,
			background 150ms ease;
	}

	.toc-line.active .toc-bar {
		opacity: 1;
		background: var(--md-accent, var(--chrome-accent));
		height: 2.5px;
	}

	.toc-line:hover .toc-bar {
		opacity: 0.5;
	}

	.toc-line.active:hover .toc-bar {
		opacity: 1;
	}

	/* Labels: hidden by default, shown on strip hover */
	.toc-label {
		font-family: var(--chrome-font);
		font-size: var(--chrome-font-size-sm);
		line-height: 1;
		white-space: nowrap;
		opacity: 0;
		max-width: 0;
		overflow: hidden;
		transition:
			opacity 180ms ease,
			max-width 180ms ease;
		color: inherit;
	}

	.toc-strip:hover .toc-label {
		opacity: 0.55;
		max-width: 280px;
	}

	.toc-strip:hover .toc-line.active .toc-label {
		opacity: 1;
		color: var(--md-accent, var(--chrome-accent));
	}

	.toc-strip:hover .toc-line:hover .toc-label {
		opacity: 0.85;
	}

	.toc-strip:hover .toc-line.active:hover .toc-label {
		opacity: 1;
	}

	/* Increase click target on hover */
	.toc-strip:hover .toc-line {
		height: 22px;
	}
</style>
