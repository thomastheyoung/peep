<script lang="ts">
	const tabs = ['README.md', 'CHANGELOG.md', 'design-notes.md', 'api-docs.md'];
	let activeIndex = $state(1);
</script>

<div class="container">
	<span class="label">02 / Underline glow</span>
	<div class="tab-bar">
		{#each tabs as tab, i (tab)}
			<div class="tab" class:active={activeIndex === i}>
				<button class="tab-button" onclick={() => (activeIndex = i)}>
					{tab}
				</button>
				<button class="close" onclick={() => {}}>×</button>
				{#if activeIndex === i}
					<div class="underline"></div>
				{/if}
			</div>
		{/each}
	</div>
</div>

<style>
	.container {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		padding: 20px;
		background: #fff;
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
		gap: 0;
		border-bottom: 1px solid #e2e8f0;
	}

	.tab {
		position: relative;
		display: flex;
		align-items: center;
	}

	.tab-button {
		padding: 12px 12px 12px 20px;
		border: none;
		background: transparent;
		color: #94a3b8;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: color 0.25s ease;
		white-space: nowrap;
	}

	.tab:hover .tab-button {
		color: #64748b;
	}

	.tab.active .tab-button {
		color: #1e293b;
	}

	.underline {
		position: absolute;
		bottom: -1px;
		left: 12px;
		right: 12px;
		height: 2px;
		border-radius: 2px;
		background: linear-gradient(90deg, #6366f1, #a855f7);
		box-shadow:
			0 0 8px rgba(99, 102, 241, 0.5),
			0 0 20px rgba(168, 85, 247, 0.3);
		animation: glow-pulse 2s ease-in-out infinite;
	}

	@keyframes glow-pulse {
		0%, 100% {
			box-shadow:
				0 0 8px rgba(99, 102, 241, 0.5),
				0 0 20px rgba(168, 85, 247, 0.3);
		}
		50% {
			box-shadow:
				0 0 12px rgba(99, 102, 241, 0.7),
				0 0 30px rgba(168, 85, 247, 0.5);
		}
	}

	.close {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		margin-right: 8px;
		padding: 0;
		border: none;
		border-radius: 50%;
		background: transparent;
		color: #94a3b8;
		font-size: 14px;
		line-height: 1;
		cursor: pointer;
		opacity: 0;
		transition: opacity 0.15s ease, background 0.15s ease;
	}

	.tab:hover .close {
		opacity: 1;
	}

	.close:hover {
		background: #f1f5f9;
	}
</style>
