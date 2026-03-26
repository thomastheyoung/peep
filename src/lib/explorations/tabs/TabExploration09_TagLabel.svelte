<script lang="ts">
	const tabs = ['README.md', 'CHANGELOG.md', 'design-notes.md', 'api-docs.md'];
	let activeIndex = $state(1);

	function close(_index: number) {
		activeIndex = Math.min(activeIndex, tabs.length - 2);
	}
</script>

<div class="exploration">
	<span class="label">09 / Tag label</span>
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
			</button>
		{/each}
	</div>
	<div class="content-area">
		<span class="placeholder">Content for {tabs[activeIndex]}</span>
	</div>
</div>

<style>
	.exploration {
		font-family: 'Georgia', 'Times New Roman', serif;
		width: 560px;
	}

	.label {
		display: block;
		font-family: -apple-system, BlinkMacSystemFont, sans-serif;
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: #7a8a5a;
		margin-bottom: 10px;
	}

	.tab-bar {
		display: flex;
		align-items: flex-end;
		background: #f5f0e8;
		padding: 10px 10px 0;
		gap: 6px;
		border-radius: 6px 6px 0 0;
		border: 1px solid #d8cdb8;
		border-bottom: none;
	}

	.tab {
		all: unset;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 14px 8px 16px;
		font-size: 13px;
		color: #8a7a60;
		background: #e8dfc8;
		clip-path: polygon(
			0% 0%,
			100% 0%,
			100% calc(100% - 10px),
			calc(100% - 10px) 100%,
			0% 100%
		);
		transition: background 0.15s, color 0.15s;
		white-space: nowrap;
		border: 1px solid #d0c4a8;
		border-bottom: none;
		position: relative;
	}

	.tab:hover:not(.active) {
		background: #f0e8d0;
		color: #6a5a3a;
	}

	.tab.active {
		background: #faf6ee;
		color: #3a5a30;
		font-weight: 600;
		border-color: #7a8a5a;
		clip-path: polygon(
			0% 0%,
			100% 0%,
			100% calc(100% - 10px),
			calc(100% - 10px) 100%,
			0% 100%
		);
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
		font-size: 13px;
		line-height: 1;
		border-radius: 3px;
		color: #b0a080;
		cursor: pointer;
		font-family: -apple-system, sans-serif;
	}

	.close:hover {
		background: rgba(0, 0, 0, 0.06);
		color: #6a5a3a;
	}

	.tab.active .close {
		color: #7a8a5a;
	}

	.tab.active .close:hover {
		background: rgba(60, 90, 40, 0.1);
		color: #3a5a30;
	}

	.content-area {
		background: #faf6ee;
		border: 1px solid #d8cdb8;
		border-top: 2px solid #7a8a5a;
		border-radius: 0 0 6px 6px;
		padding: 32px 24px;
		min-height: 60px;
	}

	.placeholder {
		font-size: 13px;
		color: #b0a080;
		font-style: italic;
	}
</style>
