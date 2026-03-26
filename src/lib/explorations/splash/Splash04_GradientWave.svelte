<div class="container">
	<span class="label">04 / Gradient wave</span>
	<div class="screen">
		<div class="wave wave-1"></div>
		<div class="wave wave-2"></div>
		<div class="wave wave-3"></div>
		<div class="center">
			<span class="logo">peep</span>
			<div class="dots">
				<span class="dot d1"></span>
				<span class="dot d2"></span>
				<span class="dot d3"></span>
			</div>
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
		background: linear-gradient(180deg, #0ea5e9 0%, #6366f1 50%, #a855f7 100%);
		border-radius: 16px;
		overflow: hidden;
	}

	.wave {
		position: absolute;
		bottom: -20%;
		left: -10%;
		width: 120%;
		height: 50%;
		border-radius: 45%;
		opacity: 0.15;
	}

	.wave-1 {
		background: #fff;
		animation: wave 6s ease-in-out infinite;
	}

	.wave-2 {
		background: #fff;
		animation: wave 7s ease-in-out 1s infinite;
		opacity: 0.1;
	}

	.wave-3 {
		background: #fff;
		animation: wave 5s ease-in-out 2s infinite;
		opacity: 0.08;
	}

	.center {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		z-index: 1;
	}

	.logo {
		font-size: 64px;
		font-weight: 800;
		color: #fff;
		text-shadow: 0 2px 20px rgba(0, 0, 0, 0.15);
	}

	.dots {
		display: flex;
		gap: 8px;
		margin-top: 20px;
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.8);
		animation: bounce 1.2s ease-in-out infinite;
	}

	.d1 { animation-delay: 0s; }
	.d2 { animation-delay: 0.15s; }
	.d3 { animation-delay: 0.3s; }

	@keyframes wave {
		0%, 100% { transform: rotate(0deg) translateY(0); }
		50% { transform: rotate(3deg) translateY(-20px); }
	}

	@keyframes bounce {
		0%, 80%, 100% { transform: scale(1); opacity: 0.5; }
		40% { transform: scale(1.8); opacity: 1; }
	}
</style>
