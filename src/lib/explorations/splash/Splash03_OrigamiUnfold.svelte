<div class="container">
	<span class="label">03 / Origami unfold</span>
	<div class="screen">
		<div class="origami">
			<div class="fold fold-1">
				<div class="fold fold-2">
					<div class="fold fold-3">
						<div class="inner">
							<span class="icon">#</span>
						</div>
					</div>
				</div>
			</div>
		</div>
		<span class="logo">peep</span>
		<span class="tagline">unfold your docs</span>
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
		background: #fef7ed;
		border-radius: 16px;
		overflow: hidden;
	}

	.origami {
		perspective: 600px;
		margin-bottom: 24px;
	}

	.fold {
		transform-style: preserve-3d;
	}

	.fold-1 {
		animation: unfold1 0.6s ease-out 0.3s both;
	}

	.fold-2 {
		animation: unfold2 0.6s ease-out 0.7s both;
	}

	.fold-3 {
		animation: unfold3 0.5s ease-out 1.1s both;
	}

	.inner {
		width: 80px;
		height: 80px;
		background: linear-gradient(135deg, #f97316, #fb923c);
		border-radius: 16px;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 8px 32px rgba(249, 115, 22, 0.25);
	}

	.icon {
		font-size: 36px;
		font-weight: 800;
		color: #fff;
	}

	.logo {
		font-size: 48px;
		font-weight: 800;
		color: #1c1917;
		opacity: 0;
		transform: translateY(10px);
		animation: fadeUp 0.5s ease 1.4s forwards;
	}

	.tagline {
		font-size: 13px;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		color: #a8a29e;
		margin-top: 8px;
		opacity: 0;
		animation: fadeUp 0.5s ease 1.7s forwards;
	}

	@keyframes unfold1 {
		from { transform: rotateX(-90deg); opacity: 0; }
		to { transform: rotateX(0deg); opacity: 1; }
	}

	@keyframes unfold2 {
		from { transform: rotateY(-90deg); opacity: 0; }
		to { transform: rotateY(0deg); opacity: 1; }
	}

	@keyframes unfold3 {
		from { transform: scale(0.5) rotate(-10deg); opacity: 0; }
		to { transform: scale(1) rotate(0deg); opacity: 1; }
	}

	@keyframes fadeUp {
		to { opacity: 1; transform: translateY(0); }
	}
</style>
