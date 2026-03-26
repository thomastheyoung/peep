<div class="container">
	<span class="label">27 / Concrete</span>
	<div class="screen">
		<!-- Brutalist architecture facade -->
		<div class="facade">
			<!-- Top beam -->
			<div class="beam beam-top"></div>

			<!-- Column grid -->
			<div class="columns">
				<div class="col"></div>
				<div class="col wide">
					<!-- Window openings -->
					<div class="window-row">
						<div class="window"></div>
						<div class="window"></div>
						<div class="window"></div>
					</div>

					<!-- Main slab with logo -->
					<div class="slab">
						<span class="logo">peep</span>
					</div>

					<!-- Lower windows with labels -->
					<div class="window-row labeled">
						<div class="window-labeled">
							<div class="window small"></div>
							<span class="win-label">⌘O<br/>open</span>
						</div>
						<div class="window-labeled">
							<div class="window small"></div>
							<span class="win-label">⌘K<br/>cmds</span>
						</div>
						<div class="window-labeled">
							<div class="window small"></div>
							<span class="win-label">⌘,<br/>prefs</span>
						</div>
						<div class="window-labeled">
							<div class="window small"></div>
							<span class="win-label">CLI<br/>peep</span>
						</div>
					</div>
				</div>
				<div class="col"></div>
			</div>

			<!-- Bottom beam -->
			<div class="beam beam-bottom">
				<span class="plaque">have a nice doc</span>
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

	/* Building facade */
	.facade {
		display: flex;
		flex-direction: column;
		width: 360px;
		opacity: 0;
		animation: rise 600ms ease-out 200ms forwards;
	}

	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Horizontal beams */
	.beam {
		height: 16px;
		background: #21262d;
		border: 2px solid #30363d;
		box-shadow: 3px 3px 0 #1a1f25;
	}

	.beam-top {
		margin-bottom: -2px;
		z-index: 2;
	}

	.beam-bottom {
		margin-top: -2px;
		z-index: 2;
		display: flex;
		align-items: center;
		justify-content: center;
		height: 28px;
	}

	.plaque {
		font-family: 'SF Mono', 'Fira Code', monospace;
		font-size: 9px;
		font-weight: 600;
		color: #484f58;
		letter-spacing: 0.18em;
		text-transform: uppercase;
	}

	/* Column layout */
	.columns {
		display: flex;
		min-height: 300px;
	}

	.col {
		width: 24px;
		background: #21262d;
		border-left: 2px solid #30363d;
		border-right: 2px solid #30363d;
		box-shadow: 2px 0 0 #1a1f25;
	}

	.col.wide {
		flex: 1;
		background: #161b22;
		border: none;
		box-shadow: none;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 16px;
		padding: 20px 16px;
	}

	/* Window openings — dark recessed rectangles */
	.window-row {
		display: flex;
		gap: 8px;
		opacity: 0;
		animation: windows-in 400ms ease-out 500ms forwards;
	}

	.window-row.labeled {
		animation-delay: 900ms;
		gap: 6px;
	}

	@keyframes windows-in {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.window {
		width: 48px;
		height: 32px;
		background: #0d1117;
		border: 2px solid #30363d;
		box-shadow: inset 2px 2px 0 #0a0e13;
	}

	.window.small {
		width: 40px;
		height: 22px;
	}

	.window-labeled {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
	}

	.win-label {
		font-family: 'SF Mono', 'Fira Code', monospace;
		font-size: 9px;
		font-weight: 600;
		color: #484f58;
		text-align: center;
		line-height: 1.3;
	}

	/* Main logo slab */
	.slab {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		padding: 24px 16px;
		background: #21262d;
		border: 2px solid #30363d;
		box-shadow:
			3px 3px 0 #1a1f25,
			inset 0 0 0 3px #161b22;
		opacity: 0;
		animation: slab-in 400ms ease-out 700ms forwards;
	}

	@keyframes slab-in {
		from {
			opacity: 0;
			transform: translateY(4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.logo {
		font-family: 'Comfortaa', 'SF Mono', monospace;
		font-size: 52px;
		font-weight: 700;
		color: #c9d1d9;
		line-height: 1;
		letter-spacing: 0.04em;
	}
</style>
