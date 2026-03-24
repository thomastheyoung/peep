<script lang="ts">
	const tabs = ['README.md', 'CHANGELOG.md', 'design-notes.md', 'api-docs.md'];
	let activeIndex = $state(1);

	function close(index: number) {
		activeIndex = Math.min(activeIndex, tabs.length - 2);
	}
</script>

<div class="exploration">
	<span class="label">07 / Slash diagonal</span>
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
		font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
		width: 560px;
	}

	.label {
		display: block;
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: #f0a030;
		margin-bottom: 8px;
	}

	.tab-bar {
		display: flex;
		align-items: stretch;
		background: #1a1a2e;
		padding: 6px 6px 0;
		gap: 3px;
		border-radius: 8px 8px 0 0;
	}

	.tab {
		all: unset;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 9px 18px 9px 14px;
		font-size: 12.5px;
		color: #6a6a8a;
		background: #16162a;
		clip-path: polygon(0% 0%, calc(100% - 14px) 0%, 100% 100%, 0% 100%);
		transition: background 0.15s, color 0.15s;
		white-space: nowrap;
	}

	.tab:hover:not(.active) {
		background: #22224a;
		color: #9a9ab8;
	}

	.tab.active {
		background: #0e0e1a;
		color: #f0a030;
		font-weight: 600;
		clip-path: polygon(0% 0%, calc(100% - 14px) 0%, 100% 100%, 0% 100%);
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
		color: #4a4a6a;
		cursor: pointer;
		flex-shrink: 0;
	}

	.close:hover {
		background: rgba(240, 160, 48, 0.15);
		color: #f0a030;
	}

	.tab.active .close {
		color: #c08020;
	}

	.content-area {
		background: #0e0e1a;
		border: 1px solid #2a2a4a;
		border-top: 2px solid #f0a030;
		border-radius: 0 0 6px 6px;
		padding: 32px 24px;
		min-height: 60px;
	}

	.placeholder {
		font-size: 12px;
		color: #4a4a6a;
		font-style: italic;
	}
</style>
