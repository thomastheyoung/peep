<script lang="ts">
	const tabs = ['README.md', 'CHANGELOG.md', 'design-notes.md', 'api-docs.md'];
	let activeIndex = $state(1);
</script>

<div class="container">
	<span class="label">17 / Chip tabs</span>
	<div class="tab-bar">
		{#each tabs as tab, i (tab)}
			<button
				class="tab"
				class:active={activeIndex === i}
				onclick={() => (activeIndex = i)}
			>
				<span class="tab-name">{tab}</span>
				<span class="close" role="button" tabindex="-1" onkeydown={(e) => e.key === 'Enter' && e.stopPropagation()} onclick={(e) => e.stopPropagation()}>×</span>
			</button>
		{/each}
	</div>
</div>

<style>
	.container {
		font-family: 'Google Sans', 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif;
		padding: 20px;
		background: #fef7ff;
		border-radius: 12px;
	}

	.label {
		display: block;
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: #9a8da3;
		margin-bottom: 12px;
	}

	.tab-bar {
		display: flex;
		gap: 8px;
		padding: 4px 0;
	}

	.tab {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 8px 16px;
		border: 1px solid #cac4cf;
		border-radius: 100px;
		background: transparent;
		color: #49454f;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
		white-space: nowrap;
		letter-spacing: 0.01em;
	}

	.tab:hover:not(.active) {
		background: rgba(103, 80, 164, 0.08);
		border-color: #a89bb2;
	}

	.tab.active {
		background: #e8def8;
		border-color: transparent;
		color: #1d192b;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
	}

	.tab:active {
		transform: scale(0.97);
	}

	.close {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		border: none;
		padding: 0;
		border-radius: 50%;
		background: transparent;
		color: inherit;
		font-size: 13px;
		line-height: 1;
		cursor: pointer;
		transition: background 0.15s ease;
		margin-left: 2px;
		margin-right: -4px;
	}

	.tab:not(.active) .close:hover {
		background: rgba(103, 80, 164, 0.12);
	}

	.tab.active .close:hover {
		background: rgba(103, 80, 164, 0.16);
	}
</style>
