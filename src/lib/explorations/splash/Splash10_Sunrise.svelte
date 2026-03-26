<div class="container">
	<span class="label">10 / Sunrise</span>
	<div class="screen">
		<div class="sky">
			<div class="sun"></div>
			<div class="rays"></div>
		</div>
		<div class="horizon"></div>
		<div class="foreground">
			<span class="logo">peep</span>
			<span class="sub">a new way to read</span>
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
		justify-content: flex-end;
		height: 400px;
		background: linear-gradient(180deg, #1e1b4b 0%, #4338ca 30%, #f97316 70%, #fbbf24 100%);
		border-radius: 16px;
		overflow: hidden;
		animation: skyShift 3s ease-out forwards;
	}

	.sky {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 40%;
		display: flex;
		align-items: flex-end;
		justify-content: center;
	}

	.sun {
		width: 60px;
		height: 60px;
		background: #fbbf24;
		border-radius: 50%;
		box-shadow: 0 0 60px #fbbf24, 0 0 120px rgba(251, 191, 36, 0.4);
		animation: rise 2s ease-out forwards;
		transform: translateY(60px);
	}

	.rays {
		position: absolute;
		bottom: 0;
		width: 200px;
		height: 200px;
		background: conic-gradient(
			from 0deg,
			transparent 0deg, rgba(251, 191, 36, 0.1) 10deg,
			transparent 20deg, rgba(251, 191, 36, 0.1) 30deg,
			transparent 40deg, rgba(251, 191, 36, 0.1) 50deg,
			transparent 60deg, rgba(251, 191, 36, 0.1) 70deg,
			transparent 80deg, rgba(251, 191, 36, 0.1) 90deg,
			transparent 100deg
		);
		animation: spin 20s linear infinite;
		opacity: 0;
		animation: spin 20s linear infinite, fadeIn 2s ease 1s forwards;
	}

	.horizon {
		position: absolute;
		bottom: 38%;
		left: 0;
		right: 0;
		height: 4px;
		background: rgba(251, 191, 36, 0.3);
		box-shadow: 0 0 30px rgba(251, 191, 36, 0.3);
	}

	.foreground {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding-bottom: 60px;
		z-index: 1;
	}

	.logo {
		font-size: 56px;
		font-weight: 800;
		color: #fff;
		text-shadow: 0 2px 20px rgba(0, 0, 0, 0.3);
		opacity: 0;
		animation: fadeIn 0.8s ease 1.5s forwards;
	}

	.sub {
		font-size: 13px;
		letter-spacing: 0.2em;
		color: rgba(255, 255, 255, 0.7);
		margin-top: 8px;
		opacity: 0;
		animation: fadeIn 0.8s ease 2s forwards;
	}

	@keyframes rise {
		to { transform: translateY(-20px); }
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	@keyframes fadeIn {
		to { opacity: 1; }
	}

	@keyframes skyShift {
		to { background: linear-gradient(180deg, #3b82f6 0%, #93c5fd 30%, #fde68a 70%, #fbbf24 100%); }
	}
</style>
