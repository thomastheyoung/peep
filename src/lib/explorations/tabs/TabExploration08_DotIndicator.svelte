<script lang="ts">
	const tabs = ['README.md', 'CHANGELOG.md', 'design-notes.md', 'api-docs.md'];
	let activeIndex = $state(1);

	function close(_index: number) {
		activeIndex = Math.min(activeIndex, tabs.length - 2);
	}
</script>

<div class="exploration">
	<span class="label">08 / Dot indicator</span>
	<div class="tab-bar">
		{#each tabs as tab, i (tab)}
			<button
				class="tab"
				class:active={activeIndex === i}
				onclick={() => (activeIndex = i)}
			>
				<span class="tab-text">{tab}</span>
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<span
					class="close"
					role="button"
					tabindex="-1"
					onclick={(e) => { e.stopPropagation(); close(i); }}
				>&times;</span>
				{#if activeIndex === i}
					<span class="dot"></span>
				{/if}
			</button>
		{/each}
	</div>
	<div class="content-area">
		<span class="placeholder">Content for {tabs[activeIndex]}</span>
	</div>
</div>

<style>
	.exploration {
		font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif;
		width: 560px;
	}

	.label {
		display: block;
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: #999;
		margin-bottom: 12px;
	}

	.tab-bar {
		display: flex;
		align-items: center;
		background: #ffffff;
		padding: 0 8px;
		gap: 0;
		border-bottom: 1px solid #f0f0f0;
	}

	.tab {
		all: unset;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0;
		padding: 16px 24px 12px;
		font-size: 13.5px;
		color: #b0b0b0;
		position: relative;
		transition: color 0.2s;
		white-space: nowrap;
	}

	.tab:hover:not(.active) {
		color: #777;
	}

	.tab.active {
		color: #1d1d1f;
		font-weight: 600;
	}

	.tab-text {
		pointer-events: none;
	}

	.close {
		position: absolute;
		top: 8px;
		right: 6px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 14px;
		height: 14px;
		font-size: 12px;
		line-height: 1;
		border-radius: 50%;
		color: transparent;
		cursor: pointer;
		transition: color 0.15s, background 0.15s;
	}

	.tab:hover .close {
		color: #c0c0c0;
	}

	.tab:hover .close:hover {
		background: #f0f0f0;
		color: #666;
	}

	.dot {
		display: block;
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: #0071e3;
		margin-top: 6px;
	}

	.content-area {
		background: #ffffff;
		border: 1px solid #f0f0f0;
		border-top: none;
		border-radius: 0 0 8px 8px;
		padding: 32px 24px;
		min-height: 60px;
	}

	.placeholder {
		font-size: 13px;
		color: #c0c0c0;
		font-style: italic;
	}
</style>
