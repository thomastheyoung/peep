<div class="container">
	<span class="label">20 / Paper airplane</span>
	<div class="screen">
		<div class="trail"></div>
		<div class="airplane">
			<svg width="40" height="40" viewBox="0 0 24 24" fill="none">
				<path d="M2 12L22 2L16 12L22 22L2 12Z" fill="#6366f1" stroke="#4f46e5" stroke-width="1"/>
				<path d="M2 12L16 12L22 2" fill="#818cf8"/>
			</svg>
		</div>
		<div class="content">
			<span class="logo">peep</span>
			<span class="sub">delivering your docs</span>
		</div>
		<div class="clouds">
			<div class="cloud c1"></div>
			<div class="cloud c2"></div>
			<div class="cloud c3"></div>
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
		background: linear-gradient(180deg, #dbeafe 0%, #eff6ff 60%, #fff 100%);
		border-radius: 16px;
		overflow: hidden;
	}

	.airplane {
		position: absolute;
		animation: fly 3s ease-in-out infinite;
		z-index: 2;
	}

	.trail {
		position: absolute;
		width: 100px;
		height: 2px;
		background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.3));
		animation: fly 3s ease-in-out infinite;
		transform: translateX(-60px);
		z-index: 1;
	}

	.content {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-top: 60px;
		z-index: 1;
	}

	.logo {
		font-size: 56px;
		font-weight: 800;
		color: #1e3a5f;
	}

	.sub {
		font-size: 13px;
		letter-spacing: 0.2em;
		color: #94a3b8;
		margin-top: 8px;
	}

	.clouds {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.cloud {
		position: absolute;
		background: #fff;
		border-radius: 50px;
		opacity: 0.7;
	}

	.c1 {
		width: 120px;
		height: 40px;
		top: 15%;
		animation: drift 15s linear infinite;
		left: -120px;
	}

	.c2 {
		width: 80px;
		height: 30px;
		top: 35%;
		animation: drift 20s linear 5s infinite;
		left: -80px;
		opacity: 0.4;
	}

	.c3 {
		width: 100px;
		height: 35px;
		top: 55%;
		animation: drift 18s linear 10s infinite;
		left: -100px;
		opacity: 0.5;
	}

	@keyframes fly {
		0% { top: 35%; left: -5%; transform: rotate(-5deg); }
		25% { top: 20%; left: 30%; transform: rotate(5deg); }
		50% { top: 30%; left: 55%; transform: rotate(-3deg); }
		75% { top: 15%; left: 75%; transform: rotate(8deg); }
		100% { top: 35%; left: 105%; transform: rotate(-5deg); }
	}

	@keyframes drift {
		to { transform: translateX(calc(100vw + 200px)); }
	}
</style>
