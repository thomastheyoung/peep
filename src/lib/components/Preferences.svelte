<script lang="ts">
	import { getPreferences, type ContentWidth } from "$lib/preferences.svelte";

	const prefs = getPreferences();

	const widthOptions: { value: ContentWidth; label: string; description: string }[] = [
		{ value: "auto", label: "Auto", description: "Optimized for reading (~80 chars)" },
		{ value: "wide", label: "Wide", description: "More room for tables and code" },
		{ value: "full", label: "Full", description: "Use the entire window width" },
	];

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === "Escape") {
			e.preventDefault();
			prefs.closePanel();
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			prefs.closePanel();
		}
	}
</script>

{#if prefs.showPanel}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="backdrop" onclick={handleBackdropClick} onkeydown={handleKeydown}>
		<div class="panel" role="dialog" aria-label="Preferences">
			<header class="panel-header">
				<h2>Preferences</h2>
				<button class="close-btn" onclick={() => prefs.closePanel()} aria-label="Close preferences">
					&times;
				</button>
			</header>

			<div class="panel-body">
				<section class="section">
					<h3 class="section-title">Theme</h3>
					<div class="theme-grid">
						{#each prefs.theme.all as theme}
							<button
								class="theme-card"
								class:active={theme.id === prefs.theme.id}
								onclick={() => prefs.setTheme(theme.id)}
							>
								<div class="theme-preview">
									<span class="preview-swatch" style:background={theme.colors.bg}></span>
									<span class="preview-swatch" style:background={theme.colors.text}></span>
									<span class="preview-swatch" style:background={theme.colors.accent}></span>
								</div>
								<span class="theme-name">{theme.name}</span>
							</button>
						{/each}
					</div>
				</section>

				<section class="section">
					<h3 class="section-title">Content width</h3>
					<div class="width-options">
						{#each widthOptions as option}
							<button
								class="width-option"
								class:active={prefs.contentWidth === option.value}
								onclick={() => prefs.setContentWidth(option.value)}
							>
								<span class="width-label">{option.label}</span>
								<span class="width-desc">{option.description}</span>
							</button>
						{/each}
					</div>
				</section>
			</div>
		</div>
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 2000;
		background: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.panel {
		width: 480px;
		max-height: 80vh;
		border-radius: 12px;
		background: rgba(30, 30, 30, 0.95);
		border: 1px solid rgba(255, 255, 255, 0.1);
		box-shadow:
			0 24px 80px rgba(0, 0, 0, 0.5),
			0 0 0 1px rgba(255, 255, 255, 0.05) inset;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		/* Consistent styling, independent of theme */
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, sans-serif;
		font-size: 13px;
		color: #e0e0e0;
		text-shadow: none;
		font-style: normal;
		font-weight: 400;
		letter-spacing: normal;
		text-transform: none;
	}

	.panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 20px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	}

	.panel-header h2 {
		margin: 0;
		font-size: 15px;
		font-weight: 600;
		color: #f0f0f0;
	}

	.close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border: none;
		border-radius: 6px;
		background: transparent;
		color: #999;
		font-size: 18px;
		cursor: pointer;
		transition: background-color 0.1s;
	}

	.close-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		color: #e0e0e0;
		transition: none;
	}

	.panel-body {
		padding: 20px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.section-title {
		margin: 0 0 10px;
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #888;
	}

	/* Theme grid */
	.theme-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
		gap: 8px;
	}

	.theme-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		padding: 12px 8px;
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 8px;
		background: transparent;
		color: #ccc;
		cursor: pointer;
		transition:
			background-color 0.1s,
			border-color 0.15s;
		font-family: inherit;
		font-size: 12px;
		font-weight: 400;
		font-style: normal;
		text-shadow: none;
		letter-spacing: normal;
		text-transform: none;
	}

	.theme-card:hover {
		background: rgba(255, 255, 255, 0.06);
		border-color: rgba(255, 255, 255, 0.15);
		transition: none;
	}

	.theme-card.active {
		border-color: rgba(255, 255, 255, 0.3);
		background: rgba(255, 255, 255, 0.08);
	}

	.theme-preview {
		display: flex;
		gap: 4px;
	}

	.preview-swatch {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		border: 1.5px solid rgba(255, 255, 255, 0.15);
	}

	.theme-name {
		white-space: nowrap;
	}

	/* Width options */
	.width-options {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.width-option {
		display: flex;
		align-items: baseline;
		gap: 10px;
		padding: 8px 12px;
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 8px;
		background: transparent;
		color: #ccc;
		cursor: pointer;
		transition:
			background-color 0.1s,
			border-color 0.15s;
		text-align: left;
		font-family: inherit;
		font-size: 13px;
		font-weight: 400;
		font-style: normal;
		text-shadow: none;
		letter-spacing: normal;
		text-transform: none;
	}

	.width-option:hover {
		background: rgba(255, 255, 255, 0.06);
		transition: none;
	}

	.width-option.active {
		border-color: rgba(255, 255, 255, 0.25);
		background: rgba(255, 255, 255, 0.08);
	}

	.width-label {
		font-weight: 500;
		color: #e0e0e0;
		min-width: 40px;
	}

	.width-desc {
		font-size: 12px;
		color: #888;
	}
</style>
