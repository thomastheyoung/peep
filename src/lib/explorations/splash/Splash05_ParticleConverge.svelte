<script lang="ts">
	import { onMount } from 'svelte';

	let canvas: HTMLCanvasElement;

	onMount(() => {
		const ctx = canvas.getContext('2d')!;
		const w = canvas.width = 600;
		const h = canvas.height = 400;

		const text = 'peep';
		ctx.font = 'bold 72px -apple-system, sans-serif';
		ctx.fillStyle = '#fff';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(text, w / 2, h / 2);

		const imageData = ctx.getImageData(0, 0, w, h);
		const targets: { x: number; y: number }[] = [];

		for (let y = 0; y < h; y += 4) {
			for (let x = 0; x < w; x += 4) {
				if ((imageData.data[(y * w + x) * 4 + 3] ?? 0) > 128) {
					targets.push({ x, y });
				}
			}
		}

		const particles = targets.map(t => ({
			x: Math.random() * w,
			y: Math.random() * h,
			tx: t.x,
			ty: t.y,
			vx: 0,
			vy: 0,
			arrived: false,
		}));

		let frame: number;

		function draw() {
			ctx.fillStyle = 'rgba(15, 23, 42, 1)';
			ctx.fillRect(0, 0, w, h);

			let allArrived = true;

			for (const p of particles) {
				const dx = p.tx - p.x;
				const dy = p.ty - p.y;
				p.vx += dx * 0.06;
				p.vy += dy * 0.06;
				p.vx *= 0.85;
				p.vy *= 0.85;
				p.x += p.vx;
				p.y += p.vy;

				if (Math.abs(dx) > 1 || Math.abs(dy) > 1) allArrived = false;

				const dist = Math.sqrt(dx * dx + dy * dy);
				const alpha = Math.max(0.3, 1 - dist / 200);
				ctx.fillStyle = `rgba(99, 102, 241, ${alpha})`;
				ctx.fillRect(p.x, p.y, 2.5, 2.5);
			}

			if (!allArrived) {
				frame = requestAnimationFrame(draw);
			}
		}

		draw();
		return () => cancelAnimationFrame(frame);
	});
</script>

<div class="container">
	<span class="label">05 / Particle converge</span>
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
		background: #0f172a;
		border-radius: 16px;
		overflow: hidden;
	}

	canvas {
		border-radius: 16px;
	}
</style>
