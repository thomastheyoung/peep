<div class="container">
	<span class="label">19 / Vinyl record</span>
	<div class="screen">
		<div class="turntable">
			<div class="record">
				<div class="groove g1"></div>
				<div class="groove g2"></div>
				<div class="groove g3"></div>
				<div class="groove g4"></div>
				<div class="groove g5"></div>
				<div class="center-label">
					<span class="title">peep</span>
					<span class="artist">markdown viewer</span>
				</div>
				<div class="shine"></div>
			</div>
			<div class="tonearm">
				<div class="arm"></div>
				<div class="needle"></div>
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
		background: #292524;
		border-radius: 16px;
		overflow: hidden;
	}

	.turntable {
		position: relative;
		width: 280px;
		height: 280px;
	}

	.record {
		position: relative;
		width: 260px;
		height: 260px;
		border-radius: 50%;
		background: #111;
		animation: spin 3s linear infinite;
		box-shadow: 0 0 0 3px #222, 0 8px 30px rgba(0, 0, 0, 0.5);
	}

	.groove {
		position: absolute;
		border-radius: 50%;
		border: 1px solid rgba(255, 255, 255, 0.04);
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}

	.g1 { width: 90%; height: 90%; }
	.g2 { width: 78%; height: 78%; }
	.g3 { width: 66%; height: 66%; }
	.g4 { width: 54%; height: 54%; }
	.g5 { width: 42%; height: 42%; }

	.center-label {
		position: absolute;
		width: 80px;
		height: 80px;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		border-radius: 50%;
		background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.2);
	}

	.center-label::after {
		content: '';
		position: absolute;
		width: 8px;
		height: 8px;
		background: #111;
		border-radius: 50%;
	}

	.title {
		font-size: 14px;
		font-weight: 800;
		color: #fff;
		margin-bottom: -2px;
	}

	.artist {
		font-size: 5px;
		letter-spacing: 0.1em;
		color: rgba(255, 255, 255, 0.7);
		text-transform: uppercase;
	}

	.shine {
		position: absolute;
		inset: 0;
		border-radius: 50%;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, transparent 40%, transparent 60%, rgba(255, 255, 255, 0.03) 100%);
	}

	.tonearm {
		position: absolute;
		top: -10px;
		right: 10px;
		transform-origin: top right;
		animation: armDrop 1.5s ease-out 0.5s both;
	}

	.arm {
		width: 4px;
		height: 120px;
		background: linear-gradient(180deg, #78716c 0%, #a8a29e 100%);
		border-radius: 2px;
		transform: rotate(-20deg);
		transform-origin: top center;
	}

	.needle {
		width: 2px;
		height: 12px;
		background: #d6d3d1;
		position: absolute;
		bottom: -8px;
		left: -15px;
		transform: rotate(-25deg);
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	@keyframes armDrop {
		from { transform: rotate(-30deg); }
		to { transform: rotate(0deg); }
	}
</style>
