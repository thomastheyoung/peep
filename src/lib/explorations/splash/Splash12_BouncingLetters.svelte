<div class="container">
	<span class="label">12 / Bouncing letters</span>
	<div class="screen">
		<div class="letters">
			<span class="letter l1">p</span>
			<span class="letter l2">e</span>
			<span class="letter l3">e</span>
			<span class="letter l4">p</span>
		</div>
		<div class="shadow-row">
			<span class="shadow s1"></span>
			<span class="shadow s2"></span>
			<span class="shadow s3"></span>
			<span class="shadow s4"></span>
		</div>
		<p class="tagline">your markdown companion</p>
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
		background: linear-gradient(180deg, #fef3c7 0%, #fff7ed 100%);
		border-radius: 16px;
		overflow: hidden;
	}

	.letters {
		display: flex;
		gap: 4px;
	}

	.letter {
		font-size: 72px;
		font-weight: 900;
		display: inline-block;
		animation: drop 0.5s cubic-bezier(0.35, 1.5, 0.65, 1) both;
	}

	.l1 { color: #f43f5e; animation-delay: 0.1s; }
	.l2 { color: #f97316; animation-delay: 0.25s; }
	.l3 { color: #eab308; animation-delay: 0.4s; }
	.l4 { color: #22c55e; animation-delay: 0.55s; }

	.shadow-row {
		display: flex;
		gap: 24px;
		margin-top: 4px;
	}

	.shadow {
		width: 36px;
		height: 8px;
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.08);
		animation: squash 0.5s cubic-bezier(0.35, 1.5, 0.65, 1) both;
	}

	.s1 { animation-delay: 0.1s; }
	.s2 { animation-delay: 0.25s; }
	.s3 { animation-delay: 0.4s; }
	.s4 { animation-delay: 0.55s; }

	.tagline {
		font-size: 13px;
		letter-spacing: 0.15em;
		color: #a3a3a3;
		margin-top: 20px;
		opacity: 0;
		animation: fadeIn 0.5s ease 1s forwards;
	}

	@keyframes drop {
		0% { transform: translateY(-120px) scaleY(1.2) scaleX(0.8); opacity: 0; }
		60% { transform: translateY(0) scaleY(0.85) scaleX(1.1); opacity: 1; }
		80% { transform: translateY(-15px) scaleY(1.05); }
		100% { transform: translateY(0) scaleY(1) scaleX(1); }
	}

	@keyframes squash {
		0% { transform: scaleX(0); opacity: 0; }
		60% { transform: scaleX(1.3); opacity: 1; }
		100% { transform: scaleX(1); }
	}

	@keyframes fadeIn {
		to { opacity: 1; }
	}
</style>
