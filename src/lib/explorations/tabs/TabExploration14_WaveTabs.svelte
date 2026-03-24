<script lang="ts">
	const tabs = ['README.md', 'CHANGELOG.md', 'design-notes.md', 'api-docs.md'];
	let activeIndex = $state(1);
</script>

<div class="container">
	<span class="label">14 / Wave tabs</span>
	<div class="tab-bar">
		{#each tabs as tab, i (tab)}
			<button
				class="tab"
				class:active={activeIndex === i}
				onclick={() => (activeIndex = i)}
			>
				<svg class="wave-bg" viewBox="0 0 200 50" preserveAspectRatio="none">
					<path d="M0,50 Q20,35 40,42 T80,38 T120,42 T160,36 T200,40 L200,0 L0,0 Z" />
				</svg>
				<span class="tab-content">
					<span class="tab-name">{tab}</span>
					<span class="close" role="button" tabindex="-1" onkeydown={(e) => e.key === 'Enter' && e.stopPropagation()} onclick={(e) => e.stopPropagation()}>×</span>
				</span>
			</button>
		{/each}
	</div>
	<div class="ocean-floor">
		<svg class="wave-decoration" viewBox="0 0 800 20" preserveAspectRatio="none">
			<path d="M0,10 Q50,0 100,10 T200,10 T300,10 T400,10 T500,10 T600,10 T700,10 T800,10 L800,20 L0,20 Z" />
		</svg>
	</div>
</div>

<style>
	.container {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		padding: 20px;
		background: linear-gradient(180deg, #0c2d48 0%, #145374 100%);
		border-radius: 12px;
	}

	.label {
		display: block;
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: #5eead4;
		margin-bottom: 12px;
		opacity: 0.7;
	}

	.tab-bar {
		display: flex;
		gap: 4px;
		align-items: flex-end;
		padding-bottom: 0;
	}

	.tab {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		padding: 0;
		border: none;
		border-radius: 12px 12px 0 0;
		background: rgba(255, 255, 255, 0.06);
		color: rgba(255, 255, 255, 0.55);
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.3s ease;
		white-space: nowrap;
		position: relative;
		overflow: hidden;
		min-height: 46px;
	}

	.tab:hover:not(.active) {
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.8);
		transform: translateY(-2px);
	}

	.tab.active {
		background: linear-gradient(180deg, #0d9488 0%, #0f766e 100%);
		color: #fff;
		transform: translateY(-6px);
		box-shadow: 0 6px 20px rgba(13, 148, 136, 0.4);
		min-height: 52px;
	}

	.wave-bg {
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;
		height: 20px;
		opacity: 0.15;
		fill: currentColor;
	}

	.tab.active .wave-bg {
		opacity: 0.3;
		fill: #5eead4;
		animation: wave-drift 3s ease-in-out infinite;
	}

	@keyframes wave-drift {
		0%, 100% { transform: translateX(0); }
		50% { transform: translateX(-5px); }
	}

	.tab-content {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 12px 18px;
		position: relative;
		z-index: 1;
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

	.ocean-floor {
		position: relative;
		height: 8px;
		overflow: hidden;
	}

	.wave-decoration {
		width: 100%;
		height: 100%;
		fill: #0d9488;
		opacity: 0.3;
	}
</style>
