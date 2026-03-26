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
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, sans-serif;
		font-size: 13px;
		color: #e0e0e0;
		text-shadow: none;
		font-style: normal;
		font-weight: 400;
		letter-spacing: normal;
		text-transform: none;
	}

	dialog.panel::backdrop {
		background: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
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

	/* Two-column layout */
	.panel-layout {
		display: flex;
		flex: 1;
		min-height: 0;
	}

	.sidebar {
		width: 160px;
		flex-shrink: 0;
		padding: 12px;
		border-right: 1px solid rgba(255, 255, 255, 0.08);
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.sidebar-item {
		display: block;
		width: 100%;
		padding: 7px 12px;
		border: none;
		border-radius: 6px;
		background: transparent;
		color: #aaa;
		font-family: inherit;
		font-size: 13px;
		font-weight: 400;
		text-align: left;
		cursor: pointer;
		transition: background-color 0.1s;
	}

	.sidebar-item:hover {
		background: rgba(255, 255, 255, 0.06);
		color: #e0e0e0;
		transition: none;
	}

	.sidebar-item.active {
		background: rgba(255, 255, 255, 0.1);
		color: #f0f0f0;
		font-weight: 500;
	}

	.panel-content {
		flex: 1;
		min-width: 0;
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

	/* Theme grid (choice with swatches) */
	.theme-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
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

	/* Choice options (no swatches) */
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

	.choice-option:hover {
		background: rgba(255, 255, 255, 0.06);
		transition: none;
	}

	.choice-option.active {
		border-color: rgba(255, 255, 255, 0.25);
		background: rgba(255, 255, 255, 0.08);
	}

	.choice-label {
		font-weight: 500;
		color: #e0e0e0;
		min-width: 40px;
	}

	.choice-desc {
		font-size: 12px;
		color: #888;
	}

	/* Range settings */
	.setting-group {
		margin-bottom: 4px;
	}

	.setting-row {
		display: flex;
		justify-content: flex-end;
		margin-bottom: 8px;
	}

	.setting-value {
		font-size: 12px;
		color: #888;
		font-variant-numeric: tabular-nums;
	}

	.slider {
		-webkit-appearance: none;
		appearance: none;
		width: 100%;
		height: 4px;
		border-radius: 2px;
		background: rgba(255, 255, 255, 0.12);
		outline: none;
	}

	.slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: #e0e0e0;
		cursor: pointer;
		border: none;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
	}

	.slider:focus-visible {
		outline: 2px solid var(--chrome-accent, #58a6ff);
		outline-offset: 2px;
	}

	.slider::-webkit-slider-thumb:hover {
		background: #fff;
	}

	.default-viewer-row {
		display: flex;
		align-items: center;
	}

	.status-text {
		font-size: 12px;
		color: #888;
	}

	.action-btn {
		padding: 6px 14px;
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 6px;
		background: transparent;
		color: #ccc;
		font-family: inherit;
		font-size: 12px;
		cursor: pointer;
		transition: background-color 0.1s;
	}

	.action-btn:hover {
		background: rgba(255, 255, 255, 0.06);
		color: #e0e0e0;
		transition: none;
	}

	.reset-btn {
		padding: 6px 14px;
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 6px;
		background: transparent;
		color: #aaa;
		font-family: inherit;
		font-size: 12px;
		cursor: pointer;
		transition: background-color 0.1s;
		align-self: flex-start;
	}

	.reset-btn:hover {
		background: rgba(255, 255, 255, 0.06);
		color: #e0e0e0;
		transition: none;
	}
</style>
