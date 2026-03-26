<script lang="ts">
	const tabs = ['README.md', 'CHANGELOG.md', 'design-notes.md', 'api-docs.md'];
	let activeIndex = $state(1);

	function close(_index: number) {
		activeIndex = Math.min(activeIndex, tabs.length - 2);
	}
</script>

<div class="exploration">
	<span class="label">10 / Ribbon tabs</span>
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
		font-family: 'Palatino Linotype', 'Book Antiqua', Palatino, serif;
		width: 580px;
	}

	.label {
		display: block;
		font-family: -apple-system, BlinkMacSystemFont, sans-serif;
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: #8b3a3a;
		margin-bottom: 10px;
	}

	.tab-bar {
		display: flex;
		align-items: flex-end;
		padding: 8px 16px 0;
		gap: 8px;
		background: #f8f6f3;
		border-radius: 6px 6px 0 0;
	}

	.tab {
		all: unset;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 9px 20px 9px 16px;
		font-size: 13px;
		color: #999;
		background: #d5d0c8;
		position: relative;
		white-space: nowrap;
		transition: background 0.15s, color 0.15s;
	}

	/* Left fold */
	.tab::before {
		content: '';
		position: absolute;
		bottom: -6px;
		left: 0;
		width: 8px;
		height: 6px;
		background: #b8b3aa;
		clip-path: polygon(100% 0%, 0% 0%, 100% 100%);
	}

	/* Right fold */
	.tab::after {
		content: '';
		position: absolute;
		bottom: -6px;
		right: 0;
		width: 8px;
		height: 6px;
		background: #b8b3aa;
		clip-path: polygon(0% 0%, 100% 0%, 0% 100%);
	}

	.tab:hover:not(.active) {
		background: #c8c3b8;
		color: #666;
	}

	.tab:hover:not(.active)::before {
		background: #a8a39a;
	}

	.tab:hover:not(.active)::after {
		background: #a8a39a;
	}

	.tab.active {
		background: #7a2030;
		color: #f8e8e0;
		font-weight: 600;
	}

	.tab.active::before {
		background: #5a1520;
		clip-path: polygon(100% 0%, 0% 0%, 100% 100%);
	}

	.tab.active::after {
		background: #5a1520;
		clip-path: polygon(0% 0%, 100% 0%, 0% 100%);
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
		color: #aaa;
		cursor: pointer;
		font-family: -apple-system, sans-serif;
	}

	.close:hover {
		background: rgba(0, 0, 0, 0.08);
		color: #666;
	}

	.tab.active .close {
		color: rgba(255, 255, 255, 0.5);
	}

	.tab.active .close:hover {
		background: rgba(255, 255, 255, 0.12);
		color: #fff;
	}

	.content-area {
		background: #f8f6f3;
		border: 1px solid #e0dcd4;
		border-top: 2px solid #7a2030;
		border-radius: 0 0 6px 6px;
		padding: 32px 24px;
		min-height: 60px;
	}

	.placeholder {
		font-size: 13px;
		color: #bbb;
		font-style: italic;
	}
</style>
