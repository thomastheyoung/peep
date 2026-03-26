<div class="container">
	<span class="label">25 / Split flap</span>
	<div class="screen">
		<!-- Board frame -->
		<div class="board">
			<div class="board-header">
				<span class="board-title">DEPARTURES</span>
				<span class="board-time">NOW</span>
			</div>

			<!-- Flap row: logo -->
			<div class="flap-row main-row">
				{#each ['p', 'e', 'e', 'p'] as letter, i}
					<div class="flap" style="--delay: {200 + i * 120}ms">
						<div class="flap-inner">
							<span class="flap-char">{letter}</span>
						</div>
						<div class="flap-divider"></div>
					</div>
				{/each}
			</div>

			<!-- Separator -->
			<div class="row-sep"></div>

			<!-- Info rows -->
			<div class="info-row">
				<div class="info-cell destination">
					<span class="cell-label">TO</span>
					<div class="flap-row small-row">
						{#each 'YOUR DOCS' as ch, i}
							<div class="flap small" style="--delay: {800 + i * 60}ms">
								<div class="flap-inner">
									<span class="flap-char">{ch}</span>
								</div>
								<div class="flap-divider"></div>
							</div>
						{/each}
					</div>
				</div>
				<div class="info-cell status-cell">
					<span class="cell-label">STATUS</span>
					<div class="flap-row small-row">
						{#each 'READY' as ch, i}
							<div class="flap small ready" style="--delay: {1400 + i * 80}ms">
								<div class="flap-inner">
									<span class="flap-char">{ch}</span>
								</div>
								<div class="flap-divider"></div>
							</div>
						{/each}
					</div>
				</div>
			</div>

			<!-- Shortcut row -->
			<div class="row-sep"></div>
			<div class="shortcut-row">
				<div class="sc"><kbd>⌘O</kbd> open</div>
				<div class="sc"><kbd>⌘K</kbd> commands</div>
				<div class="sc"><kbd>⌘,</kbd> settings</div>
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
		height: 480px;
		background: #0d1117;
		overflow: hidden;
	}

	/* Board */
	.board {
		border: 2px solid #30363d;
		box-shadow: 4px 4px 0 #30363d;
		background: #161b22;
		padding: 0;
		width: 360px;
		opacity: 0;
		animation: board-in 400ms ease-out 100ms forwards;
	}

	@keyframes board-in {
		from { opacity: 0; transform: translateY(8px); }
		to { opacity: 1; transform: translateY(0); }
	}

	.board-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px 12px;
		border-bottom: 2px solid #30363d;
		background: #21262d;
	}

	.board-title {
		font-family: 'SF Mono', 'Fira Code', monospace;
		font-size: 10px;
		font-weight: 700;
		color: #8b949e;
		letter-spacing: 0.15em;
	}

	.board-time {
		font-family: 'SF Mono', 'Fira Code', monospace;
		font-size: 10px;
		color: #484f58;
		letter-spacing: 0.1em;
	}

	/* Flap rows */
	.flap-row {
		display: flex;
		justify-content: center;
		gap: 4px;
	}

	.main-row {
		padding: 24px 16px 20px;
	}

	/* Individual flap */
	.flap {
		position: relative;
		width: 52px;
		height: 64px;
		background: #0d1117;
		border: 2px solid #30363d;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		opacity: 0;
		animation: flap-flip 300ms ease-out var(--delay) forwards;
	}

	.flap.small {
		width: 22px;
		height: 28px;
		border-width: 1px;
	}

	.flap.ready .flap-char {
		color: #3fb950;
	}

	@keyframes flap-flip {
		0% {
			opacity: 0;
			transform: rotateX(90deg);
		}
		60% {
			opacity: 1;
			transform: rotateX(-5deg);
		}
		100% {
			opacity: 1;
			transform: rotateX(0deg);
		}
	}

	.flap-inner {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
	}

	.flap-char {
		font-family: 'Comfortaa', 'SF Mono', monospace;
		font-size: 36px;
		font-weight: 700;
		color: #c9d1d9;
		line-height: 1;
		text-transform: lowercase;
	}

	.flap.small .flap-char {
		font-family: 'SF Mono', 'Fira Code', monospace;
		font-size: 14px;
		font-weight: 600;
		text-transform: uppercase;
	}

	/* Center divider line */
	.flap-divider {
		position: absolute;
		left: 0;
		right: 0;
		top: 50%;
		height: 1px;
		background: #21262d;
		pointer-events: none;
	}

	/* Row separator */
	.row-sep {
		height: 2px;
		background: #30363d;
		margin: 0;
	}

	/* Info rows */
	.info-row {
		display: flex;
		padding: 12px 16px;
		gap: 16px;
	}

	.info-cell {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.destination {
		flex: 1;
	}

	.cell-label {
		font-family: 'SF Mono', 'Fira Code', monospace;
		font-size: 9px;
		font-weight: 600;
		color: #484f58;
		letter-spacing: 0.15em;
	}

	.small-row {
		gap: 2px;
		justify-content: flex-start;
	}

	/* Shortcuts */
	.shortcut-row {
		display: flex;
		gap: 2px;
		padding: 8px;
	}

	.sc {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 5px;
		padding: 5px 6px;
		background: #21262d;
		border: 1px solid #30363d;
		font-family: 'SF Mono', 'Fira Code', monospace;
		font-size: 10px;
		color: #484f58;
	}

	kbd {
		font-family: inherit;
		font-weight: 700;
		color: #58a6ff;
	}
</style>
