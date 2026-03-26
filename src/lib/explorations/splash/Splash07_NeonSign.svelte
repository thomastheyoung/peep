<div class="container">
	<span class="label">07 / Neon sign</span>
	<div class="screen">
		<div class="wall"></div>
		<div class="sign">
			<span class="neon">peep</span>
			<span class="sub">markdown viewer</span>
		</div>
		<div class="reflection"></div>
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
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 400px;
		background: #1a1a2e;
		border-radius: 16px;
		overflow: hidden;
	}

	.wall {
		position: absolute;
		inset: 0;
		background:
			radial-gradient(ellipse at 50% 45%, rgba(236, 72, 153, 0.08) 0%, transparent 60%);
	}

	.sign {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		z-index: 1;
	}

	.neon {
		font-size: 80px;
		font-weight: 800;
		color: #fff;
		text-shadow:
			0 0 7px #fff,
			0 0 10px #fff,
			0 0 21px #fff,
			0 0 42px #ec4899,
			0 0 82px #ec4899,
			0 0 92px #ec4899,
			0 0 102px #ec4899,
			0 0 151px #ec4899;
		animation: flicker 4s infinite;
	}

	.sub {
		font-size: 14px;
		letter-spacing: 0.5em;
		text-transform: uppercase;
		color: #ec4899;
		opacity: 0.6;
		margin-top: 12px;
		text-shadow: 0 0 10px #ec4899;
	}

	.reflection {
		position: absolute;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 300px;
		height: 80px;
		background: radial-gradient(ellipse, rgba(236, 72, 153, 0.15) 0%, transparent 70%);
	}

	@keyframes flicker {
		0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% {
			text-shadow:
				0 0 7px #fff,
				0 0 10px #fff,
				0 0 21px #fff,
				0 0 42px #ec4899,
				0 0 82px #ec4899,
				0 0 92px #ec4899,
				0 0 102px #ec4899,
				0 0 151px #ec4899;
			opacity: 1;
		}
		20%, 24%, 55% {
			text-shadow:
				0 0 4px #fff,
				0 0 7px #fff,
				0 0 18px #ec4899,
				0 0 38px #ec4899;
			opacity: 0.85;
		}
	}
</style>
