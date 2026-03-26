<script lang="ts">
	import { onMount } from 'svelte';

	let canvas: HTMLCanvasElement;

	onMount(() => {
		const ctx = canvas.getContext('2d')!;
		const w = canvas.width = 600;
		const h = canvas.height = 400;
		const chars = '#*@!?$%&ABCDEFGabcdef0123456789'.split('');
		const cols = Math.floor(w / 14);
		const drops = Array(cols).fill(0).map(() => Math.random() * -20);

		let frame: number;

		function draw() {
			ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
			ctx.fillRect(0, 0, w, h);

			ctx.font = '13px monospace';
			ctx.fillStyle = '#22c55e';

			for (let i = 0; i < cols; i++) {
				const char = chars[Math.floor(Math.random() * chars.length)] ?? '#';
				const x = i * 14;
				const y = (drops[i] ?? 0) * 14;

				ctx.globalAlpha = Math.random() * 0.5 + 0.5;
				ctx.fillText(char, x, y);

				if (y > h && Math.random() > 0.98) drops[i] = 0;
				drops[i] = (drops[i] ?? 0) + 0.5;
			}

			ctx.globalAlpha = 1;

			// Draw "peep" in center
			ctx.font = 'bold 60px -apple-system, sans-serif';
			ctx.fillStyle = '#000';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText('peep', w / 2, h / 2);

			ctx.strokeStyle = '#22c55e';
			ctx.lineWidth = 2;
			ctx.strokeText('peep', w / 2, h / 2);

			frame = requestAnimationFrame(draw);
		}

		draw();
		return () => cancelAnimationFrame(frame);
	});
</script>

<div class="container">
	<span class="label">11 / Matrix rain</span>
	<div class="screen">
		<canvas bind:this={canvas}></canvas>
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
		align-items: center;
		justify-content: center;
		height: 400px;
		background: #000;
		border-radius: 16px;
		overflow: hidden;
	}

	canvas {
		border-radius: 16px;
	}
</style>
