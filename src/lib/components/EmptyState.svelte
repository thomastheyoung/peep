<script lang="ts">
	interface Props {
		onOpenFile: () => void;
		hidden?: boolean;
	}

	let { onOpenFile, hidden = false }: Props = $props();

	const stars = Array.from({ length: 50 }, () => ({
		left: Math.random() * 100,
		top: Math.random() * 55,
		delay: Math.random() * 5,
		duration: 2 + Math.random() * 4,
		size: 0.8 + Math.random() * 1.8,
	}));
</script>

<div class="aurora-home" class:hidden>
	<div class="aurora-group">
		<div class="aurora a1"></div>
		<div class="aurora a2"></div>
		<div class="aurora a3"></div>
		<div class="aurora a4"></div>
		<div class="aurora a5"></div>
	</div>

	<div class="stars">
		{#each stars as s}
			<span
				class="star"
				style="left:{s.left}%;top:{s.top}%;animation-delay:{s.delay}s;animation-duration:{s.duration}s;width:{s.size}px;height:{s.size}px"
			></span>
		{/each}
	</div>

	<div class="logo-track">
		<h1 class="logo">peep</h1>
		<p class="tagline">Have a nice doc</p>
	</div>

	<div class="help-panel">
		<div class="help-card">
			<button class="help-row" onclick={onOpenFile}>
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
			<div class="help-divider"></div>
			<div class="help-row subtle">
				<span class="cli">peep readme.md</span>
				<span>Open from terminal</span>
			</div>
		</div>
	</div>
</div>

<style>
	.aurora-home {
		position: absolute;
		inset: 0;
		background: linear-gradient(180deg, #020617 0%, #0a0f1f 40%, #111827 75%, #1a2236 100%);
		overflow: hidden;
		container-type: size;
		transition: visibility 0s, opacity 0.3s ease;
	}

	.aurora-home.hidden {
		visibility: hidden;
		opacity: 0;
		pointer-events: none;
	}

	/* Pause all animations when hidden — zero GPU work while viewing files.
	   visibility:hidden (not display:none) preserves animation progress,
	   so they resume exactly where they left off. */
	.aurora-home.hidden :is(.aurora, .star, .logo-track, .logo, .tagline, .help-panel) {
		animation-play-state: paused;
	}

	/* ---- Aurora ---- */
	.aurora-group {
		position: absolute;
		inset: -60px;
		overflow: hidden;
	}

	.aurora {
		position: absolute;
		width: 160%;
		height: 45%;
		left: -30%;
		border-radius: 50%;
		filter: blur(50px);
		opacity: 0;
		mix-blend-mode: screen;
		will-change: transform, opacity;
	}

	.a1 {
		top: 5%;
		background: linear-gradient(90deg, transparent 5%, #22d3ee 25%, #10b981 50%, #22d3ee 75%, transparent 95%);
		animation: drift-a1 13s linear infinite, fade-aurora 2s ease-out 0.3s forwards;
	}

	.a2 {
		top: 12%;
		background: linear-gradient(90deg, transparent 5%, #a78bfa 30%, #7c3aed 55%, #6366f1 75%, transparent 95%);
		animation: drift-a2 17s linear infinite, fade-aurora 2s ease-out 0.6s forwards;
	}

	.a3 {
		top: 2%;
		background: linear-gradient(90deg, transparent 5%, #34d399 20%, #22d3ee 45%, #818cf8 70%, transparent 95%);
		animation: drift-a3 11s linear infinite, fade-aurora 2s ease-out 0.1s forwards;
	}

	.a4 {
		top: 18%;
		height: 35%;
		background: linear-gradient(90deg, transparent 10%, #06b6d4 35%, #10b981 60%, transparent 90%);
		animation: drift-a4 19s linear infinite, fade-aurora 2s ease-out 0.9s forwards;
	}

	.a5 {
		top: 8%;
		height: 30%;
		background: linear-gradient(90deg, transparent 10%, #c084fc 30%, #e879f9 50%, #818cf8 70%, transparent 90%);
		animation: drift-a5 23s linear infinite, fade-aurora 2.5s ease-out 1.2s forwards;
	}

	@keyframes drift-a1 {
		0%   { transform: translateX(-8%) translateY(0%)   rotate(-1.5deg) scaleX(1);    }
		20%  { transform: translateX(4%)  translateY(-3%)  rotate(1deg)    scaleX(1.05);  }
		40%  { transform: translateX(10%) translateY(1%)   rotate(-0.5deg) scaleX(0.97);  }
		60%  { transform: translateX(3%)  translateY(-2%)  rotate(1.5deg)  scaleX(1.03);  }
		80%  { transform: translateX(-5%) translateY(2%)   rotate(-1deg)   scaleX(1.01);  }
		100% { transform: translateX(-8%) translateY(0%)   rotate(-1.5deg) scaleX(1);     }
	}

	@keyframes drift-a2 {
		0%   { transform: translateX(6%)  translateY(1%)   rotate(1deg)    scaleX(1.02);  }
		25%  { transform: translateX(-6%) translateY(-2%)  rotate(-1.5deg) scaleX(0.96);  }
		50%  { transform: translateX(3%)  translateY(3%)   rotate(0.5deg)  scaleX(1.06);  }
		75%  { transform: translateX(-9%) translateY(-1%)  rotate(-1deg)   scaleX(0.98);  }
		100% { transform: translateX(6%)  translateY(1%)   rotate(1deg)    scaleX(1.02);  }
	}

	@keyframes drift-a3 {
		0%   { transform: translateX(-4%) translateY(-1%)  rotate(0.5deg)  scaleX(1.03);  }
		33%  { transform: translateX(8%)  translateY(2%)   rotate(-2deg)   scaleX(0.95);  }
		66%  { transform: translateX(-7%) translateY(-2%)  rotate(1.5deg)  scaleX(1.05);  }
		100% { transform: translateX(-4%) translateY(-1%)  rotate(0.5deg)  scaleX(1.03);  }
	}

	@keyframes drift-a4 {
		0%   { transform: translateX(5%)  translateY(2%)   rotate(-0.5deg) scaleX(0.98);  }
		20%  { transform: translateX(-3%) translateY(-1%)  rotate(1deg)    scaleX(1.04);  }
		45%  { transform: translateX(7%)  translateY(0%)   rotate(-1.5deg) scaleX(0.96);  }
		70%  { transform: translateX(-6%) translateY(3%)   rotate(0.5deg)  scaleX(1.02);  }
		100% { transform: translateX(5%)  translateY(2%)   rotate(-0.5deg) scaleX(0.98);  }
	}

	@keyframes drift-a5 {
		0%   { transform: translateX(-3%) translateY(0%)   rotate(1deg)    scaleX(1);     }
		15%  { transform: translateX(5%)  translateY(-2%)  rotate(-1deg)   scaleX(1.06);  }
		40%  { transform: translateX(-8%) translateY(1%)   rotate(2deg)    scaleX(0.94);  }
		65%  { transform: translateX(6%)  translateY(-1%)  rotate(-0.5deg) scaleX(1.03);  }
		85%  { transform: translateX(-2%) translateY(2%)   rotate(1.5deg)  scaleX(0.99);  }
		100% { transform: translateX(-3%) translateY(0%)   rotate(1deg)    scaleX(1);     }
	}

	@keyframes fade-aurora {
		from { opacity: 0; }
		to   { opacity: 0.45; }
	}

	/* ---- Stars ---- */
	.stars {
		position: absolute;
		inset: 0;
		z-index: 1;
	}

	.star {
		position: absolute;
		background: #fff;
		border-radius: 50%;
		animation: twinkle var(--dur, 3s) ease-in-out infinite;
	}

	@keyframes twinkle {
		0%, 100% { opacity: 0.1; }
		50% { opacity: 0.9; }
	}

	/* ---- Logo ---- */
	.logo-track {
		position: absolute;
		top: 0;
		left: 50%;
		transform: translate(-50%, 50cqh) translateY(-50%);
		z-index: 2;
		will-change: transform;
		animation: track-rise 1.6s cubic-bezier(0.22, 1, 0.36, 1) 2s forwards;
	}

	.logo {
		margin: 0;
		font-family: 'Comfortaa', sans-serif;
		font-size: 84px;
		font-weight: 700;
		letter-spacing: 0.02em;
		white-space: nowrap;
		background: linear-gradient(
			135deg,
			#0f172a 0%,
			#1e293b 30%,
			#0c1a3d 50%,
			#1e293b 70%,
			#0f172a 100%
		);
		-webkit-background-clip: text;
		background-clip: text;
		-webkit-text-fill-color: transparent;
		opacity: 0;
		animation: logo-fade-in 1.2s ease-out 0.5s forwards;
	}

	.tagline {
		margin: 6px 0 0;
		font-family: 'Comfortaa', sans-serif;
		font-size: 15px;
		font-weight: 400;
		letter-spacing: 0.04em;
		color: rgba(15, 23, 42, 0.55);
		text-align: center;
		opacity: 0;
		animation: logo-fade-in 1s ease-out 1.2s forwards;
	}

	@keyframes logo-fade-in {
		from {
			opacity: 0;
			transform: translateY(16px) scale(0.95);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	@keyframes track-rise {
		to {
			transform: translate(-50%, 18cqh) translateY(-50%) scale(0.7);
		}
	}

	/* ---- Help panel ---- */
	.help-panel {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -40%);
		z-index: 2;
		opacity: 0;
		animation: help-appear 0.8s ease-out 3.4s forwards;
	}

	.help-card {
		display: flex;
		flex-direction: column;
		gap: 14px;
		padding: 24px 32px;
		background: rgba(2, 6, 23, 0.65);
		backdrop-filter: blur(20px);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 16px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
		will-change: transform;
	}

	.help-row {
		display: flex;
		align-items: center;
		gap: 14px;
		background: none;
		border: none;
		padding: 0;
		cursor: default;
		font-family: inherit;
	}

	button.help-row {
		cursor: pointer;
		border-radius: 8px;
		padding: 4px 6px;
		margin: -4px -6px;
		transition: background 0.15s ease;
	}

	button.help-row:hover {
		background: rgba(255, 255, 255, 0.06);
	}

	kbd {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 44px;
		padding: 5px 10px;
		font-family: -apple-system, BlinkMacSystemFont, sans-serif;
		font-size: 13px;
		font-weight: 500;
		color: rgba(226, 232, 240, 0.95);
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 7px;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
	}

	.help-row span:last-child {
		font-size: 14px;
		color: rgba(203, 213, 225, 0.9);
		letter-spacing: 0.01em;
	}

	.help-divider {
		width: 100%;
		height: 1px;
		background: rgba(255, 255, 255, 0.08);
		margin: 2px 0;
	}

	.subtle span:last-child {
		color: rgba(148, 163, 184, 0.6);
	}

	.cli {
		font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
		font-size: 12.5px !important;
		color: rgba(34, 211, 238, 0.8) !important;
		padding: 5px 10px;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 7px;
	}

	@keyframes help-appear {
		from {
			opacity: 0;
			transform: translate(-50%, -30%);
		}
		to {
			opacity: 1;
			transform: translate(-50%, -40%);
		}
	}
</style>
