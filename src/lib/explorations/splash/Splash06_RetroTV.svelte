<div class="container">
	<span class="label">06 / Retro TV</span>
	<div class="screen">
		<div class="scanlines"></div>
		<div class="tv-content">
			<div class="turn-on"></div>
			<span class="logo">peep</span>
			<span class="channel">CH-01</span>
		</div>
		<div class="tv-frame">
			<div class="knob"></div>
			<div class="knob"></div>
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
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 400px;
		background: #111;
		border-radius: 24px;
		border: 8px solid #2a2a2a;
		overflow: hidden;
	}

	.scanlines {
		position: absolute;
		inset: 0;
		background: repeating-linear-gradient(
			0deg,
			transparent,
			transparent 2px,
			rgba(0, 0, 0, 0.15) 2px,
			rgba(0, 0, 0, 0.15) 4px
		);
		pointer-events: none;
		z-index: 2;
	}

	.tv-content {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		z-index: 1;
	}

	.turn-on {
		position: absolute;
		inset: -200px;
		background: #111;
		animation: turnOn 0.8s ease-out 0.3s forwards;
	}

	.logo {
		font-family: 'SF Mono', 'Fira Code', monospace;
		font-size: 64px;
		font-weight: 800;
		color: #4ade80;
		text-shadow: 0 0 20px rgba(74, 222, 128, 0.5), 0 0 60px rgba(74, 222, 128, 0.2);
	}

	.channel {
		font-family: 'SF Mono', monospace;
		font-size: 12px;
		color: #4ade80;
		opacity: 0.5;
		margin-top: 16px;
		letter-spacing: 0.2em;
	}

	.tv-frame {
		position: absolute;
		bottom: 12px;
		right: 16px;
		display: flex;
		gap: 8px;
	}

	.knob {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: #333;
		border: 2px solid #444;
	}

	@keyframes turnOn {
		0% { clip-path: inset(49% 0 49% 0); }
		40% { clip-path: inset(0 0 0 0); opacity: 1; }
		100% { clip-path: inset(0 0 0 0); opacity: 0; }
	}
</style>
