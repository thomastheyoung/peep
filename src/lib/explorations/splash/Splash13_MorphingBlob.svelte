<div class="container">
	<span class="label">13 / Morphing blob</span>
	<div class="screen">
		<div class="blob-wrap">
			<div class="blob"></div>
			<span class="logo">peep</span>
		</div>
		<div class="spinner">
			<div class="dot"></div>
			<div class="dot"></div>
			<div class="dot"></div>
			<div class="dot"></div>
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
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 400px;
		background: #faf5ff;
		border-radius: 16px;
		overflow: hidden;
	}

	.blob-wrap {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 200px;
		height: 200px;
	}

	.blob {
		position: absolute;
		width: 160px;
		height: 160px;
		background: linear-gradient(135deg, #a855f7 0%, #6366f1 50%, #ec4899 100%);
		border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
		animation: morph 6s ease-in-out infinite;
		filter: blur(0px);
		opacity: 0.9;
	}

	.logo {
		position: relative;
		font-size: 42px;
		font-weight: 800;
		color: #fff;
		text-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		z-index: 1;
	}

	.spinner {
		display: flex;
		gap: 6px;
		margin-top: 32px;
	}

	.dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #a855f7;
		animation: orbit 1.2s ease-in-out infinite;
	}

	.dot:nth-child(2) { animation-delay: 0.15s; }
	.dot:nth-child(3) { animation-delay: 0.3s; }
	.dot:nth-child(4) { animation-delay: 0.45s; }

	@keyframes morph {
		0% { border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%; transform: rotate(0deg) scale(1); }
		25% { border-radius: 58% 42% 36% 64% / 56% 68% 32% 44%; transform: rotate(45deg) scale(1.05); }
		50% { border-radius: 50% 50% 34% 66% / 56% 68% 32% 44%; transform: rotate(90deg) scale(1); }
		75% { border-radius: 30% 70% 55% 45% / 56% 40% 60% 44%; transform: rotate(135deg) scale(1.05); }
		100% { border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%; transform: rotate(180deg) scale(1); }
	}

	@keyframes orbit {
		0%, 100% { transform: translateY(0); opacity: 0.3; }
		50% { transform: translateY(-10px); opacity: 1; }
	}
</style>
