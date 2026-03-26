<div class="container">
	<span class="label">01 / Typewriter</span>
	<div class="screen">
		<div class="content">
			<span class="logo">peep</span>
			<span class="cursor">|</span>
		</div>
		<p class="subtitle">markdown viewer</p>
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
		background: #0f172a;
		border-radius: 16px;
		overflow: hidden;
	}

	.content {
		display: flex;
		align-items: baseline;
	}

	.logo {
		font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
		font-size: 72px;
		font-weight: 700;
		color: #e2e8f0;
		overflow: hidden;
		white-space: nowrap;
		width: 0;
		animation: type 1.2s steps(4) 0.5s forwards;
	}

	.cursor {
		font-family: 'SF Mono', monospace;
		font-size: 72px;
		font-weight: 300;
		color: #6366f1;
		animation: blink 0.6s step-end infinite;
	}

	.subtitle {
		font-size: 14px;
		letter-spacing: 0.3em;
		text-transform: uppercase;
		color: #475569;
		margin-top: 12px;
		opacity: 0;
		animation: fadeIn 0.6s ease 1.8s forwards;
	}

	@keyframes type {
		to { width: 4ch; }
	}

	@keyframes blink {
		50% { opacity: 0; }
	}

	@keyframes fadeIn {
		to { opacity: 1; }
	}
</style>
