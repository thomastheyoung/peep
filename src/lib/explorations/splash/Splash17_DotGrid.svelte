<script lang="ts">
	const rows = 15;
	const cols = 25;
	const dots = Array.from({ length: rows * cols }, (_, i) => ({
		x: (i % cols),
		y: Math.floor(i / cols),
		delay: (Math.abs(i % cols - 12) + Math.abs(Math.floor(i / cols) - 7)) * 0.04,
	}));
</script>

<div class="container">
	<span class="label">17 / Dot grid</span>
	<div class="screen">
		<div class="grid" style="--cols: {cols}; --rows: {rows};">
			{#each dots as dot (dot.x + '-' + dot.y)}
				<span
					class="dot"
					style="animation-delay: {dot.delay}s"
				></span>
			{/each}
		</div>
		<span class="logo">peep</span>
	</div>
</div>

<style>
	.container {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		padding: 20px;
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

	.screen {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		height: 400px;
		background: #fff;
		border-radius: 16px;
		overflow: hidden;
	}

	.grid {
		position: absolute;
		display: grid;
		grid-template-columns: repeat(var(--cols), 1fr);
		gap: 12px;
		padding: 20px;
		inset: 0;
		align-content: center;
		justify-items: center;
	}

	.dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #e2e8f0;
		animation: pulse 2s ease-in-out infinite;
	}

	.logo {
		position: relative;
		font-size: 52px;
		font-weight: 800;
		color: #0f172a;
		z-index: 1;
		mix-blend-mode: multiply;
	}

	@keyframes pulse {
		0%, 100% { background: #e2e8f0; transform: scale(1); }
		50% { background: #6366f1; transform: scale(1.8); }
	}
</style>
