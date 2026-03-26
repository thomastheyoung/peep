<script lang="ts">
	import { commandPalette as palette } from "$lib/command-palette.svelte";
	import type { Command } from "$lib/commands";
	import { tabs as tabState } from "$lib/tabs.svelte";
	import ThemePreview from "./ThemePreview.svelte";

	const MAX_PREVIEW_LINES = 100;

	const previewMarkdown = $derived.by(() => {
		const content = tabState.active?.content;
		if (!content) return undefined;
		const lines = content.split("\n");
		if (lines.length <= MAX_PREVIEW_LINES) return content;
		return lines.slice(0, MAX_PREVIEW_LINES).join("\n");
	});

	let dialogEl: HTMLDialogElement | undefined = $state();
	let inputEl: HTMLInputElement | undefined = $state();
	let listEl: HTMLDivElement | undefined = $state();

	const filtered = $derived(palette.filtered);

	const isThemePanel = $derived(filtered.length > 0 && filtered[0]?.swatches != null);

	// Extract theme ID from selected command (format: "theme:<id>")
	const previewThemeId = $derived.by(() => {
		if (!isThemePanel) return undefined;
		const cmd = filtered[palette.selectedIndex];
		if (!cmd) return undefined;
		const parts = cmd.id.split(":");
		return parts.length === 2 ? parts[1] : undefined;
	});

	$effect(() => {
		if (palette.open) {
			dialogEl?.showModal();
			// Focus input when palette opens or drills in/out
			palette.depth; // track depth changes
			requestAnimationFrame(() => inputEl?.focus());
		} else {
			dialogEl?.close();
		}
	});

	$effect(() => {
		// Scroll selected item into view
		const idx = palette.selectedIndex;
		if (!listEl) return;
		const items = listEl.querySelectorAll("[data-command-item]");
		const el = items[idx] as HTMLElement | undefined;
		el?.scrollIntoView({ block: "nearest" });
	});

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === "ArrowDown") {
			e.preventDefault();
			palette.setSelectedIndex(
				Math.min(palette.selectedIndex + 1, filtered.length - 1),
			);
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			palette.setSelectedIndex(Math.max(palette.selectedIndex - 1, 0));
		} else if (e.key === "Enter") {
			e.preventDefault();
			const cmd = filtered[palette.selectedIndex];
			if (cmd) executeCommand(cmd);
		} else if (
			e.key === "Backspace" &&
			palette.query === "" &&
			palette.depth > 1
		) {
			e.preventDefault();
			palette.back();
		}
	}

	function handleCancel(e: Event) {
		e.preventDefault();
		palette.back();
	}

	async function executeCommand(cmd: Command) {
		if (cmd.children) {
			palette.drillIn(cmd.children(), cmd.label);
		} else if (cmd.action) {
			palette.close();
			await cmd.action();
		}
	}

	function handleDialogClick(e: MouseEvent) {
		if (e.target === dialogEl) {
			palette.close();
		}
	}

	function handleItemClick(cmd: Command) {
		executeCommand(cmd);
	}

	function handleItemHover(index: number) {
		palette.setSelectedIndex(index);
	}
</script>

<dialog
	bind:this={dialogEl}
	class="palette"
	class:palette-wide={isThemePanel}
	aria-label="Command palette"
	oncancel={handleCancel}
	onclick={handleDialogClick}
>
			{#if palette.depth > 1 && palette.currentLevel}
				<div class="breadcrumb">
					<button class="breadcrumb-back" onclick={() => palette.back()}>
						Commands
					</button>
					<span class="breadcrumb-sep">›</span>
					<span class="breadcrumb-current">{palette.currentLevel.title}</span>
				</div>
			{/if}

			<div class="input-row">
				<svg class="search-icon" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
					<path d="M11.5 7a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Zm-.82 4.74a6 6 0 1 1 1.06-1.06l3.04 3.04a.75.75 0 1 1-1.06 1.06l-3.04-3.04Z" />
				</svg>
				<input
					bind:this={inputEl}
					type="text"
					class="input"
					placeholder={palette.depth > 1 ? `Filter ${palette.currentLevel?.title?.toLowerCase()}...` : "Type a command..."}
					value={palette.query}
					oninput={(e) => palette.setQuery(e.currentTarget.value)}
					onkeydown={handleKeydown}
				/>
			</div>

			<div class="palette-body">
				<div class="list" role="listbox" bind:this={listEl}>
					{#each filtered as cmd, i (cmd.id)}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<div
							class="item"
							class:selected={i === palette.selectedIndex}
							data-command-item
							role="option"
							tabindex="-1"
							aria-selected={i === palette.selectedIndex}
							onclick={() => handleItemClick(cmd)}
							onmouseenter={() => handleItemHover(i)}
						>
							{#if cmd.swatches}
								<span class="swatches">
									<span class="swatch" style:background={cmd.swatches.bg}></span>
									<span class="swatch" style:background={cmd.swatches.text}></span>
									<span class="swatch" style:background={cmd.swatches.accent}></span>
								</span>
							{/if}
							<span class="item-label">{cmd.label}</span>
							<span class="item-spacer"></span>
							{#if cmd.detail}
								<span class="item-detail">{cmd.detail}</span>
							{/if}
							{#if cmd.shortcut}
								<kbd class="item-shortcut">{cmd.shortcut}</kbd>
							{/if}
							{#if cmd.children}
								<span class="item-arrow">›</span>
							{/if}
						</div>
					{:else}
						<div class="empty">No matching commands</div>
					{/each}
				</div>

				{#if isThemePanel && previewThemeId}
					<div class="theme-preview-pane">
						<ThemePreview themeId={previewThemeId} markdown={previewMarkdown} />
					</div>
				{/if}
			</div>
	</dialog>

<style>
	dialog.palette:not([open]) {
		display: none;
	}

	dialog.palette {
		padding: 0;
		width: 520px;
		max-height: min(480px, 60vh);
		border-radius: 12px;
		background: rgba(30, 30, 30, 0.95);
		border: 1px solid rgba(255, 255, 255, 0.1);
		box-shadow:
			0 24px 80px rgba(0, 0, 0, 0.5),
			0 0 0 1px rgba(255, 255, 255, 0.05) inset;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		font-family: "Space Grotesk", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, sans-serif;
		font-size: 13px;
		color: #e0e0e0;
		text-shadow: none;
		font-style: normal;
		font-weight: 400;
		letter-spacing: normal;
		text-transform: none;
		margin-top: 20vh;
		margin-bottom: auto;
	}

	dialog.palette::backdrop {
		background: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
	}

	.breadcrumb {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 8px 16px 0;
		font-size: 11px;
		color: #888;
	}

	.breadcrumb-back {
		background: none;
		border: none;
		color: #888;
		font: inherit;
		cursor: pointer;
		padding: 0;
	}

	.breadcrumb-back:hover {
		color: #ccc;
	}

	.breadcrumb-sep {
		color: #555;
	}

	.breadcrumb-current {
		color: #bbb;
	}

	.input-row {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 12px 16px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	}

	.search-icon {
		flex-shrink: 0;
		color: #666;
	}

	.input {
		flex: 1;
		background: transparent;
		border: none;
		outline: none;
		color: #f0f0f0;
		font-family: inherit;
		font-size: 15px;
		font-weight: 400;
		caret-color: #58a6ff;
	}

	.input::placeholder {
		color: #555;
	}

	.palette-wide {
		width: 860px;
	}

	.palette-wide .list {
		flex: 30;
	}

	.palette-wide .theme-preview-pane {
		flex: 70;
	}

	.palette-body {
		display: flex;
		flex: 1;
		overflow: hidden;
	}

	.list {
		overflow-y: auto;
		padding: 6px;
		flex: 1;
		min-width: 0;
	}

	.list::-webkit-scrollbar {
		width: 6px;
	}

	.list::-webkit-scrollbar-track {
		background: transparent;
	}

	.list::-webkit-scrollbar-thumb {
		background: #333;
		border-radius: 3px;
	}

	.item {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 10px;
		border-radius: 6px;
		cursor: pointer;
		transition: none;
	}

	.item.selected {
		background: rgba(255, 255, 255, 0.08);
	}

	.item-label {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.item-spacer {
		flex: 1;
	}

	.item-detail {
		font-size: 12px;
		color: #666;
		white-space: nowrap;
	}

	.item-shortcut {
		font-family: "SF Mono", "Fira Code", monospace;
		font-size: 11px;
		color: #666;
		background: rgba(255, 255, 255, 0.06);
		padding: 2px 6px;
		border-radius: 4px;
		border: 1px solid rgba(255, 255, 255, 0.08);
		white-space: nowrap;
	}

	.item-arrow {
		color: #555;
		font-size: 16px;
		font-weight: 300;
	}

	.swatches {
		display: flex;
		gap: 3px;
		flex-shrink: 0;
	}

	.swatch {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		border: 1px solid rgba(255, 255, 255, 0.15);
	}

	.empty {
		padding: 20px;
		text-align: center;
		color: #555;
		font-size: 13px;
	}

	/* Theme preview pane */
	.theme-preview-pane {
		min-width: 0;
		border-left: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 0 0 12px 0;
		overflow: hidden;
	}
</style>
