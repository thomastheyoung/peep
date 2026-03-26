<script lang="ts">
	interface Props {
		onOpenFile: () => void;
		hidden?: boolean;
	}

	let { onOpenFile, hidden = false }: Props = $props();

	const splatters = [
		{ w: 6, h: 6, top: '40%', left: '36%', delay: 350 },
		{ w: 5, h: 5, top: '56%', left: '62%', delay: 380 },
		{ w: 3, h: 3, top: '38%', left: '58%', delay: 400 },
		{ w: 5, h: 3, top: '60%', left: '42%', delay: 360, radius: '1px' },
		{ w: 3, h: 3, top: '36%', left: '47%', delay: 420 },
		{ w: 4, h: 4, top: '53%', left: '39%', delay: 390 },
		{ w: 3, h: 4, top: '44%', left: '64%', delay: 410 },
	];
</script>

<div class="stamp-home" class:hidden>
	<!-- Background ruled lines -->
	<div class="ruled"></div>

	<!-- Main stamp -->
	<div class="stamp">
		<div class="stamp-border">
			<h1 class="stamp-logo">peep</h1>
			<span class="stamp-sub">have a nice doc</span>
		</div>
	</div>

	<!-- Ink splatters -->
	{#each splatters as s}
		<span
			class="splatter"
			style="width:{s.w}px;height:{s.h}px;top:{s.top};left:{s.left};animation-delay:{s.delay}ms;{s.radius ? `border-radius:${s.radius}` : ''}"
		></span>
	{/each}

	<!-- Help panel -->
	<div class="help-panel">
		<div class="help-card">
			<button class="help-row" onclick={onOpenFile} type="button">
				<kbd>&#8984;O</kbd>
				<span>Open file</span>
			</button>
			<div class="help-row">
				<kbd>&#8984;K</kbd>
				<span>Command palette</span>
			</div>
			<div class="help-row">
				<kbd>&#8984;,</kbd>
				<span>Preferences</span>
			</div>
			<div class="help-sep"></div>
			<div class="help-row subtle">
				<span class="cli">peep readme.md</span>
				<span>Open from terminal</span>
			</div>
		</div>
	</div>
</div>

<style>
	.stamp-home {
		position: absolute;
		inset: 0;
		background: var(--chrome-bg, #0d1117);
		overflow: hidden;
		container-type: size;
		transition: visibility 0s, opacity 0.3s ease;
	}

	.stamp-home.hidden {
		visibility: hidden;
		opacity: 0;
		pointer-events: none;
	}

	.stamp-home.hidden :is(.stamp, .splatter, .help-panel) {
		animation-play-state: paused;
	}

	/* ---- Ruled background ---- */
	.ruled {
		position: absolute;
		inset: 0;
		background: repeating-linear-gradient(
			0deg,
			transparent,
			transparent 31px,
			var(--chrome-surface, #161b22) 31px,
			var(--chrome-surface, #161b22) 32px
		);
		opacity: 0.5;
	}

	/* ---- Main stamp ---- */
	.stamp {
		position: absolute;
		top: 28%;
		left: 50%;
		z-index: 2;
		transform: translate(-50%, -50%) rotate(-4deg);
		opacity: 0;
		animation: stamp-press 300ms cubic-bezier(0.22, 0, 0.36, 1) 200ms forwards;
	}

	@keyframes stamp-press {
		0% {
			opacity: 0;
			transform: translate(-50%, -50%) rotate(-4deg) scale(1.25);
		}
		50% {
			opacity: 1;
			transform: translate(-50%, -50%) rotate(-4deg) scale(0.96);
		}
		75% {
			transform: translate(-50%, -50%) rotate(-4deg) scale(1.02);
		}
		100% {
			opacity: 1;
			transform: translate(-50%, -50%) rotate(-4deg) scale(1);
		}
	}

	.stamp-border {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 30px 56px 24px;
		border: 4px solid var(--chrome-accent, #58a6ff);
		box-shadow:
			inset 0 0 0 3px var(--chrome-bg, #0d1117),
			inset 0 0 0 6px var(--chrome-accent, #58a6ff);
	}

	.stamp-logo {
		margin: 0;
		font-family: 'Comfortaa', sans-serif;
		font-size: 96px;
		font-weight: 700;
		color: var(--chrome-accent, #58a6ff);
		line-height: 1;
		letter-spacing: -0.01em;
	}

	.stamp-sub {
		font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
		font-size: 13px;
		font-weight: 600;
		color: var(--chrome-accent, #58a6ff);
		letter-spacing: 0.2em;
		text-transform: uppercase;
		margin-top: 12px;
		opacity: 0.6;
	}

	/* ---- Ink splatters ---- */
	.splatter {
		position: absolute;
		z-index: 3;
		border-radius: 50%;
		background: var(--chrome-accent, #58a6ff);
		opacity: 0;
		pointer-events: none;
		animation: splat-in 600ms ease-out forwards;
	}

	@keyframes splat-in {
		to { opacity: 0.3; }
	}


	/* ---- Help panel ---- */
	.help-panel {
		position: absolute;
		top: 58%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: 4;
		opacity: 0;
		animation: fade-up-in 800ms ease-out 600ms forwards;
	}

	@keyframes fade-up-in {
		from {
			opacity: 0;
			transform: translate(-50%, -46%);
		}
		to {
			opacity: 1;
			transform: translate(-50%, -50%);
		}
	}

	.help-card {
		display: flex;
		flex-direction: column;
		gap: 16px;
		padding: 28px 32px;
		background: var(--chrome-surface, #161b22);
		border: 2px solid var(--chrome-border, #30363d);
		box-shadow: 4px 4px 0 var(--chrome-border, #30363d);
		font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif;
	}

	.help-row {
		display: flex;
		align-items: center;
		gap: 16px;
		background: none;
		border: none;
		padding: 0;
		cursor: default;
		font-family: inherit;
	}

	button.help-row {
		cursor: pointer;
		padding: 6px 8px;
		margin: -6px -8px;
		transition:
			background 100ms ease,
			transform 100ms ease,
			box-shadow 100ms ease;
	}

	button.help-row:hover {
		background: var(--chrome-bg-hover, #282e36);
	}

	button.help-row:active {
		transform: translate(1px, 1px);
	}

	kbd {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 52px;
		padding: 6px 12px;
		font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
		font-size: 15px;
		font-weight: 700;
		color: var(--chrome-accent, #58a6ff);
		background: var(--chrome-bg, #0d1117);
		border: 1px solid var(--chrome-border, #30363d);
		box-shadow: 2px 2px 0 var(--chrome-border, #30363d);
	}

	.help-row span:last-child {
		font-size: 16px;
		color: var(--chrome-text, #8b949e);
		letter-spacing: 0.01em;
	}

	.help-sep {
		height: 2px;
		background: var(--chrome-border, #30363d);
		margin: 2px 0;
	}

	.subtle span:last-child {
		color: var(--chrome-text, #8b949e);
		opacity: 0.5;
	}

	.cli {
		font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
		font-size: 14px !important;
		color: var(--chrome-accent, #58a6ff) !important;
		opacity: 0.7;
		padding: 6px 12px;
		background: var(--chrome-bg, #0d1117);
		border: 1px solid var(--chrome-border, #30363d);
		box-shadow: 2px 2px 0 var(--chrome-border, #30363d);
	}
</style>
