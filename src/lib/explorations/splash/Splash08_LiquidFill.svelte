<div class="container">
	<span class="label">08 / Liquid fill</span>
	<div class="screen">
		<div class="text-wrap">
			<span class="text-back">peep</span>
			<span class="text-front">peep</span>
			<div class="liquid">
				<div class="wave-layer"></div>
			</div>
		</div>
		<p class="loading">loading</p>
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
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 400px;
		background: #f0fdf4;
		border-radius: 16px;
		overflow: hidden;
	}

	.text-wrap {
		position: relative;
		overflow: hidden;
	}

	.text-back {
		font-size: 80px;
		font-weight: 900;
		color: #d1fae5;
		user-select: none;
	}

	.text-front {
		position: absolute;
		top: 0;
		left: 0;
		font-size: 80px;
		font-weight: 900;
		color: #10b981;
		clip-path: inset(100% 0 0 0);
		animation: fillUp 2.5s ease-in-out 0.5s forwards;
	}

	.liquid {
		position: absolute;
		left: -10%;
		width: 120%;
		height: 20px;
		bottom: 0;
		animation: rise 2.5s ease-in-out 0.5s forwards;
	}

	.wave-layer {
		width: 200%;
		height: 100%;
		background: radial-gradient(ellipse at 25% 50%, #10b981 0%, transparent 50%),
			radial-gradient(ellipse at 75% 50%, #10b981 0%, transparent 50%);
		animation: sway 1s ease-in-out infinite;
		opacity: 0.4;
	}

	.loading {
		font-size: 12px;
		letter-spacing: 0.3em;
		text-transform: uppercase;
		color: #6ee7b7;
		margin-top: 24px;
		animation: pulse 1.5s ease-in-out infinite;
	}

	@keyframes fillUp {
		to { clip-path: inset(0 0 0 0); }
	}

	@keyframes rise {
		to { bottom: 100%; }
	}

	@keyframes sway {
		0%, 100% { transform: translateX(0); }
		50% { transform: translateX(-25%); }
	}

	@keyframes pulse {
		0%, 100% { opacity: 0.4; }
		50% { opacity: 1; }
	}
</style>
