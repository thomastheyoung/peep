<script lang="ts">
	const tabs = ['README.md', 'CHANGELOG.md', 'design-notes.md', 'api-docs.md'];
	let activeIndex = $state(1);
</script>

<div class="container">
	<span class="label">04 / Neon outline</span>
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
		background: #0f172a;
		border-radius: 12px;
	}

	.label {
		display: block;
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: #475569;
		margin-bottom: 12px;
	}

	.tab-bar {
		display: flex;
		gap: 8px;
	}

	.tab {
		display: flex;
		align-items: center;
		border: 1px solid #1e293b;
		border-radius: 6px;
		background: transparent;
		transition: all 0.25s ease;
	}

	.tab:hover:not(.active) {
		border-color: #334155;
	}

	.tab.active {
		border-color: #22d3ee;
		box-shadow:
			0 0 8px rgba(34, 211, 238, 0.3),
			0 0 20px rgba(34, 211, 238, 0.15),
			inset 0 0 12px rgba(34, 211, 238, 0.06);
	}

	.tab-button {
		padding: 9px 8px 9px 16px;
		border: none;
		background: transparent;
		color: #64748b;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: color 0.25s ease;
		white-space: nowrap;
	}

	.tab:hover:not(.active) .tab-button {
		color: #94a3b8;
	}

	.tab.active .tab-button {
		color: #e0f2fe;
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
		color: #64748b;
		font-size: 14px;
		line-height: 1;
		cursor: pointer;
		transition: background 0.15s ease, color 0.15s ease;
	}

	.tab.active .close {
		color: #e0f2fe;
	}

	.tab:not(.active) .close:hover {
		background: #1e293b;
	}

	.tab.active .close:hover {
		background: rgba(34, 211, 238, 0.15);
	}
</style>
