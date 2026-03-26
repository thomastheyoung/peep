<script lang="ts">
	import { getToc } from "$lib/toc.svelte";

	interface Props {
		scrollContainer: HTMLElement | undefined;
		onClose: () => void;
	}

	let { scrollContainer, onClose }: Props = $props();
	const toc = getToc();
	let listEl: HTMLElement | undefined = $state();

	$effect(() => {
		const id = toc.activeId;
		if (!id || !listEl) return;
		const el = listEl.querySelector(`[data-heading-id="${CSS.escape(id)}"]`);
		if (el) el.scrollIntoView({ block: "nearest" });
	});

	function scrollToHeading(id: string) {
		if (!scrollContainer) return;
		const el = scrollContainer.querySelector(`#${CSS.escape(id)}`);
		if (el) {
			el.scrollIntoView({ behavior: "smooth", block: "start" });
		}
	}

	function minLevel(): number {
		return Math.min(...toc.headings.map((h) => h.level));
	}

	function indent(level: number): number {
		return (level - minLevel()) * 12 + 12;
	}
</script>

<aside class="toc-panel">
	<div class="toc-chrome">
		<span class="toc-title">On this page</span>
		<button class="toc-close" onclick={onClose} type="button" aria-label="Close table of contents">
			<svg width="10" height="10" viewBox="0 0 10 10" fill="none">
				<path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
			</svg>
		</button>
	</div>
	<nav class="toc-list" bind:this={listEl}>
		{#each toc.headings as heading (heading.id)}
			<button
				class="toc-item"
				class:active={toc.activeId === heading.id}
				style:padding-left="{indent(heading.level)}px"
				onclick={() => scrollToHeading(heading.id)}
				data-heading-id={heading.id}
				type="button"
			>
				{heading.text}
			</button>
		{/each}
	</nav>
</aside>

<style>
	.toc-panel {
		position: fixed;
		top: 56px;
		right: 12px;
		bottom: 12px;
		width: 240px;
		display: flex;
		flex-direction: column;
		border-radius: 10px;
		background: color-mix(in srgb, currentColor 6%, transparent);
		backdrop-filter: blur(24px) saturate(1.4);
		-webkit-backdrop-filter: blur(24px) saturate(1.4);
		border: 1px solid color-mix(in srgb, currentColor 10%, transparent);
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.12),
			0 2px 8px rgba(0, 0, 0, 0.08);
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica,
			Arial, sans-serif;
		font-size: 12.5px;
		font-weight: 400;
		font-style: normal;
		letter-spacing: normal;
		line-height: 1.4;
		z-index: 100;
		animation: toc-in 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	@keyframes toc-in {
		from {
			opacity: 0;
			transform: translateX(8px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	.toc-chrome {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 10px 12px 6px;
		flex-shrink: 0;
	}

	.toc-title {
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		opacity: 0.4;
	}

	.toc-close {
		all: unset;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		border-radius: 5px;
		cursor: pointer;
		opacity: 0.35;
		transition:
			opacity 0.15s ease,
			background 0.15s ease;
	}

	.toc-close:hover {
		opacity: 0.7;
		background: color-mix(in srgb, currentColor 10%, transparent);
	}

	.toc-close:focus-visible {
		outline: 1px solid var(--md-accent, #58a6ff);
		outline-offset: -1px;
		opacity: 0.7;
	}

	.toc-list {
		display: flex;
		flex-direction: column;
		overflow-y: auto;
		padding: 2px 0 10px;
		flex: 1;
		min-height: 0;
	}

	.toc-list::-webkit-scrollbar {
		width: 4px;
	}

	.toc-list::-webkit-scrollbar-track {
		background: transparent;
	}

	.toc-list::-webkit-scrollbar-thumb {
		background: color-mix(in srgb, currentColor 15%, transparent);
		border-radius: 2px;
	}

	.toc-item {
		all: unset;
		display: block;
		padding: 3px 12px;
		cursor: pointer;
		opacity: 0.4;
		transition:
			opacity 0.15s ease,
			color 0.15s ease,
			border-color 0.15s ease;
		border-left: 2px solid transparent;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.toc-item:hover {
		opacity: 0.7;
	}

	.toc-item:focus-visible {
		opacity: 0.7;
		outline: 1px solid var(--md-accent, #58a6ff);
		outline-offset: -1px;
		border-radius: 3px;
	}

	.toc-item.active {
		opacity: 1;
		color: var(--md-accent, #58a6ff);
		border-left-color: var(--md-accent, #58a6ff);
	}
</style>
