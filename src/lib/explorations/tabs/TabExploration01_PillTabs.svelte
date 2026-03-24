<script lang="ts">
	const tabs = ['README.md', 'CHANGELOG.md', 'design-notes.md', 'api-docs.md'];
	let activeIndex = $state(1);
</script>

<div class="container">
	<span class="label">01 / Pill tabs</span>
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
		background: #fafafa;
		border-radius: 12px;
	}

	.label {
		display: block;
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: #94a3b8;
		margin-bottom: 12px;
	}

	.tab-bar {
		display: flex;
		gap: 6px;
		padding: 4px;
		background: #f1f5f9;
		border-radius: 12px;
	}

	.tab {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 0 4px 0 0;
		border-radius: 10px;
		transition: all 0.2s ease;
	}

	.tab:hover:not(.active) {
		background: #e2e8f0;
	}

	.tab.active {
		background: #6366f1;
		box-shadow: 0 1px 3px rgba(99, 102, 241, 0.4);
	}

	.tab-button {
		padding: 8px 8px 8px 16px;
		border: none;
		border-radius: 10px 0 0 10px;
		background: transparent;
		color: #64748b;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		white-space: nowrap;
	}

	.tab:hover:not(.active) .tab-button {
		color: #475569;
	}

	.tab.active .tab-button {
		color: #fff;
	}

	.close {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		padding: 0;
		border: none;
		border-radius: 50%;
		background: transparent;
		color: #64748b;
		font-size: 14px;
		line-height: 1;
		cursor: pointer;
		transition: background 0.15s ease;
	}

	.tab.active .close {
		color: #fff;
	}

	.tab:not(.active) .close:hover {
		background: #cbd5e1;
	}

	.tab.active .close:hover {
		background: rgba(255, 255, 255, 0.25);
	}
</style>
