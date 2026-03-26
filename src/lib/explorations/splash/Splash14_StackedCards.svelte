<div class="container">
	<span class="label">14 / Stacked cards</span>
	<div class="screen">
		<div class="stack">
			<div class="card c1">
				<div class="line w80"></div>
				<div class="line w60"></div>
				<div class="line w90"></div>
			</div>
			<div class="card c2">
				<div class="line w70"></div>
				<div class="line w50"></div>
				<div class="line w85"></div>
			</div>
			<div class="card c3">
				<div class="line w60"></div>
				<div class="line w80"></div>
			</div>
			<div class="card c4 main">
				<span class="logo">peep</span>
				<span class="sub">ready to read</span>
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
		display: flex;
		align-items: center;
		justify-content: center;
		height: 400px;
		background: #f1f5f9;
		border-radius: 16px;
		overflow: hidden;
	}

	.stack {
		position: relative;
		width: 220px;
		height: 160px;
	}

	.card {
		position: absolute;
		width: 220px;
		height: 140px;
		background: #fff;
		border-radius: 12px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.line {
		height: 8px;
		border-radius: 4px;
		background: #e2e8f0;
	}

	.w50 { width: 50%; }
	.w60 { width: 60%; }
	.w70 { width: 70%; }
	.w80 { width: 80%; }
	.w85 { width: 85%; }
	.w90 { width: 90%; }

	.c1 {
		animation: flyOut 0.5s ease-in 0.8s both;
		z-index: 1;
	}

	.c2 {
		transform: translateY(10px) scale(0.97);
		animation: flyOut 0.5s ease-in 1.2s both;
		z-index: 2;
	}

	.c3 {
		transform: translateY(20px) scale(0.94);
		animation: flyOut 0.5s ease-in 1.6s both;
		z-index: 3;
	}

	.c4 {
		transform: translateY(30px) scale(0.91);
		z-index: 4;
		animation: reveal 0.6s ease-out 2.1s both;
	}

	.main {
		background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
		align-items: center;
		justify-content: center;
		gap: 4px;
	}

	.logo {
		font-size: 36px;
		font-weight: 800;
		color: #fff;
	}

	.sub {
		font-size: 12px;
		color: rgba(255, 255, 255, 0.7);
		letter-spacing: 0.1em;
	}

	@keyframes flyOut {
		to {
			transform: translateX(300px) rotate(15deg);
			opacity: 0;
		}
	}

	@keyframes reveal {
		from { transform: translateY(30px) scale(0.91); }
		to { transform: translateY(0) scale(1); }
	}
</style>
