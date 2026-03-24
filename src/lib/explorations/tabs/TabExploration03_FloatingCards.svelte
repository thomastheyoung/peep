<script lang="ts">
	const tabs = ['README.md', 'CHANGELOG.md', 'design-notes.md', 'api-docs.md'];
	let activeIndex = $state(1);
</script>

<div class="container">
	<span class="label">03 / Floating cards</span>
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
		background: #f8fafc;
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
		gap: 8px;
		padding: 4px 0;
	}

	.tab {
		display: flex;
		align-items: center;
		border: 1px solid #e2e8f0;
		border-left: 3px solid transparent;
		border-radius: 8px;
		background: #fff;
		transition: all 0.2s ease;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
	}

	.tab:hover:not(.active) {
		border-color: #cbd5e1;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
	}

	.tab.active {
		border-left-color: #6366f1;
		background: #fff;
		box-shadow:
			0 4px 12px rgba(0, 0, 0, 0.08),
			0 1px 3px rgba(0, 0, 0, 0.04);
		transform: translateY(-1px);
	}

	.tab-button {
		padding: 10px 8px 10px 16px;
		border: none;
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
		color: #1e293b;
	}

	.close {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		margin-right: 10px;
		padding: 0;
		border: none;
		border-radius: 4px;
		background: transparent;
		color: #94a3b8;
		font-size: 14px;
		line-height: 1;
		cursor: pointer;
		transition: background 0.15s ease;
	}

	.close:hover {
		background: #f1f5f9;
	}
</style>
