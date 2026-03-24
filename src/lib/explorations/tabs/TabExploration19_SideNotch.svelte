<script lang="ts">
	const tabs = ['README.md', 'CHANGELOG.md', 'design-notes.md', 'api-docs.md'];
	let activeIndex = $state(1);
</script>

<div class="container">
	<span class="label">19 / Side notch</span>
	<div class="tab-bar">
		{#each tabs as tab, i (tab)}
			<button
				class="tab"
				class:active={activeIndex === i}
				onclick={() => (activeIndex = i)}
			>
				<span class="notch"></span>
				<span class="tab-content">
					<span class="tab-name">{tab}</span>
					<span class="close" role="button" tabindex="-1" onkeydown={(e) => e.key === 'Enter' && e.stopPropagation()} onclick={(e) => e.stopPropagation()}>×</span>
				</span>
			</button>
		{/each}
	</div>
</div>

<style>
	.container {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		padding: 20px;
		background: #f8f9fb;
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
		flex-direction: column;
		gap: 2px;
		background: #fff;
		border-radius: 10px;
		padding: 4px;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
		max-width: 260px;
	}

	.tab {
		display: flex;
		align-items: center;
		gap: 0;
		padding: 0;
		border: none;
		border-radius: 8px;
		background: transparent;
		color: #94a3b8;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
		overflow: hidden;
	}

	.tab:hover:not(.active) {
		background: #f1f5f9;
		color: #64748b;
	}

	.tab:hover:not(.active) .notch {
		background: #cbd5e1;
	}

	.notch {
		width: 4px;
		min-width: 4px;
		height: 24px;
		border-radius: 0 4px 4px 0;
		background: transparent;
		transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
		margin-right: 0;
	}

	.tab.active .notch {
		background: linear-gradient(180deg, #6366f1, #8b5cf6);
		height: 28px;
		width: 4px;
		box-shadow: 0 0 8px rgba(99, 102, 241, 0.4);
	}

	.tab.active {
		background: #f0f0ff;
		color: #1e1b4b;
	}

	.tab-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex: 1;
		padding: 10px 12px 10px 10px;
		gap: 8px;
	}

	.tab-name {
		overflow: hidden;
		text-overflow: ellipsis;
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
		flex-shrink: 0;
		opacity: 0;
	}

	.tab:hover .close {
		opacity: 1;
	}

	.tab:not(.active) .close:hover {
		background: #e2e8f0;
	}

	.tab.active .close:hover {
		background: rgba(99, 102, 241, 0.15);
	}
</style>
