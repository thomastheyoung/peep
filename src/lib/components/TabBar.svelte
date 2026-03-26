<script lang="ts">
	import { getCurrentWindow } from "@tauri-apps/api/window";
	import { getTabs } from "$lib/tabs.svelte";

	let { onclose }: { onclose: (index: number) => void } = $props();

	const tabs = getTabs();
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
				<button
					class="tab"
					class:active={i === tabs.activeIndex}
					style="--tab-color: {tab.color}"
					onclick={() => tabs.activate(i)}
					onmousedown={(e) => handleMiddleClick(e, i)}
					role="tab"
					tabindex={i === tabs.activeIndex ? 0 : -1}
					aria-selected={i === tabs.activeIndex}
					type="button"
				>
					<span class="tab-spacer"></span>
					<span class="tab-name">{tab.filename}</span>
					<span
						class="tab-close"
						onclick={(e: MouseEvent) => {
							e.stopPropagation();
							onclose(i);
						}}
						onkeydown={(e: KeyboardEvent) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								e.stopPropagation();
								onclose(i);
							}
						}}
						tabindex={-1}
						role="button"
						aria-label="Close {tab.filename}"></span
					>
				</button>
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
		gap: 4px;
		padding: 4px 5px;
		font-size: 12px;
		font-weight: 600;
		border: 2px solid #30363d;
		border-radius: 0;
		cursor: pointer;
		white-space: nowrap;
		transition:
			background 0.15s ease,
			color 0.15s ease,
			border-color 0.15s ease,
			box-shadow 0.15s ease,
			transform 0.1s ease;
		font-family: inherit;
		box-shadow: 2px 2px 0 #30363d;
		background: #21262d;
		color: #8b949e;
	}

	.tab:hover:not(.active) {
		background: #282e36;
		color: #c9d1d9;
		transform: translate(-1px, -1px);
		box-shadow: 3px 3px 0 #30363d;
	}

	.tab:active {
		transform: translate(1px, 1px);
		box-shadow: 1px 1px 0 #30363d;
	}

	.tab.active {
		background: var(--tab-color, #58a6ff);
		color: #0d1117;
		border-color: color-mix(in srgb, var(--tab-color, #1f6feb) 80%, #000);
		box-shadow: 2px 2px 0 color-mix(in srgb, var(--tab-color, #1f6feb) 80%, #000);
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
		background: #ef4444;
		color: #fff;
		border-color: #ef4444;
	}
</style>
