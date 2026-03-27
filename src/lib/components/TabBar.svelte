<script lang="ts">
	import { getCurrentWindow } from "@tauri-apps/api/window";
	import { tabs } from "$lib/tabs.svelte";

	interface Props {
		onclose: (index: number) => void;
	}

	let { onclose }: Props = $props();
	const appWindow = getCurrentWindow();

	function handleDrag(e: MouseEvent) {
		if (e.button !== 0) return;
		if (!(e.target instanceof HTMLElement)) return;
		if (e.target.closest(".tab, button")) return;
		appWindow.startDragging();
	}

	function handleMiddleClick(e: MouseEvent, index: number) {
		if (e.button === 1) {
			e.preventDefault();
			onclose(index);
		}
	}

	function handleTabListKeydown(e: KeyboardEvent) {
		if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
			e.preventDefault();
			const dir = e.key === "ArrowRight" ? 1 : -1;
			const next = (tabs.activeIndex + dir + tabs.items.length) % tabs.items.length;
			tabs.activate(next);
			const tablist = e.currentTarget as HTMLElement;
			const tabEls = tablist.querySelectorAll('[role="tab"]');
			(tabEls[next] as HTMLElement | undefined)?.focus();
		}
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<header class="titlebar" data-tauri-drag-region onmousedown={handleDrag}>
	<div class="titlebar-spacer" data-tauri-drag-region></div>
	{#if tabs.items.length > 0}
		<div class="tabs" role="tablist" tabindex={-1} onkeydown={handleTabListKeydown}>
			{#each tabs.items as tab, i}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="tab"
					class:active={i === tabs.activeIndex}
					style="--tab-color: {tab.color}"
					onmousedown={(e) => handleMiddleClick(e, i)}
				>
					<button
						class="tab-label"
						type="button"
						role="tab"
						tabindex={i === tabs.activeIndex ? 0 : -1}
						aria-selected={i === tabs.activeIndex}
						onclick={() => tabs.activate(i)}
					>
						<span class="tab-spacer"></span>
						<span class="tab-name">{tab.filename}</span>
					</button>
					<button
						class="tab-close"
						type="button"
						onclick={() => onclose(i)}
						tabindex={-1}
						aria-label="Close {tab.filename}"
					></button>
				</div>
			{/each}
		</div>
	{/if}
</header>

<style>
	.titlebar {
		display: flex;
		align-items: center;
		height: 44px;
		flex-shrink: 0;
		user-select: none;
		-webkit-user-select: none;
		background: var(--chrome-bg);
		border-bottom: 1px solid var(--chrome-border);
		font-family: var(--chrome-font);
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
		gap: 0;
		padding: 0;
		font-size: var(--chrome-font-size-sm);
		font-weight: 600;
		border: var(--chrome-border-width) solid var(--chrome-border);
		border-radius: var(--chrome-radius);
		white-space: nowrap;
		transition:
			background 0.15s ease,
			color 0.15s ease,
			border-color 0.15s ease,
			box-shadow 0.15s ease,
			transform 0.1s ease;
		font-family: inherit;
		box-shadow: 2px 2px 0 var(--chrome-border);
		background: var(--chrome-surface);
		color: var(--chrome-text);
	}

	.tab-label {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 4px 0 4px 5px;
		cursor: pointer;
		background: none;
		border: none;
		color: inherit;
		font: inherit;
	}

	.tab-label:focus-visible {
		outline: 2px solid var(--chrome-accent);
		outline-offset: -2px;
	}

	.tab:hover:not(.active) {
		background: var(--chrome-bg-hover);
		color: var(--chrome-text-active);
		transform: translate(-1px, -1px);
		box-shadow: 3px 3px 0 var(--chrome-border);
	}

	.tab:active {
		transform: translate(1px, 1px);
		box-shadow: 1px 1px 0 var(--chrome-border);
	}

	.tab.active {
		background: var(--tab-color, var(--chrome-accent));
		color: var(--chrome-bg);
		border-color: color-mix(in srgb, var(--tab-color, var(--chrome-accent)) 80%, #000);
		box-shadow: 2px 2px 0 color-mix(in srgb, var(--tab-color, var(--chrome-accent)) 80%, #000);
	}

	.tab-name {
		max-width: 160px;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.tab-spacer {
		width: 14px;
		flex-shrink: 0;
	}

	.tab-close {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 14px;
		height: 14px;
		flex-shrink: 0;
		margin: 0 5px 0 4px;
		border: 1px solid currentColor;
		border-radius: 0;
		cursor: pointer;
		opacity: 0;
		transition:
			opacity 0.15s ease,
			background 0.1s ease,
			color 0.1s ease,
			border-color 0.1s ease;
		background: transparent;
		color: inherit;
		padding: 0;
	}

	.tab-close::before,
	.tab-close::after {
		content: '';
		position: absolute;
		width: 8px;
		height: 1.5px;
		background: currentColor;
	}

	.tab-close::before {
		transform: rotate(45deg);
	}

	.tab-close::after {
		transform: rotate(-45deg);
	}

	.tab:hover .tab-close {
		opacity: 0.6;
	}

	.tab-close:hover {
		opacity: 1 !important;
		background: var(--chrome-danger, #ef4444);
		color: #fff;
		border-color: var(--chrome-danger, #ef4444);
	}
</style>
