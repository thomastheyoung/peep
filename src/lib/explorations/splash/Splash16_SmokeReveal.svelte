<div class="container">
	<span class="label">16 / Smoke reveal</span>
	<div class="screen">
		<span class="logo">peep</span>
		<span class="sub">markdown viewer</span>
		<div class="smoke s1"></div>
		<div class="smoke s2"></div>
		<div class="smoke s3"></div>
		<div class="smoke s4"></div>
		<div class="smoke s5"></div>
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
		background: #18181b;
		border-radius: 16px;
		overflow: hidden;
	}

	.logo {
		font-size: 64px;
		font-weight: 800;
		color: #fafafa;
		z-index: 0;
	}

	.sub {
		font-size: 14px;
		letter-spacing: 0.3em;
		color: #71717a;
		margin-top: 8px;
		z-index: 0;
	}

	.smoke {
		position: absolute;
		border-radius: 50%;
		background: radial-gradient(circle, #27272a 0%, transparent 70%);
		z-index: 1;
		animation: dissipate 2.5s ease-out forwards;
	}

	.s1 { width: 300px; height: 300px; top: 20%; left: 10%; animation-delay: 0s; }
	.s2 { width: 250px; height: 250px; top: 10%; right: 5%; animation-delay: 0.3s; }
	.s3 { width: 350px; height: 350px; bottom: 5%; left: 20%; animation-delay: 0.1s; }
	.s4 { width: 200px; height: 200px; top: 40%; left: 40%; animation-delay: 0.5s; }
	.s5 { width: 280px; height: 280px; bottom: 10%; right: 10%; animation-delay: 0.2s; }

	@keyframes dissipate {
		0% { opacity: 1; transform: scale(1); filter: blur(20px); }
		60% { opacity: 0.6; transform: scale(1.4); filter: blur(40px); }
		100% { opacity: 0; transform: scale(2); filter: blur(60px); }
	}
</style>
