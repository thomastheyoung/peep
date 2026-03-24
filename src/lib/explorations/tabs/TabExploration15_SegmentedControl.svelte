<script lang="ts">
	const tabs = ['README.md', 'CHANGELOG.md', 'design-notes.md', 'api-docs.md'];
	let activeIndex = $state(1);
</script>

<div class="container">
	<span class="label">15 / Segmented control</span>
	<div class="segmented-control">
		<div
			class="pill"
			style="--index: {activeIndex}; --count: {tabs.length}"
		></div>
		{#each tabs as tab, i (tab)}
			<button
				class="segment"
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
		font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif;
		padding: 20px;
		background: #f5f5f7;
		border-radius: 12px;
	}

	.label {
		display: block;
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: #86868b;
		margin-bottom: 12px;
	}

	.segmented-control {
		display: grid;
		grid-template-columns: repeat(var(--count, 4), 1fr);
		position: relative;
		padding: 3px;
		background: #e8e8ed;
		border-radius: 10px;
		gap: 0;
	}

	.pill {
		position: absolute;
		top: 3px;
		bottom: 3px;
		left: 3px;
		width: calc((100% - 6px) / var(--count));
		transform: translateX(calc(var(--index) * 100%));
		background: #fff;
		border-radius: 8px;
		box-shadow:
			0 1px 3px rgba(0, 0, 0, 0.08),
			0 1px 2px rgba(0, 0, 0, 0.06);
		transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
		z-index: 0;
	}

	.segment {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 9px 12px;
		border: none;
		border-radius: 8px;
		background: transparent;
		color: #6e6e73;
		font-size: 13px;
		font-weight: 500;
		font-family: inherit;
		cursor: pointer;
		transition: color 0.2s ease;
		white-space: nowrap;
		position: relative;
		z-index: 1;
	}

	.segment:hover:not(.active) {
		color: #1d1d1f;
	}

	.segment.active {
		color: #1d1d1f;
		font-weight: 600;
	}

	.close {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		font-size: 12px;
		line-height: 1;
		transition: background 0.15s ease;
		opacity: 0.5;
	}

	.segment.active .close {
		opacity: 0.7;
	}

	.close:hover {
		background: rgba(0, 0, 0, 0.08);
		opacity: 1;
	}
</style>
