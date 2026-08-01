<script lang="ts">
	/**
	 * Grid of every theme in the registry. Because it maps over `themes` rather
	 * than listing components, adding a theme to registry.ts makes it appear
	 * here automatically — the gallery cannot drift from what the app ships.
	 */
	import { themes } from "$lib/themes/registry";
	import ThemePreview from "$lib/components/ThemePreview.svelte";

	let {
		markdown,
		columns = 2,
		height = 560,
	}: { markdown?: string; columns?: number; height?: number } = $props();
</script>

<div class="gallery" style="--columns: {columns}; --frame-height: {height}px">
	{#each themes as theme (theme.id)}
		<figure class="card">
			<figcaption class="caption">
				<span class="swatches" aria-hidden="true">
					<span class="swatch" style="background: {theme.colors.bg}"></span>
					<span class="swatch" style="background: {theme.colors.text}"></span>
					<span class="swatch" style="background: {theme.colors.accent}"></span>
				</span>
				<span class="name">{theme.name}</span>
				<code class="id">{theme.id}</code>
			</figcaption>
			<div class="frame">
				<ThemePreview themeId={theme.id} {markdown} />
			</div>
		</figure>
	{/each}
</div>

<style>
	.gallery {
		display: grid;
		grid-template-columns: repeat(var(--columns), minmax(0, 1fr));
		gap: 24px;
		padding: 24px;
		background: #f6f7f9;
		font-family:
			ui-sans-serif,
			system-ui,
			-apple-system,
			sans-serif;
	}

	@media (prefers-color-scheme: dark) {
		.gallery {
			background: #16181d;
		}
	}

	.card {
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
		min-width: 0;
	}

	.caption {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 12px;
		color: #6b7280;
	}

	.name {
		font-weight: 600;
		color: #111827;
	}

	@media (prefers-color-scheme: dark) {
		.name {
			color: #e5e7eb;
		}
	}

	.id {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 11px;
		opacity: 0.7;
	}

	.swatches {
		display: inline-flex;
		border-radius: 999px;
		overflow: hidden;
		outline: 1px solid rgb(0 0 0 / 0.15);
	}

	.swatch {
		width: 12px;
		height: 12px;
	}

	.frame {
		/* Each preview scrolls internally, so the frame height only decides how
		   much is visible before scrolling — not how much is rendered. */
		height: var(--frame-height);
		border-radius: 10px;
		overflow: hidden;
		border: 1px solid rgb(0 0 0 / 0.12);
		box-shadow: 0 1px 3px rgb(0 0 0 / 0.08);
	}
</style>
