<div class="container">
	<span class="label">23 / Stamp</span>
	<div class="screen">
		<!-- Background texture — faint ruled lines -->
		<div class="ruled"></div>

		<!-- Ghost stamps in background -->
		<div class="ghost ghost-1">APPROVED</div>
		<div class="ghost ghost-2">DRAFT</div>
		<div class="ghost ghost-3">v0.1</div>

		<!-- Main stamp -->
		<div class="stamp">
			<div class="stamp-border">
				<span class="stamp-text">peep</span>
				<span class="stamp-sub">markdown viewer</span>
				<span class="stamp-date">2024 · desktop</span>
			</div>
		</div>

		<!-- Ink splatter dots -->
		<div class="splatter s1"></div>
		<div class="splatter s2"></div>
		<div class="splatter s3"></div>
		<div class="splatter s4"></div>
		<div class="splatter s5"></div>

		<!-- Bottom shortcut row -->
		<div class="shortcuts">
			<div class="key-group">
				<kbd>⌘O</kbd><span class="key-label">open</span>
			</div>
			<div class="key-group">
				<kbd>⌘K</kbd><span class="key-label">cmds</span>
			</div>
			<div class="key-group">
				<kbd>⌘,</kbd><span class="key-label">prefs</span>
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

	/* Faint ruled paper lines */
	.ruled {
		position: absolute;
		inset: 0;
		background: repeating-linear-gradient(
			0deg,
			transparent,
			transparent 31px,
			#161b22 31px,
			#161b22 32px
		);
		opacity: 0.6;
	}

	/* Ghost stamps — faded background impressions */
	.ghost {
		position: absolute;
		font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.15em;
		color: #21262d;
		border: 3px solid #21262d;
		padding: 6px 14px;
		pointer-events: none;
	}

	.ghost-1 {
		top: 70px;
		right: 12%;
		font-size: 14px;
		transform: rotate(-8deg);
		opacity: 0;
		animation: ghost-in 300ms ease-out 600ms forwards;
	}

	.ghost-2 {
		bottom: 110px;
		left: 10%;
		font-size: 12px;
		transform: rotate(5deg);
		opacity: 0;
		animation: ghost-in 300ms ease-out 750ms forwards;
	}

	.ghost-3 {
		top: 50px;
		left: 15%;
		font-size: 11px;
		transform: rotate(-3deg);
		opacity: 0;
		animation: ghost-in 300ms ease-out 900ms forwards;
	}

	@keyframes ghost-in {
		to { opacity: 1; }
	}

	/* Main stamp — ink press effect */
	.stamp {
		position: relative;
		z-index: 2;
		transform: rotate(-4deg);
		opacity: 0;
		animation: stamp-press 200ms ease-out 300ms forwards;
	}

	@keyframes stamp-press {
		0% {
			opacity: 0;
			transform: rotate(-4deg) scale(1.15);
		}
		60% {
			opacity: 1;
			transform: rotate(-4deg) scale(0.98);
		}
		100% {
			opacity: 1;
			transform: rotate(-4deg) scale(1);
		}
	}

	.stamp-border {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 20px 36px 16px;
		border: 3px solid #58a6ff;
		box-shadow:
			inset 0 0 0 2px #0d1117,
			inset 0 0 0 4px #58a6ff;
	}

	.stamp-text {
		font-family: 'Comfortaa', 'SF Mono', monospace;
		font-size: 52px;
		font-weight: 700;
		color: #58a6ff;
		line-height: 1;
		letter-spacing: -0.01em;
	}

	.stamp-sub {
		font-family: 'SF Mono', 'Fira Code', monospace;
		font-size: 10px;
		font-weight: 600;
		color: #58a6ff;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		margin-top: 8px;
		opacity: 0.7;
	}

	.stamp-date {
		font-family: 'SF Mono', 'Fira Code', monospace;
		font-size: 9px;
		color: #58a6ff;
		letter-spacing: 0.12em;
		margin-top: 4px;
		opacity: 0.4;
	}

	/* Ink splatter dots */
	.splatter {
		position: absolute;
		z-index: 3;
		border-radius: 50%;
		background: #58a6ff;
		opacity: 0;
		animation: splat 150ms ease-out forwards;
	}

	.s1 { width: 4px; height: 4px; top: 42%; left: 38%; animation-delay: 350ms; }
	.s2 { width: 3px; height: 3px; top: 55%; right: 36%; animation-delay: 380ms; }
	.s3 { width: 2px; height: 2px; top: 40%; right: 38%; animation-delay: 400ms; }
	.s4 { width: 3px; height: 2px; bottom: 40%; left: 40%; animation-delay: 360ms; border-radius: 1px; }
	.s5 { width: 2px; height: 2px; top: 38%; left: 45%; animation-delay: 420ms; }

	@keyframes splat {
		to { opacity: 0.35; }
	}

	/* Shortcuts */
	.shortcuts {
		position: absolute;
		bottom: 28px;
		z-index: 2;
		display: flex;
		gap: 2px;
		border: 2px solid #30363d;
		box-shadow: 3px 3px 0 #30363d;
		background: #161b22;
		padding: 4px;
		opacity: 0;
		animation: fade-up 400ms ease-out 1000ms forwards;
	}

	@keyframes fade-up {
		from { opacity: 0; transform: translateY(6px); }
		to { opacity: 1; transform: translateY(0); }
	}

	.key-group {
		display: flex;
		align-items: center;
		gap: 5px;
		padding: 4px 8px;
		background: #21262d;
		border: 1px solid #30363d;
	}

	kbd {
		font-family: 'SF Mono', 'Fira Code', monospace;
		font-size: 11px;
		font-weight: 700;
		color: #58a6ff;
	}

	.key-label {
		font-size: 10px;
		color: #484f58;
	}
</style>
