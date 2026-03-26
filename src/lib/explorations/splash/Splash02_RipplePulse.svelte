<div class="container">
	<span class="label">02 / Ripple pulse</span>
	<div class="screen">
		<div class="ripple-group">
			<div class="ripple r1"></div>
			<div class="ripple r2"></div>
			<div class="ripple r3"></div>
			<div class="ripple r4"></div>
		</div>
		<span class="logo">peep</span>
		<div class="bar-wrap">
			<div class="bar"></div>
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
		background: linear-gradient(135deg, #0c0a1d 0%, #1a1145 100%);
		border-radius: 16px;
		overflow: hidden;
	}

	.ripple-group {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.ripple {
		position: absolute;
		border-radius: 50%;
		border: 1.5px solid rgba(139, 92, 246, 0.3);
		animation: ripple 3s ease-out infinite;
	}

	.r1 { width: 100px; height: 100px; animation-delay: 0s; }
	.r2 { width: 100px; height: 100px; animation-delay: 0.6s; }
	.r3 { width: 100px; height: 100px; animation-delay: 1.2s; }
	.r4 { width: 100px; height: 100px; animation-delay: 1.8s; }

	.logo {
		position: relative;
		font-size: 56px;
		font-weight: 800;
		color: #fff;
		text-shadow: 0 0 40px rgba(139, 92, 246, 0.6);
		z-index: 1;
	}

	.bar-wrap {
		position: relative;
		width: 120px;
		height: 3px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 3px;
		margin-top: 24px;
		overflow: hidden;
		z-index: 1;
	}

	.bar {
		height: 100%;
		width: 40%;
		background: #8b5cf6;
		border-radius: 3px;
		animation: slide 1.4s ease-in-out infinite;
	}

	@keyframes ripple {
		0% { transform: scale(1); opacity: 0.6; }
		100% { transform: scale(4.5); opacity: 0; }
	}

	@keyframes slide {
		0% { transform: translateX(-100%); }
		50% { transform: translateX(300%); }
		100% { transform: translateX(-100%); }
	}
</style>
