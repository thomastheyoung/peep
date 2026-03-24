<script lang="ts">
	const tabs = ['README.md', 'CHANGELOG.md', 'design-notes.md', 'api-docs.md'];
	let activeIndex = $state(1);
</script>

<div class="container">
	<span class="label">18 / Stacked cards</span>
	<div class="tab-bar">
		{#each tabs as tab, i (tab)}
			{@const offset = i - activeIndex}
			<button
				class="tab"
				class:active={activeIndex === i}
				class:behind-left={offset < 0}
				class:behind-right={offset > 0}
				style="--offset: {offset}; --abs-offset: {Math.abs(offset)}; z-index: {10 - Math.abs(offset)};"
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
		font-family: 'Georgia', 'Times New Roman', serif;
		padding: 20px;
		background: #f5f0eb;
		border-radius: 12px;
	}

	.label {
		display: block;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: #a89888;
		margin-bottom: 16px;
	}

	.tab-bar {
		display: flex;
		justify-content: center;
		position: relative;
		height: 64px;
		padding: 0 40px;
	}

	.tab {
		position: absolute;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 14px 22px;
		border: 1px solid #ddd4c8;
		border-radius: 10px;
		background: #fffcf8;
		color: #8a7e72;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
		white-space: nowrap;
		transform:
			translateX(calc(var(--offset) * 30px))
			rotate(calc(var(--offset) * -2deg))
			scale(calc(1 - var(--abs-offset) * 0.05));
		opacity: calc(1 - var(--abs-offset) * 0.2);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
	}

	.tab:hover {
		transform:
			translateX(calc(var(--offset) * 30px))
			rotate(calc(var(--offset) * -1deg))
			scale(calc(1 - var(--abs-offset) * 0.02));
	}

	.tab.active {
		background: #fffcf8;
		color: #3d3429;
		border-color: #c87941;
		box-shadow:
			0 4px 16px rgba(200, 121, 65, 0.15),
			0 2px 6px rgba(0, 0, 0, 0.06);
		transform: translateX(0) rotate(0deg) scale(1);
		opacity: 1;
	}

	.tab.active .tab-name {
		color: #c87941;
		font-weight: 600;
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
		font-size: 14px;
		line-height: 1;
		cursor: pointer;
		transition: background 0.15s ease;
	}

	.tab:not(.active) .close:hover {
		background: #ebe4da;
	}

	.tab.active .close:hover {
		background: rgba(200, 121, 65, 0.15);
	}
</style>
