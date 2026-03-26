<div class="container">
	<span class="label">22 / Brutalist</span>
	<div class="screen">
		<!-- Background grid -->
		<div class="grid"></div>

		<!-- Decorative offset frames -->
		<div class="frame frame-1"></div>
		<div class="frame frame-2"></div>
		<div class="frame frame-3"></div>

		<!-- Main card -->
		<div class="card">
			<div class="card-titlebar">
				<span class="card-title">peep.md</span>
				<div class="card-controls">
					<span class="control"></span>
					<span class="control"></span>
					<span class="control close"></span>
				</div>
			</div>
			<div class="card-body">
				<span class="logo">peep</span>
				<span class="tagline">have a nice doc</span>
			</div>
		</div>

		<!-- Shortcut strip -->
		<div class="shortcuts">
			<div class="shortcut">
				<kbd>⌘O</kbd>
				<span>open</span>
			</div>
			<div class="shortcut">
				<kbd>⌘K</kbd>
				<span>commands</span>
			</div>
			<div class="shortcut">
				<kbd>⌘,</kbd>
				<span>settings</span>
			</div>
			<div class="shortcut">
				<kbd>CLI</kbd>
				<span>peep file.md</span>
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
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 480px;
		background: #0d1117;
		overflow: hidden;
	}

	/* Subtle dot grid background */
	.grid {
		position: absolute;
		inset: 0;
		background-image: radial-gradient(circle, #21262d 1px, transparent 1px);
		background-size: 24px 24px;
		opacity: 0;
		animation: grid-in 600ms ease-out 200ms forwards;
	}

	@keyframes grid-in {
		to { opacity: 1; }
	}

	/* Decorative offset frames — brutalist window ghosts */
	.frame {
		position: absolute;
		border: 2px solid #30363d;
		box-shadow: 3px 3px 0 #30363d;
	}

	.frame-1 {
		width: 180px;
		height: 120px;
		top: 60px;
		left: 10%;
		opacity: 0;
		animation: frame-slide 500ms ease-out 400ms forwards;
	}

	.frame-2 {
		width: 140px;
		height: 90px;
		bottom: 80px;
		right: 8%;
		opacity: 0;
		animation: frame-slide 500ms ease-out 550ms forwards;
	}

	.frame-3 {
		width: 100px;
		height: 70px;
		top: 40px;
		right: 18%;
		opacity: 0;
		animation: frame-slide 500ms ease-out 650ms forwards;
	}

	@keyframes frame-slide {
		from {
			opacity: 0;
			transform: translate(4px, 4px);
		}
		to {
			opacity: 0.4;
			transform: translate(0, 0);
		}
	}

	/* Main card — styled like tab bar chrome */
	.card {
		position: relative;
		z-index: 2;
		width: 280px;
		border: 2px solid #30363d;
		box-shadow: 4px 4px 0 #30363d;
		background: #161b22;
		opacity: 0;
		animation: card-in 400ms ease-out 300ms forwards;
	}

	@keyframes card-in {
		from {
			opacity: 0;
			transform: translate(4px, 4px);
		}
		to {
			opacity: 1;
			transform: translate(0, 0);
		}
	}

	.card-titlebar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 6px 8px;
		border-bottom: 2px solid #30363d;
		background: #21262d;
	}

	.card-title {
		font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
		font-size: 11px;
		font-weight: 600;
		color: #8b949e;
		letter-spacing: 0.02em;
	}

	.card-controls {
		display: flex;
		gap: 4px;
	}

	.control {
		width: 10px;
		height: 10px;
		border: 1.5px solid #30363d;
		background: transparent;
	}

	.control.close {
		position: relative;
	}

	.control.close::before,
	.control.close::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: 6px;
		height: 1.5px;
		background: #30363d;
	}

	.control.close::before {
		transform: translate(-50%, -50%) rotate(45deg);
	}

	.control.close::after {
		transform: translate(-50%, -50%) rotate(-45deg);
	}

	.card-body {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 32px 24px 28px;
		gap: 10px;
	}

	.logo {
		font-family: 'Comfortaa', 'SF Mono', monospace;
		font-size: 48px;
		font-weight: 700;
		color: #58a6ff;
		letter-spacing: -0.02em;
		line-height: 1;
	}

	.tagline {
		font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
		font-size: 12px;
		color: #484f58;
		letter-spacing: 0.08em;
		text-transform: lowercase;
	}

	/* Shortcut strip — brutalist kbd buttons */
	.shortcuts {
		position: relative;
		z-index: 2;
		display: flex;
		gap: 6px;
		margin-top: 28px;
		padding: 6px;
		background: #161b22;
		border: 2px solid #30363d;
		box-shadow: 3px 3px 0 #30363d;
		opacity: 0;
		animation: strip-in 400ms ease-out 700ms forwards;
	}

	@keyframes strip-in {
		from {
			opacity: 0;
			transform: translateY(6px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.shortcut {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 4px 8px;
		background: #21262d;
		border: 1px solid #30363d;
		transition: transform 100ms ease, box-shadow 100ms ease;
	}

	.shortcut:hover {
		transform: translate(-1px, -1px);
		box-shadow: 2px 2px 0 #30363d;
	}

	.shortcut:active {
		transform: translate(1px, 1px);
		box-shadow: none;
	}

	kbd {
		font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
		font-size: 11px;
		font-weight: 700;
		color: #58a6ff;
		line-height: 1;
	}

	.shortcut span {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		font-size: 11px;
		color: #484f58;
		line-height: 1;
	}
</style>
