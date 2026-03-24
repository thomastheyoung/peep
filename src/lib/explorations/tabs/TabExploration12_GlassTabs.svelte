<script lang="ts">
	const tabs = ['README.md', 'CHANGELOG.md', 'design-notes.md', 'api-docs.md'];
	let activeIndex = $state(1);
</script>

<div class="container">
	<span class="label">12 / Glass tabs</span>
	<div class="gradient-bg">
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
</div>

<style>
	.container {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		padding: 20px;
		background: #1a1a2e;
		border-radius: 12px;
	}

	.label {
		display: block;
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.5);
		margin-bottom: 12px;
	}

	.gradient-bg {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%);
		border-radius: 14px;
		padding: 24px 16px 16px;
	}

	.tab-bar {
		display: flex;
		gap: 8px;
	}

	.tab {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 18px;
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 12px;
		background: rgba(255, 255, 255, 0.12);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		color: rgba(255, 255, 255, 0.7);
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.25s ease;
		white-space: nowrap;
	}

	.tab:hover:not(.active) {
		background: rgba(255, 255, 255, 0.2);
		border-color: rgba(255, 255, 255, 0.3);
		color: rgba(255, 255, 255, 0.9);
	}

	.tab.active {
		background: rgba(255, 255, 255, 0.28);
		border-color: rgba(255, 255, 255, 0.4);
		color: #fff;
		box-shadow:
			0 4px 16px rgba(0, 0, 0, 0.15),
			inset 0 1px 0 rgba(255, 255, 255, 0.3);
	}

	.close {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		font-size: 14px;
		line-height: 1;
		transition: background 0.15s ease;
	}

	.tab:not(.active) .close:hover {
		background: rgba(255, 255, 255, 0.15);
	}

	.tab.active .close:hover {
		background: rgba(255, 255, 255, 0.25);
	}
</style>
