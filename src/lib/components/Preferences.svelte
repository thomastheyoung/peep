<script lang="ts">
	import { invoke } from "@tauri-apps/api/core";
	import { preferences as prefs, settingsSections } from "$lib/preferences.svelte";
	import { importThemeCss } from "$lib/ipc";
	import { parseThemeCss, slugifyThemeId } from "$lib/themes/parse-theme-css";
	import { toast } from "$lib/toast.svelte";

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

	// ---------------------------------------------------------------------------
	// Theme import (file picker + clipboard paste)
	//
	// Reading a LOCAL file's content from the frontend needs either a Rust
	// command or `@tauri-apps/plugin-fs` — this app has neither wired up
	// (`read_file` explicitly rejects non-markdown, and no fs capability is
	// granted in src-tauri/capabilities/default.json). A native
	// `<input type="file">` sidesteps that entirely: Tauri's webview is a real
	// browser engine, so the standard File API (`file.text()`) works with zero
	// IPC and zero added capabilities — this is the standard workaround for
	// exactly this gap in Tauri apps that don't want a full fs allowlist.
	let fileInputEl: HTMLInputElement | undefined = $state();
	let importing = $state(false);

	/**
	 * Derive an id to import under. Prefers the theme's own frontmatter
	 * `@name` (what the author called it) over the filename, since a user
	 * theme's id is what gets persisted in preferences — a name survives a
	 * "Save As" under a different filename, a filename stem does not.
	 * `import_theme` on the Rust side re-validates and disambiguates
	 * collisions independently; this is just a reasonable starting point.
	 */
	function deriveImportId(css: string, fallback: string): string {
		const parsed = parseThemeCss(css);
		return slugifyThemeId(parsed.ok ? parsed.frontmatter.name : fallback);
	}

	async function importCss(css: string, fallbackId: string) {
		importing = true;
		try {
			const id = deriveImportId(css, fallbackId);
			await importThemeCss(id, css);
			// Refresh the live registry so the new theme appears immediately —
			// redetectThemes() re-runs discover() and reconciles the active
			// theme; reconciliation is a no-op here since nothing active just
			// vanished, it's simply the existing re-scan entry point.
			await prefs.redetectThemes();
			toast.info("Theme imported.");
		} catch (err) {
			console.error("Failed to import theme:", err);
			toast.error(err instanceof Error ? err.message : "Failed to import theme.");
		} finally {
			importing = false;
		}
	}

	function openFilePicker() {
		fileInputEl?.click();
	}

	async function handleFileInputChange(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		// Reset immediately so selecting the SAME file again still fires
		// `change` — the browser dedupes on value, not on user intent.
		input.value = "";
		if (!file) return;

		try {
			const css = await file.text();
			const fallback = file.name.replace(/\.css$/i, "");
			await importCss(css, fallback);
		} catch (err) {
			console.error("Failed to read theme file:", err);
			toast.error("Couldn't read that file.");
		}
	}

	async function pasteFromClipboard() {
		try {
			const css = await navigator.clipboard.readText();
			if (!css.trim()) {
				toast.error("Clipboard is empty.");
				return;
			}
			await importCss(css, "pasted-theme");
		} catch (err) {
			console.error("Failed to read clipboard:", err);
			toast.error("Couldn't read the clipboard.");
		}
	}

	$effect(() => {
		if (prefs.showPanel) {
			dialogEl?.showModal();
			checkDefaultViewer().catch(console.error);
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

									{#if setting.id === "theme"}
										<div class="theme-import-row">
											<input
												bind:this={fileInputEl}
												type="file"
												accept=".css"
												class="visually-hidden"
												onchange={handleFileInputChange}
											/>
											<button class="action-btn" disabled={importing} onclick={openFilePicker}>
												Import theme file…
											</button>
											<button class="action-btn" disabled={importing} onclick={pasteFromClipboard}>
												Paste theme CSS
											</button>
										</div>
									{/if}
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
		border-radius: var(--chrome-radius);
		background: var(--chrome-surface);
		border: var(--chrome-border-width) solid var(--chrome-border);
		box-shadow: 6px 6px 0 var(--chrome-border);
		overflow: hidden;
		display: flex;
		flex-direction: column;
		font-family: var(--chrome-font);
		font-size: var(--chrome-font-size-md);
		color: var(--chrome-text-active);
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
		border-bottom: var(--chrome-border-width) solid var(--chrome-border);
		background: var(--chrome-bg);
	}

	.panel-header h2 {
		margin: 0;
		font-family: var(--chrome-font-mono);
		font-size: var(--chrome-font-size-sm);
		font-weight: 600;
		color: var(--chrome-text);
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}

	.close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		border: 1.5px solid var(--chrome-border);
		border-radius: var(--chrome-radius);
		background: transparent;
		color: var(--chrome-text);
		font-size: var(--chrome-font-size-md);
		line-height: 1;
		cursor: pointer;
		transition: transform 100ms ease, box-shadow 100ms ease;
	}

	.close-btn:hover {
		color: var(--chrome-text-active);
		transform: translate(-1px, -1px);
		box-shadow: 2px 2px 0 var(--chrome-border);
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
		border-right: var(--chrome-border-width) solid var(--chrome-border);
		background: var(--chrome-bg);
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.sidebar-item {
		display: block;
		width: 100%;
		padding: 6px 10px;
		border: none;
		border-radius: var(--chrome-radius);
		background: transparent;
		color: var(--chrome-text);
		font-family: var(--chrome-font);
		font-size: var(--chrome-font-size-md);
		font-weight: 400;
		text-align: left;
		cursor: pointer;
		border-left: var(--chrome-border-width) solid transparent;
		transition: background-color 100ms ease;
	}

	.sidebar-item:hover {
		background: var(--chrome-bg-hover);
		color: var(--chrome-text-active);
		transition: none;
	}

	.sidebar-item.active {
		border-left-color: var(--chrome-accent);
		background: var(--chrome-surface);
		color: var(--chrome-accent);
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
		background: var(--chrome-surface);
	}

	.section-title {
		margin: 0 0 10px;
		font-family: var(--chrome-font-mono);
		font-size: var(--chrome-font-size-xs);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--chrome-text);
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
		border: var(--chrome-border-width) solid var(--chrome-border);
		border-radius: var(--chrome-radius);
		background: var(--chrome-bg);
		color: var(--chrome-text);
		cursor: pointer;
		font-family: var(--chrome-font);
		font-size: var(--chrome-font-size-xs);
		font-weight: 400;
		font-style: normal;
		text-shadow: none;
		letter-spacing: 0.02em;
		text-transform: none;
		transition: transform 100ms ease, box-shadow 100ms ease;
	}

	.theme-card:hover {
		transform: translate(-1px, -1px);
		box-shadow: 3px 3px 0 var(--chrome-border);
		color: var(--chrome-text-active);
	}

	.theme-card:active {
		transform: translate(1px, 1px);
		box-shadow: none;
	}

	.theme-card.active {
		border-color: var(--chrome-accent);
		color: var(--chrome-accent);
		font-weight: 700;
		box-shadow: 3px 3px 0 var(--chrome-accent);
	}

	.theme-preview {
		display: flex;
		gap: 4px;
	}

	.preview-swatch {
		width: 14px;
		height: 14px;
		border-radius: var(--chrome-radius);
		border: 1.5px solid var(--chrome-border);
	}

	.theme-card.active .preview-swatch {
		border-color: var(--chrome-accent);
	}

	.theme-import-row {
		display: flex;
		gap: 8px;
		margin-top: 10px;
	}

	/* Visually hidden but still focusable/clickable via the real <button>s,
	   which is what fileInputEl.click() drives — a plain `display: none`
	   input still works programmatically, but this keeps it in the
	   accessibility tree the same way a deliberately-hidden-but-present
	   control normally would. */
	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.theme-name {
		/* `.theme-card` is a 110px grid cell (minmax(110px, 1fr) above); a long
		   user theme name — unlike the 7 short builtin names this was written
		   against — overflows it. `max-width: 100%` is required alongside
		   `overflow`/`text-overflow`: this is a flex child in a column flex
		   container, which sizes to content by default and simply ignores
		   `text-overflow` with nothing capping its width first. */
		display: block;
		max-width: 100%;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
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
		border: var(--chrome-border-width) solid var(--chrome-border);
		border-radius: var(--chrome-radius);
		background: var(--chrome-bg);
		color: var(--chrome-text);
		cursor: pointer;
		text-align: left;
		font-family: inherit;
		font-size: var(--chrome-font-size-md);
		font-weight: 400;
		font-style: normal;
		text-shadow: none;
		letter-spacing: normal;
		text-transform: none;
		transition: transform 100ms ease, box-shadow 100ms ease;
	}

	.choice-option:hover {
		transform: translate(-1px, -1px);
		box-shadow: 3px 3px 0 var(--chrome-border);
		color: var(--chrome-text-active);
	}

	.choice-option:active {
		transform: translate(1px, 1px);
		box-shadow: none;
	}

	.choice-option.active {
		border-color: var(--chrome-accent);
		color: var(--chrome-accent);
		box-shadow: 3px 3px 0 var(--chrome-accent);
	}

	.choice-label {
		font-weight: 600;
		color: inherit;
		min-width: 40px;
	}

	.choice-desc {
		font-size: var(--chrome-font-size-sm);
		color: var(--chrome-text);
	}

	.choice-option.active .choice-desc {
		color: var(--chrome-accent);
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
		font-family: var(--chrome-font-mono);
		font-size: var(--chrome-font-size-sm);
		color: var(--chrome-text);
		font-variant-numeric: tabular-nums;
	}

	.slider {
		-webkit-appearance: none;
		appearance: none;
		width: 100%;
		height: 2px;
		border-radius: var(--chrome-radius);
		background: var(--chrome-border);
		outline: none;
	}

	.slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 14px;
		height: 14px;
		border-radius: var(--chrome-radius);
		background: var(--chrome-text-active);
		cursor: pointer;
		border: var(--chrome-border-width) solid var(--chrome-border);
		box-shadow: 2px 2px 0 var(--chrome-border);
	}

	.slider::-webkit-slider-thumb:hover {
		background: var(--chrome-accent);
		border-color: var(--chrome-accent);
	}

	.slider:focus-visible {
		outline: 2px solid var(--chrome-accent);
		outline-offset: 4px;
	}

	/* ---- System / default viewer ---- */
	.default-viewer-row {
		display: flex;
		align-items: center;
	}

	.status-text {
		font-family: var(--chrome-font-mono);
		font-size: var(--chrome-font-size-sm);
		color: var(--chrome-text);
	}

	.action-btn {
		padding: 6px 12px;
		border: var(--chrome-border-width) solid var(--chrome-border);
		border-radius: var(--chrome-radius);
		background: var(--chrome-bg);
		color: var(--chrome-text);
		font-family: var(--chrome-font-mono);
		font-size: var(--chrome-font-size-sm);
		cursor: pointer;
		transition: transform 100ms ease, box-shadow 100ms ease;
	}

	.action-btn:hover {
		transform: translate(-1px, -1px);
		box-shadow: 2px 2px 0 var(--chrome-border);
		color: var(--chrome-text-active);
	}

	.action-btn:active {
		transform: translate(1px, 1px);
		box-shadow: none;
	}

	.reset-btn {
		padding: 6px 12px;
		border: var(--chrome-border-width) solid var(--chrome-border);
		border-radius: var(--chrome-radius);
		background: var(--chrome-bg);
		color: var(--chrome-text);
		font-family: var(--chrome-font-mono);
		font-size: var(--chrome-font-size-sm);
		cursor: pointer;
		align-self: flex-start;
		transition: transform 100ms ease, box-shadow 100ms ease;
	}

	.reset-btn:hover {
		transform: translate(-1px, -1px);
		box-shadow: 2px 2px 0 var(--chrome-border);
		color: var(--chrome-text-active);
	}

	.reset-btn:active {
		transform: translate(1px, 1px);
		box-shadow: none;
	}
</style>
