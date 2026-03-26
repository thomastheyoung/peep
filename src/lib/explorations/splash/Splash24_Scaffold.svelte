<div class="container">
	<span class="label">24 / Scaffold</span>
	<div class="screen">
		<!-- Blueprint grid -->
		<div class="blueprint"></div>

		<!-- Crosshair center -->
		<div class="crosshair ch-h"></div>
		<div class="crosshair ch-v"></div>

		<!-- Construction lines that frame the logo -->
		<div class="line line-top"></div>
		<div class="line line-bottom"></div>
		<div class="line line-left"></div>
		<div class="line line-right"></div>

		<!-- Dimension markers -->
		<div class="dim dim-h">
			<span class="dim-line"></span>
			<span class="dim-val">280px</span>
			<span class="dim-line"></span>
		</div>
		<div class="dim dim-v">
			<span class="dim-line"></span>
			<span class="dim-val">120px</span>
			<span class="dim-line"></span>
		</div>

		<!-- Logo materializes inside the scaffold -->
		<div class="logo-area">
			<span class="logo">peep</span>
			<span class="coords">x: 0 · y: 0</span>
		</div>

		<!-- Corner coordinates -->
		<span class="corner corner-tl">(0, 0)</span>
		<span class="corner corner-tr">(280, 0)</span>
		<span class="corner corner-bl">(0, 120)</span>
		<span class="corner corner-br">(280, 120)</span>

		<!-- Status bar -->
		<div class="status">
			<span class="status-dot"></span>
			<span>ready</span>
			<span class="status-sep">|</span>
			<span>⌘O open</span>
			<span class="status-sep">|</span>
			<span>⌘K commands</span>
			<span class="status-sep">|</span>
			<span>⌘, settings</span>
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
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 480px;
		background: #0d1117;
		overflow: hidden;
	}

	/* Blueprint grid */
	.blueprint {
		position: absolute;
		inset: 0;
		background:
			linear-gradient(#161b22 1px, transparent 1px),
			linear-gradient(90deg, #161b22 1px, transparent 1px);
		background-size: 40px 40px;
		opacity: 0;
		animation: fade-in 500ms ease-out 100ms forwards;
	}

	/* Crosshairs */
	.crosshair {
		position: absolute;
		background: #30363d;
		opacity: 0;
		animation: fade-in 300ms ease-out 200ms forwards;
	}

	.ch-h {
		width: 100%;
		height: 1px;
		top: 50%;
	}

	.ch-v {
		width: 1px;
		height: 100%;
		left: 50%;
	}

	/* Construction lines — animate in from edges */
	.line {
		position: absolute;
		background: #58a6ff;
		opacity: 0.3;
	}

	.line-top {
		height: 1px;
		top: calc(50% - 60px);
		left: 0;
		width: 0;
		animation: draw-h 400ms ease-out 400ms forwards;
	}

	.line-bottom {
		height: 1px;
		top: calc(50% + 60px);
		right: 0;
		width: 0;
		animation: draw-h-rev 400ms ease-out 450ms forwards;
	}

	.line-left {
		width: 1px;
		left: calc(50% - 140px);
		top: 0;
		height: 0;
		animation: draw-v 400ms ease-out 500ms forwards;
	}

	.line-right {
		width: 1px;
		left: calc(50% + 140px);
		bottom: 0;
		height: 0;
		animation: draw-v-rev 400ms ease-out 550ms forwards;
	}

	@keyframes draw-h {
		to { width: 100%; }
	}

	@keyframes draw-h-rev {
		to { width: 100%; }
	}

	@keyframes draw-v {
		to { height: 100%; }
	}

	@keyframes draw-v-rev {
		to { height: 100%; }
	}

	/* Dimension markers */
	.dim {
		position: absolute;
		z-index: 3;
		display: flex;
		align-items: center;
		gap: 6px;
		opacity: 0;
		animation: fade-in 300ms ease-out 800ms forwards;
	}

	.dim-h {
		top: calc(50% - 76px);
		left: 50%;
		transform: translateX(-50%);
	}

	.dim-v {
		left: calc(50% - 156px);
		top: 50%;
		transform: translateY(-50%) rotate(-90deg);
	}

	.dim-line {
		display: block;
		width: 30px;
		height: 1px;
		background: #484f58;
	}

	.dim-val {
		font-family: 'SF Mono', 'Fira Code', monospace;
		font-size: 9px;
		color: #484f58;
		letter-spacing: 0.05em;
		white-space: nowrap;
	}

	/* Corner coordinates */
	.corner {
		position: absolute;
		z-index: 3;
		font-family: 'SF Mono', 'Fira Code', monospace;
		font-size: 9px;
		color: #30363d;
		opacity: 0;
		animation: fade-in 300ms ease-out 900ms forwards;
	}

	.corner-tl { top: calc(50% - 56px); left: calc(50% - 136px); }
	.corner-tr { top: calc(50% - 56px); left: calc(50% + 100px); }
	.corner-bl { top: calc(50% + 48px); left: calc(50% - 136px); }
	.corner-br { top: calc(50% + 48px); left: calc(50% + 100px); }

	/* Logo area */
	.logo-area {
		position: relative;
		z-index: 2;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		opacity: 0;
		animation: logo-materialize 500ms ease-out 700ms forwards;
	}

	@keyframes logo-materialize {
		from {
			opacity: 0;
			clip-path: inset(50% 0 50% 0);
		}
		to {
			opacity: 1;
			clip-path: inset(0 0 0 0);
		}
	}

	.logo {
		font-family: 'Comfortaa', 'SF Mono', monospace;
		font-size: 52px;
		font-weight: 700;
		color: #c9d1d9;
		line-height: 1;
	}

	.coords {
		font-family: 'SF Mono', 'Fira Code', monospace;
		font-size: 10px;
		color: #30363d;
		letter-spacing: 0.05em;
	}

	/* Status bar */
	.status {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 3;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 12px;
		background: #161b22;
		border-top: 2px solid #30363d;
		font-family: 'SF Mono', 'Fira Code', monospace;
		font-size: 11px;
		color: #484f58;
		opacity: 0;
		animation: fade-in 400ms ease-out 1100ms forwards;
	}

	.status-dot {
		width: 6px;
		height: 6px;
		background: #3fb950;
		border-radius: 0;
	}

	.status-sep {
		color: #30363d;
	}

	@keyframes fade-in {
		to { opacity: 1; }
	}
</style>
