<script lang="ts">
	const tabs = ['README.md', 'CHANGELOG.md', 'design-notes.md', 'api-docs.md'];
	let activeIndex = $state(1);
</script>

<div class="container">
	<span class="label">16 / Gradient mesh</span>
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
		color: #6b7094;
		margin-bottom: 12px;
	}

	.tab-bar {
		display: flex;
		gap: 8px;
		padding: 6px;
		background: rgba(255, 255, 255, 0.04);
		border-radius: 16px;
	}

	.tab {
		position: relative;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 18px;
		border: none;
		border-radius: 12px;
		background: rgba(255, 255, 255, 0.06);
		color: #7a7f9e;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.3s ease;
		white-space: nowrap;
		overflow: hidden;
		z-index: 0;
	}

	.tab::before {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: 12px;
		opacity: 0;
		background: linear-gradient(135deg, #8b5cf6, #3b82f6, #ec4899, #8b5cf6);
		background-size: 300% 300%;
		animation: mesh-shift 6s ease infinite;
		transition: opacity 0.4s ease;
		z-index: -1;
	}

	.tab.active::before {
		opacity: 1;
	}

	.tab:hover:not(.active) {
		background: rgba(255, 255, 255, 0.1);
		color: #b0b5d0;
	}

	.tab.active {
		color: #fff;
		box-shadow:
			0 4px 20px rgba(139, 92, 246, 0.35),
			0 2px 8px rgba(59, 130, 246, 0.2);
	}

	@keyframes mesh-shift {
		0% {
			background-position: 0% 50%;
		}
		50% {
			background-position: 100% 50%;
		}
		100% {
			background-position: 0% 50%;
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
		background: rgba(255, 255, 255, 0.12);
	}

	.tab.active .close:hover {
		background: rgba(255, 255, 255, 0.25);
	}
</style>
