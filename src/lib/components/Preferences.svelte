<script lang="ts">
	import { invoke } from "@tauri-apps/api/core";
	import { preferences as prefs, settingsSections } from "$lib/preferences.svelte";

	const sectionSettings = $derived(
		Object.groupBy(prefs.settings, (s) => s.section),
	);

	const currentSettings = $derived(sectionSettings[prefs.activeSection] ?? []);

	const hasNonDefaultRange = $derived(
		currentSettings.some((s) => s.type === "range" && s.value !== s.defaultValue),
	);

	let dialogEl: HTMLDialogElement | undefined = $state();
	let isDefaultViewer = $state<boolean | null>(null);

	async function checkDefaultViewer() {
		isDefaultViewer = await invoke<boolean>("is_default_markdown_viewer");
	}

	async function setAsDefault() {
		await invoke("set_default_markdown_viewer");
		isDefaultViewer = true;
	}

	$effect(() => {
		if (prefs.showPanel) {
			dialogEl?.showModal();
			checkDefaultViewer();
		} else {
			dialogEl?.close();
		}
	});

	function resetSection() {
		for (const s of currentSettings) {
			if (s.type === "range" && s.value !== s.defaultValue) {
				s.set(s.defaultValue);
			}
		}
	}

	function handleCancel(e: Event) {
		e.preventDefault();
		prefs.closePanel();
	}

	function handleDialogClick(e: MouseEvent) {
		if (e.target === dialogEl) {
			prefs.closePanel();
		}
	}
</script>

<dialog
	bind:this={dialogEl}
	class="panel"
	aria-label="Preferences"
	oncancel={handleCancel}
	onclick={handleDialogClick}
>
			<header class="panel-header">
				<h2>Preferences</h2>
				<button class="close-btn" onclick={() => prefs.closePanel()} aria-label="Close preferences">
					&times;
				</button>
			</header>

			<div class="panel-layout">
				<nav class="sidebar">
					{#each settingsSections as section (section.id)}
						<button
							class="sidebar-item"
							class:active={prefs.activeSection === section.id}
							onclick={() => prefs.setActiveSection(section.id)}
						>
							{section.label}
						</button>
					{/each}
				</nav>

				<div class="panel-content">
					{#each currentSettings as setting (setting.id)}
						<section class="section">
							<h3 class="section-title">{setting.label}</h3>

							{#if setting.type === "choice"}
								{@const hasSwatches = setting.options.some((o) => o.swatches)}
								{#if hasSwatches}
									<div class="theme-grid">
										{#each setting.options as option (option.value)}
											<button
												class="theme-card"
												class:active={setting.value === option.value}
												onclick={() => setting.select(option.value)}
											>
												{#if option.swatches}
													<div class="theme-preview">
														<span class="preview-swatch" style:background={option.swatches.bg}></span>
														<span class="preview-swatch" style:background={option.swatches.text}></span>
														<span class="preview-swatch" style:background={option.swatches.accent}></span>
													</div>
												{/if}
												<span class="theme-name">{option.label}</span>
											</button>
										{/each}
									</div>
								{:else}
									<div class="choice-options">
										{#each setting.options as option (option.value)}
											<button
												class="choice-option"
												class:active={setting.value === option.value}
												onclick={() => setting.select(option.value)}
											>
												<span class="choice-label">{option.label}</span>
												{#if option.description}
													<span class="choice-desc">{option.description}</span>
												{/if}
											</button>
										{/each}
									</div>
								{/if}

							{:else if setting.type === "range"}
								<div class="setting-group">
									<div class="setting-row">
										<span class="setting-value">{setting.format(setting.value)}</span>
									</div>
									<input
										type="range"
										class="slider"
										min={setting.min}
										max={setting.max}
										step={setting.step}
										value={setting.value}
										oninput={(e) => setting.set(Number(e.currentTarget.value))}
									/>
								</div>
							{/if}
						</section>
					{/each}

					{#if prefs.activeSection === "appearance" && isDefaultViewer !== null}
						<section class="section">
							<h3 class="section-title">System</h3>
							<div class="default-viewer-row">
								{#if isDefaultViewer}
									<span class="status-text">peep is the default markdown viewer</span>
								{:else}
									<button class="action-btn" onclick={setAsDefault}>
										Set as default markdown viewer
									</button>
								{/if}
							</div>
						</section>
					{/if}

					{#if hasNonDefaultRange}
						<button class="reset-btn" onclick={resetSection}>
							Reset to defaults
						</button>
					{/if}
				</div>
			</div>
	</dialog>

<style>
	dialog.panel:not([open]) {
		display: none;
	}

	dialog.panel {
		padding: 0;
		width: 640px;
		height: 80vh;
		border-radius: 0;
		background: var(--chrome-surface, #21262d);
		border: 2px solid var(--chrome-border, #30363d);
		box-shadow: 6px 6px 0 var(--chrome-border, #30363d);
		overflow: hidden;
		display: flex;
		flex-direction: column;
		font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, sans-serif;
		font-size: 13px;
		color: var(--chrome-text-active, #c9d1d9);
		text-shadow: none;
		font-style: normal;
		font-weight: 400;
		letter-spacing: normal;
		text-transform: none;
	}

	dialog.panel::backdrop {
		background: rgba(0, 0, 0, 0.5);
	}

	/* ---- Header ---- */
	.panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px 12px;
		border-bottom: 2px solid var(--chrome-border, #30363d);
		background: var(--chrome-bg, #161b22);
	}

	.panel-header h2 {
		margin: 0;
		font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
		font-size: 11px;
		font-weight: 600;
		color: var(--chrome-text, #8b949e);
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}

	.close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		border: 1.5px solid var(--chrome-border, #30363d);
		border-radius: 0;
		background: transparent;
		color: var(--chrome-text, #8b949e);
		font-size: 14px;
		line-height: 1;
		cursor: pointer;
		transition: transform 100ms ease, box-shadow 100ms ease;
	}

	.close-btn:hover {
		color: var(--chrome-text-active, #c9d1d9);
		transform: translate(-1px, -1px);
		box-shadow: 2px 2px 0 var(--chrome-border, #30363d);
	}

	.close-btn:active {
		transform: translate(1px, 1px);
		box-shadow: none;
	}

	/* ---- Two-column layout ---- */
	.panel-layout {
		display: flex;
		flex: 1;
		min-height: 0;
	}

	.sidebar {
		width: 148px;
		flex-shrink: 0;
		padding: 8px;
		border-right: 2px solid var(--chrome-border, #30363d);
		background: var(--chrome-bg, #161b22);
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.sidebar-item {
		display: block;
		width: 100%;
		padding: 6px 10px;
		border: none;
		border-radius: 0;
		background: transparent;
		color: var(--chrome-text, #8b949e);
		font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
		font-size: 11px;
		font-weight: 400;
		text-align: left;
		cursor: pointer;
		letter-spacing: 0.02em;
		border-left: 2px solid transparent;
		transition: background-color 100ms ease;
	}

	.sidebar-item:hover {
		background: var(--chrome-bg-hover, #282e36);
		color: var(--chrome-text-active, #c9d1d9);
		transition: none;
	}

	.sidebar-item.active {
		border-left-color: var(--chrome-accent, #58a6ff);
		background: var(--chrome-surface, #21262d);
		color: var(--chrome-accent, #58a6ff);
		font-weight: 600;
	}

	/* ---- Content ---- */
	.panel-content {
		flex: 1;
		min-width: 0;
		padding: 16px 20px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 24px;
		background: var(--chrome-surface, #21262d);
	}

	.section-title {
		margin: 0 0 10px;
		font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
		font-size: 10px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--chrome-text, #8b949e);
	}

	/* ---- Theme grid (choice with swatches) ---- */
	.theme-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
		gap: 6px;
	}

	.theme-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		padding: 10px 8px;
		border: 2px solid var(--chrome-border, #30363d);
		border-radius: 0;
		background: var(--chrome-bg, #161b22);
		color: var(--chrome-text, #8b949e);
		cursor: pointer;
		font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
		font-size: 10px;
		font-weight: 400;
		font-style: normal;
		text-shadow: none;
		letter-spacing: 0.02em;
		text-transform: none;
		transition: transform 100ms ease, box-shadow 100ms ease;
	}

	.theme-card:hover {
		transform: translate(-1px, -1px);
		box-shadow: 3px 3px 0 var(--chrome-border, #30363d);
		color: var(--chrome-text-active, #c9d1d9);
	}

	.theme-card:active {
		transform: translate(1px, 1px);
		box-shadow: none;
	}

	.theme-card.active {
		border-color: var(--chrome-accent, #58a6ff);
		color: var(--chrome-accent, #58a6ff);
		font-weight: 700;
		box-shadow: 3px 3px 0 var(--chrome-accent, #58a6ff);
	}

	.theme-preview {
		display: flex;
		gap: 4px;
	}

	.preview-swatch {
		width: 14px;
		height: 14px;
		border-radius: 0;
		border: 1.5px solid var(--chrome-border, #30363d);
	}

	.theme-card.active .preview-swatch {
		border-color: var(--chrome-accent, #58a6ff);
	}

	.theme-name {
		white-space: nowrap;
	}

	/* ---- Choice options (no swatches) ---- */
	.choice-options {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.choice-option {
		display: flex;
		align-items: baseline;
		gap: 10px;
		padding: 8px 12px;
		border: 2px solid var(--chrome-border, #30363d);
		border-radius: 0;
		background: var(--chrome-bg, #161b22);
		color: var(--chrome-text, #8b949e);
		cursor: pointer;
		text-align: left;
		font-family: inherit;
		font-size: 13px;
		font-weight: 400;
		font-style: normal;
		text-shadow: none;
		letter-spacing: normal;
		text-transform: none;
		transition: transform 100ms ease, box-shadow 100ms ease;
	}

	.choice-option:hover {
		transform: translate(-1px, -1px);
		box-shadow: 3px 3px 0 var(--chrome-border, #30363d);
		color: var(--chrome-text-active, #c9d1d9);
	}

	.choice-option:active {
		transform: translate(1px, 1px);
		box-shadow: none;
	}

	.choice-option.active {
		border-color: var(--chrome-accent, #58a6ff);
		color: var(--chrome-accent, #58a6ff);
		box-shadow: 3px 3px 0 var(--chrome-accent, #58a6ff);
	}

	.choice-label {
		font-weight: 600;
		color: inherit;
		min-width: 40px;
	}

	.choice-desc {
		font-size: 12px;
		color: var(--chrome-text, #8b949e);
	}

	.choice-option.active .choice-desc {
		color: var(--chrome-accent, #58a6ff);
		opacity: 0.6;
	}

	/* ---- Range settings ---- */
	.setting-group {
		margin-bottom: 4px;
	}

	.setting-row {
		display: flex;
		justify-content: flex-end;
		margin-bottom: 8px;
	}

	.setting-value {
		font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
		font-size: 11px;
		color: var(--chrome-text, #8b949e);
		font-variant-numeric: tabular-nums;
	}

	.slider {
		-webkit-appearance: none;
		appearance: none;
		width: 100%;
		height: 2px;
		border-radius: 0;
		background: var(--chrome-border, #30363d);
		outline: none;
	}

	.slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 14px;
		height: 14px;
		border-radius: 0;
		background: var(--chrome-text-active, #c9d1d9);
		cursor: pointer;
		border: 2px solid var(--chrome-border, #30363d);
		box-shadow: 2px 2px 0 var(--chrome-border, #30363d);
	}

	.slider::-webkit-slider-thumb:hover {
		background: var(--chrome-accent, #58a6ff);
		border-color: var(--chrome-accent, #58a6ff);
	}

	.slider:focus-visible {
		outline: 2px solid var(--chrome-accent, #58a6ff);
		outline-offset: 4px;
	}

	/* ---- System / default viewer ---- */
	.default-viewer-row {
		display: flex;
		align-items: center;
	}

	.status-text {
		font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
		font-size: 11px;
		color: var(--chrome-text, #8b949e);
	}

	.action-btn {
		padding: 6px 12px;
		border: 2px solid var(--chrome-border, #30363d);
		border-radius: 0;
		background: var(--chrome-bg, #161b22);
		color: var(--chrome-text, #8b949e);
		font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
		font-size: 11px;
		cursor: pointer;
		transition: transform 100ms ease, box-shadow 100ms ease;
	}

	.action-btn:hover {
		transform: translate(-1px, -1px);
		box-shadow: 2px 2px 0 var(--chrome-border, #30363d);
		color: var(--chrome-text-active, #c9d1d9);
	}

	.action-btn:active {
		transform: translate(1px, 1px);
		box-shadow: none;
	}

	.reset-btn {
		padding: 6px 12px;
		border: 2px solid var(--chrome-border, #30363d);
		border-radius: 0;
		background: var(--chrome-bg, #161b22);
		color: var(--chrome-text, #8b949e);
		font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
		font-size: 11px;
		cursor: pointer;
		align-self: flex-start;
		transition: transform 100ms ease, box-shadow 100ms ease;
	}

	.reset-btn:hover {
		transform: translate(-1px, -1px);
		box-shadow: 2px 2px 0 var(--chrome-border, #30363d);
		color: var(--chrome-text-active, #c9d1d9);
	}

	.reset-btn:active {
		transform: translate(1px, 1px);
		box-shadow: none;
	}
</style>
