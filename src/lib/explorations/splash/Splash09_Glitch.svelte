<div class="container">
	<span class="label">09 / Glitch</span>
	<div class="screen">
		<div class="glitch-wrap">
			<span class="text" data-text="peep">peep</span>
			<span class="text glitch-1" aria-hidden="true">peep</span>
			<span class="text glitch-2" aria-hidden="true">peep</span>
		</div>
		<div class="progress">
			<div class="bar"></div>
		</div>
		<span class="version">v1.0.0</span>
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
		background: #000;
		border-radius: 16px;
		overflow: hidden;
	}

	.glitch-wrap {
		position: relative;
	}

	.text {
		font-family: 'SF Mono', 'Fira Code', monospace;
		font-size: 72px;
		font-weight: 900;
		color: #fff;
		letter-spacing: 0.1em;
	}

	.glitch-1, .glitch-2 {
		position: absolute;
		top: 0;
		left: 0;
	}

	.glitch-1 {
		color: #0ff;
		animation: glitch1 2.5s infinite;
		clip-path: polygon(0 0, 100% 0, 100% 35%, 0 35%);
	}

	.glitch-2 {
		color: #f0f;
		animation: glitch2 2.5s infinite;
		clip-path: polygon(0 65%, 100% 65%, 100% 100%, 0 100%);
	}

	.progress {
		width: 180px;
		height: 2px;
		background: #222;
		margin-top: 32px;
		overflow: hidden;
	}

	.bar {
		height: 100%;
		width: 100%;
		background: linear-gradient(90deg, #0ff, #f0f);
		animation: load 2s ease-in-out infinite;
		transform-origin: left;
	}

	.version {
		font-family: 'SF Mono', monospace;
		font-size: 11px;
		color: #555;
		margin-top: 12px;
	}

	@keyframes glitch1 {
		0%, 100% { transform: translate(0); }
		20% { transform: translate(-3px, -2px); }
		40% { transform: translate(3px, 2px); }
		60% { transform: translate(-2px, 1px); }
		80% { transform: translate(2px, -1px); }
	}

	@keyframes glitch2 {
		0%, 100% { transform: translate(0); }
		20% { transform: translate(3px, 2px); }
		40% { transform: translate(-3px, -2px); }
		60% { transform: translate(2px, -1px); }
		80% { transform: translate(-2px, 1px); }
	}

	@keyframes load {
		0% { transform: scaleX(0); }
		50% { transform: scaleX(1); }
		100% { transform: scaleX(0); }
	}
</style>
