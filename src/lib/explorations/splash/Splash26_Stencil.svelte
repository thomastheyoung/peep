<div class="container">
	<span class="label">26 / Stencil</span>
	<div class="screen">
		<!-- Warning stripes top -->
		<div class="stripes stripes-top"></div>

		<!-- Crate surface texture -->
		<div class="grain"></div>

		<!-- Stencil block -->
		<div class="crate">
			<!-- Serial number -->
			<span class="serial">SN-2024-001</span>

			<!-- Main stencil -->
			<div class="stencil-mark">
				<span class="stencil-logo">peep</span>
			</div>

			<!-- Sub labels -->
			<div class="sub-marks">
				<div class="mark">
					<span class="mark-label">TYPE</span>
					<span class="mark-value">MARKDOWN VIEWER</span>
				</div>
				<div class="mark">
					<span class="mark-label">PLATFORM</span>
					<span class="mark-value">DESKTOP</span>
				</div>
				<div class="mark">
					<span class="mark-label">STATUS</span>
					<span class="mark-value status-ready">■ READY</span>
				</div>
			</div>

			<!-- Handling icons row -->
			<div class="icons-row">
				<div class="icon-box">
					<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
						<path d="M4 16V4h12v12H4z" stroke="currentColor" stroke-width="1.5"/>
						<path d="M7 10h6M10 7v6" stroke="currentColor" stroke-width="1.5"/>
					</svg>
					<span>⌘O</span>
				</div>
				<div class="icon-box">
					<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
						<path d="M3 5h14M3 10h14M3 15h10" stroke="currentColor" stroke-width="1.5"/>
					</svg>
					<span>⌘K</span>
				</div>
				<div class="icon-box">
					<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
						<circle cx="10" cy="10" r="6.5" stroke="currentColor" stroke-width="1.5"/>
						<path d="M10 7v4M9 13h2" stroke="currentColor" stroke-width="1.5"/>
					</svg>
					<span>⌘,</span>
				</div>
			</div>
		</div>

		<!-- Warning stripes bottom -->
		<div class="stripes stripes-bottom"></div>
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
		height: 480px;
		background: #0d1117;
		overflow: hidden;
	}

	/* Diagonal warning stripes */
	.stripes {
		position: absolute;
		left: 0;
		right: 0;
		height: 12px;
		background: repeating-linear-gradient(
			-45deg,
			#30363d,
			#30363d 8px,
			transparent 8px,
			transparent 16px
		);
		opacity: 0;
		animation: fade-in 400ms ease-out 200ms forwards;
	}

	.stripes-top { top: 0; }
	.stripes-bottom { bottom: 0; }

	/* Wood grain texture */
	.grain {
		position: absolute;
		inset: 0;
		background: repeating-linear-gradient(
			2deg,
			transparent,
			transparent 18px,
			#161b22 18px,
			#161b22 19px
		);
		opacity: 0.3;
	}

	/* Crate panel */
	.crate {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
		padding: 28px 36px 24px;
		border: 2px dashed #30363d;
		opacity: 0;
		animation: crate-in 400ms ease-out 300ms forwards;
	}

	@keyframes crate-in {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.serial {
		position: absolute;
		top: 8px;
		right: 12px;
		font-family: 'SF Mono', 'Fira Code', monospace;
		font-size: 8px;
		color: #30363d;
		letter-spacing: 0.1em;
	}

	/* Main stencil mark */
	.stencil-mark {
		opacity: 0;
		animation: stencil-spray 300ms ease-out 500ms forwards;
	}

	@keyframes stencil-spray {
		0% { opacity: 0; filter: blur(4px); }
		70% { opacity: 0.9; filter: blur(0px); }
		100% { opacity: 1; filter: blur(0px); }
	}

	.stencil-logo {
		font-family: 'Comfortaa', 'SF Mono', monospace;
		font-size: 64px;
		font-weight: 700;
		color: #c9d1d9;
		line-height: 1;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	/* Sub marks */
	.sub-marks {
		display: flex;
		gap: 20px;
		opacity: 0;
		animation: fade-in 400ms ease-out 800ms forwards;
	}

	.mark {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
	}

	.mark-label {
		font-family: 'SF Mono', 'Fira Code', monospace;
		font-size: 8px;
		font-weight: 600;
		color: #484f58;
		letter-spacing: 0.15em;
	}

	.mark-value {
		font-family: 'SF Mono', 'Fira Code', monospace;
		font-size: 11px;
		font-weight: 700;
		color: #8b949e;
		letter-spacing: 0.08em;
	}

	.status-ready {
		color: #3fb950;
	}

	/* Handling icons */
	.icons-row {
		display: flex;
		gap: 12px;
		margin-top: 4px;
		opacity: 0;
		animation: fade-in 400ms ease-out 1000ms forwards;
	}

	.icon-box {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		padding: 8px 12px;
		border: 2px solid #30363d;
		box-shadow: 2px 2px 0 #30363d;
		color: #8b949e;
		background: #0d1117;
	}

	.icon-box span {
		font-family: 'SF Mono', 'Fira Code', monospace;
		font-size: 10px;
		font-weight: 700;
		color: #58a6ff;
	}

	@keyframes fade-in {
		to { opacity: 1; }
	}
</style>
