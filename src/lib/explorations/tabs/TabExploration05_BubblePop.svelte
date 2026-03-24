<script lang="ts">
	const tabs = ['README.md', 'CHANGELOG.md', 'design-notes.md', 'api-docs.md'];
	let activeIndex = $state(1);
</script>

<div class="container">
	<span class="label">05 / Bubble pop</span>
	<div class="tab-bar">
		{#each tabs as tab, i (tab)}
			<div class="tab" class:active={activeIndex === i}>
				<button class="tab-button" onclick={() => (activeIndex = i)}>
					{tab}
				</button>
				<button class="close" onclick={() => {}}>×</button>
			</div>
		{/each}
	</div>
</div>

<style>
	.container {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
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
		color: #c084fc;
		margin-bottom: 12px;
	}

	.tab-bar {
		display: flex;
		gap: 8px;
	}

	.tab {
		display: flex;
		align-items: center;
		border: none;
		border-radius: 999px;
		background: #fae8ff;
		transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.tab:hover:not(.active) {
		background: #f5d0fe;
		transform: scale(1.03);
	}

	.tab.active {
		background: linear-gradient(135deg, #ec4899, #f97316);
		box-shadow: 0 4px 14px rgba(236, 72, 153, 0.35);
		transform: scale(1.05);
	}

	.tab-button {
		padding: 10px 8px 10px 20px;
		border: none;
		background: transparent;
		color: #a855f7;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		white-space: nowrap;
	}

	.tab.active .tab-button {
		color: #fff;
	}

	.close {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		margin-right: 12px;
		padding: 0;
		border: none;
		border-radius: 50%;
		background: transparent;
		color: #a855f7;
		font-size: 14px;
		line-height: 1;
		cursor: pointer;
		transition: background 0.15s ease;
	}

	.tab.active .close {
		color: #fff;
	}

	.tab:not(.active) .close:hover {
		background: rgba(168, 85, 247, 0.15);
	}

	.tab.active .close:hover {
		background: rgba(255, 255, 255, 0.3);
	}
</style>
