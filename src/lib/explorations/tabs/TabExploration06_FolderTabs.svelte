<script lang="ts">
	const tabs = ['README.md', 'CHANGELOG.md', 'design-notes.md', 'api-docs.md'];
	let activeIndex = $state(1);

	function close(index: number) {
		// Visual demo only — no real close logic
		activeIndex = Math.min(activeIndex, tabs.length - 2);
	}
</script>

<div class="exploration">
	<span class="label">06 / Folder tabs</span>
	<div class="tab-bar">
		{#each tabs as tab, i (tab)}
			<button
				class="tab"
				class:active={activeIndex === i}
				onclick={() => (activeIndex = i)}
			>
				<span class="tab-inner">
					<span class="tab-text">{tab}</span>
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<span
						class="close"
						role="button"
						tabindex="-1"
						onclick={(e) => { e.stopPropagation(); close(i); }}
					>&times;</span>
				</span>
			</button>
		{/each}
		<div class="bar-fill"></div>
	</div>
	<div class="content-area">
		<span class="placeholder">Content for {tabs[activeIndex]}</span>
	</div>
</div>

<style>
	.exploration {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		width: 520px;
	}

	.label {
		display: block;
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: #8b7355;
		margin-bottom: 8px;
	}

	.tab-bar {
		display: flex;
		align-items: flex-end;
		padding: 0 4px;
		gap: 0;
		border-bottom: 2px solid #c4a97d;
		position: relative;
	}

	.bar-fill {
		flex: 1;
	}

	.tab {
		all: unset;
		cursor: pointer;
		position: relative;
		bottom: -2px;
		padding: 7px 14px 8px;
		font-size: 13px;
		color: #7a6a52;
		background: #e8dcc8;
		border: 2px solid #c4a97d;
		border-bottom: 2px solid #c4a97d;
		border-radius: 8px 8px 0 0;
		margin-right: -1px;
		z-index: 0;
		clip-path: polygon(
			8% 0%,
			92% 0%,
			100% 30%,
			100% 100%,
			0% 100%,
			0% 30%
		);
		transition: background 0.15s, color 0.15s;
	}

	.tab:hover:not(.active) {
		background: #f0e6d2;
	}

	.tab.active {
		background: #faf5ec;
		color: #4a3c28;
		font-weight: 600;
		border-bottom-color: #faf5ec;
		z-index: 2;
		clip-path: polygon(
			6% 0%,
			94% 0%,
			100% 25%,
			100% 100%,
			0% 100%,
			0% 25%
		);
	}

	.tab-inner {
		display: flex;
		align-items: center;
		gap: 8px;
		white-space: nowrap;
	}

	.tab-text {
		pointer-events: none;
	}

	.close {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 16px;
		height: 16px;
		font-size: 14px;
		line-height: 1;
		border-radius: 3px;
		color: #a0906e;
		cursor: pointer;
	}

	.close:hover {
		background: rgba(0, 0, 0, 0.08);
		color: #5a4a30;
	}

	.content-area {
		background: #faf5ec;
		border: 2px solid #c4a97d;
		border-top: none;
		border-radius: 0 0 6px 6px;
		padding: 32px 24px;
		min-height: 60px;
	}

	.placeholder {
		font-size: 13px;
		color: #a09080;
		font-style: italic;
	}
</style>
