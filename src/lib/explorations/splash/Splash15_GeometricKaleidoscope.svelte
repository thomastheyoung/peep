<div class="container">
	<span class="label">15 / Geometric kaleidoscope</span>
	<div class="screen">
		<div class="kaleidoscope">
			<div class="ring ring-1">
				<div class="segment"></div>
				<div class="segment"></div>
				<div class="segment"></div>
				<div class="segment"></div>
				<div class="segment"></div>
				<div class="segment"></div>
			</div>
			<div class="ring ring-2">
				<div class="tri"></div>
				<div class="tri"></div>
				<div class="tri"></div>
				<div class="tri"></div>
			</div>
			<div class="ring ring-3">
				<div class="diamond"></div>
				<div class="diamond"></div>
				<div class="diamond"></div>
			</div>
		</div>
		<span class="logo">peep</span>
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
		background: #0f172a;
		border-radius: 16px;
		overflow: hidden;
	}

	.kaleidoscope {
		position: absolute;
		width: 300px;
		height: 300px;
	}

	.ring {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.ring-1 { animation: spin 12s linear infinite; }
	.ring-2 { animation: spin 8s linear infinite reverse; }
	.ring-3 { animation: spin 16s linear infinite; }

	.segment {
		position: absolute;
		width: 40px;
		height: 40px;
		border: 2px solid;
		border-radius: 4px;
	}

	.segment:nth-child(1) { transform: rotate(0deg) translateX(120px); border-color: #f43f5e; }
	.segment:nth-child(2) { transform: rotate(60deg) translateX(120px); border-color: #f97316; }
	.segment:nth-child(3) { transform: rotate(120deg) translateX(120px); border-color: #eab308; }
	.segment:nth-child(4) { transform: rotate(180deg) translateX(120px); border-color: #22c55e; }
	.segment:nth-child(5) { transform: rotate(240deg) translateX(120px); border-color: #3b82f6; }
	.segment:nth-child(6) { transform: rotate(300deg) translateX(120px); border-color: #a855f7; }

	.tri {
		position: absolute;
		width: 0;
		height: 0;
		border-left: 15px solid transparent;
		border-right: 15px solid transparent;
		border-bottom: 26px solid;
	}

	.tri:nth-child(1) { transform: rotate(0deg) translateX(70px); border-bottom-color: #06b6d4; }
	.tri:nth-child(2) { transform: rotate(90deg) translateX(70px); border-bottom-color: #ec4899; }
	.tri:nth-child(3) { transform: rotate(180deg) translateX(70px); border-bottom-color: #84cc16; }
	.tri:nth-child(4) { transform: rotate(270deg) translateX(70px); border-bottom-color: #f59e0b; }

	.diamond {
		position: absolute;
		width: 20px;
		height: 20px;
		transform-origin: center;
	}

	.diamond:nth-child(1) { transform: rotate(0deg) translateX(40px) rotate(45deg); background: #818cf8; }
	.diamond:nth-child(2) { transform: rotate(120deg) translateX(40px) rotate(45deg); background: #fb7185; }
	.diamond:nth-child(3) { transform: rotate(240deg) translateX(40px) rotate(45deg); background: #34d399; }

	.logo {
		position: relative;
		font-size: 48px;
		font-weight: 800;
		color: #fff;
		z-index: 1;
		text-shadow: 0 0 40px rgba(99, 102, 241, 0.5);
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}
</style>
