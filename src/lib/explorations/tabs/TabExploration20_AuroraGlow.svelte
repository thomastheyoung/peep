<script lang="ts">
	const tabs = ['README.md', 'CHANGELOG.md', 'design-notes.md', 'api-docs.md'];
	let activeIndex = $state(1);
</script>

<div class="container">
	<span class="label">20 / Aurora glow</span>
	<div class="tab-bar">
		{#each tabs as tab, i (tab)}
			<button
				class="tab"
				class:active={activeIndex === i}
				onclick={() => (activeIndex = i)}
			>
				<span class="glow"></span>
				<span class="tab-name">{tab}</span>
				<span class="close" role="button" tabindex="-1" onkeydown={(e) => e.key === 'Enter' && e.stopPropagation()} onclick={(e) => e.stopPropagation()}>×</span>
			</button>
		{/each}
	</div>
</div>

<style>
	.container {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		padding: 20px;
		background: #0a0a14;
		border-radius: 12px;
	}

	.label {
		display: block;
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: #3a3a5c;
		margin-bottom: 12px;
	}

	.tab-bar {
		display: flex;
		gap: 6px;
		padding: 6px;
		background: rgba(255, 255, 255, 0.03);
		border-radius: 14px;
		border: 1px solid rgba(255, 255, 255, 0.04);
	}

	.tab {
		position: relative;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 18px;
		border: 1px solid transparent;
		border-radius: 10px;
		background: transparent;
		color: #4a4a6a;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.35s ease;
		white-space: nowrap;
		overflow: hidden;
	}

	.tab:hover:not(.active) {
		color: #8888aa;
		background: rgba(255, 255, 255, 0.03);
	}

	.glow {
		position: absolute;
		inset: -2px;
		border-radius: 12px;
		opacity: 0;
		transition: opacity 0.5s ease;
		pointer-events: none;
		z-index: 0;
	}

	.tab.active .glow {
		opacity: 1;
		background:
			radial-gradient(ellipse at 20% 50%, rgba(52, 211, 153, 0.25) 0%, transparent 60%),
			radial-gradient(ellipse at 50% 50%, rgba(96, 165, 250, 0.2) 0%, transparent 55%),
			radial-gradient(ellipse at 80% 50%, rgba(167, 139, 250, 0.25) 0%, transparent 60%);
		animation: aurora-pulse 4s ease-in-out infinite alternate;
		filter: blur(8px);
	}

	.tab.active {
		color: #e2e8f0;
		border-color: rgba(255, 255, 255, 0.08);
		background: rgba(255, 255, 255, 0.05);
		box-shadow:
			0 0 20px rgba(52, 211, 153, 0.12),
			0 0 40px rgba(96, 165, 250, 0.08),
			0 0 60px rgba(167, 139, 250, 0.06);
	}

	@keyframes aurora-pulse {
		0% {
			background:
				radial-gradient(ellipse at 20% 50%, rgba(52, 211, 153, 0.25) 0%, transparent 60%),
				radial-gradient(ellipse at 50% 50%, rgba(96, 165, 250, 0.2) 0%, transparent 55%),
				radial-gradient(ellipse at 80% 50%, rgba(167, 139, 250, 0.25) 0%, transparent 60%);
		}
		33% {
			background:
				radial-gradient(ellipse at 30% 50%, rgba(167, 139, 250, 0.25) 0%, transparent 60%),
				radial-gradient(ellipse at 60% 50%, rgba(52, 211, 153, 0.22) 0%, transparent 55%),
				radial-gradient(ellipse at 85% 50%, rgba(96, 165, 250, 0.2) 0%, transparent 60%);
		}
		66% {
			background:
				radial-gradient(ellipse at 15% 50%, rgba(96, 165, 250, 0.22) 0%, transparent 60%),
				radial-gradient(ellipse at 45% 50%, rgba(167, 139, 250, 0.2) 0%, transparent 55%),
				radial-gradient(ellipse at 75% 50%, rgba(52, 211, 153, 0.25) 0%, transparent 60%);
		}
		100% {
			background:
				radial-gradient(ellipse at 25% 50%, rgba(52, 211, 153, 0.2) 0%, transparent 60%),
				radial-gradient(ellipse at 55% 50%, rgba(96, 165, 250, 0.25) 0%, transparent 55%),
				radial-gradient(ellipse at 80% 50%, rgba(167, 139, 250, 0.2) 0%, transparent 60%);
		}
	}

	.tab-name {
		position: relative;
		z-index: 1;
	}

	.close {
		position: relative;
		z-index: 1;
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
		background: rgba(255, 255, 255, 0.08);
	}

	.tab.active .close:hover {
		background: rgba(255, 255, 255, 0.15);
	}
</style>
