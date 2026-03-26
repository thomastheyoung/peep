<div class="container">
	<span class="label">18 / Aurora borealis</span>
	<div class="screen">
		<div class="aurora a1"></div>
		<div class="aurora a2"></div>
		<div class="aurora a3"></div>
		<div class="stars">
			{#each Array(30) as _, i}
				<span
					class="star"
					style="
						left: {Math.random() * 100}%;
						top: {Math.random() * 50}%;
						animation-delay: {Math.random() * 3}s;
						width: {1 + Math.random() * 2}px;
						height: {1 + Math.random() * 2}px;
					"
				></span>
			{/each}
		</div>
		<div class="content">
			<span class="logo">peep</span>
			<span class="sub">beautiful markdown</span>
		</div>
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
		background: linear-gradient(180deg, #020617 0%, #0f172a 60%, #1e293b 100%);
		border-radius: 16px;
		overflow: hidden;
	}

	.aurora {
		position: absolute;
		width: 140%;
		height: 50%;
		top: 10%;
		left: -20%;
		border-radius: 50%;
		filter: blur(40px);
		opacity: 0.4;
		mix-blend-mode: screen;
	}

	.a1 {
		background: linear-gradient(90deg, transparent 0%, #22d3ee 30%, #10b981 60%, transparent 100%);
		animation: drift 8s ease-in-out infinite;
	}

	.a2 {
		background: linear-gradient(90deg, transparent 0%, #a78bfa 40%, #6366f1 70%, transparent 100%);
		animation: drift 10s ease-in-out 2s infinite reverse;
		top: 20%;
	}

	.a3 {
		background: linear-gradient(90deg, transparent 0%, #34d399 30%, #22d3ee 50%, #818cf8 70%, transparent 100%);
		animation: drift 6s ease-in-out 1s infinite;
		top: 5%;
		opacity: 0.25;
	}

	.stars {
		position: absolute;
		inset: 0;
	}

	.star {
		position: absolute;
		background: #fff;
		border-radius: 50%;
		animation: twinkle 3s ease-in-out infinite;
	}

	.content {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		z-index: 1;
	}

	.logo {
		font-size: 60px;
		font-weight: 800;
		color: #fff;
		text-shadow: 0 0 30px rgba(34, 211, 238, 0.3);
	}

	.sub {
		font-size: 13px;
		letter-spacing: 0.25em;
		color: rgba(148, 163, 184, 0.7);
		margin-top: 8px;
	}

	@keyframes drift {
		0%, 100% { transform: translateX(-10%) rotate(-2deg); }
		50% { transform: translateX(10%) rotate(2deg); }
	}

	@keyframes twinkle {
		0%, 100% { opacity: 0.2; }
		50% { opacity: 1; }
	}
</style>
