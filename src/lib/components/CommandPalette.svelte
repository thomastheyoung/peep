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
		margin-top: 20vh;
		margin-bottom: auto;
	}

	dialog.palette::backdrop {
		background: rgba(0, 0, 0, 0.5);
	}

	.breadcrumb {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 8px 16px 0;
		font-size: var(--chrome-font-size-xs);
		color: var(--chrome-text);
	}

	.breadcrumb-back {
		background: none;
		border: none;
		color: var(--chrome-text);
		font: inherit;
		cursor: pointer;
		padding: 0;
	}

	.breadcrumb-back:hover {
		color: var(--chrome-text-active);
	}

	.breadcrumb-sep {
		color: var(--chrome-border);
	}

	.breadcrumb-current {
		color: var(--chrome-text-active);
	}

	.input-row {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 12px 16px;
		border-bottom: var(--chrome-border-width) solid var(--chrome-border);
	}

	.search-icon {
		flex-shrink: 0;
		color: var(--chrome-text);
	}

	.input {
		flex: 1;
		background: transparent;
		border: none;
		outline: none;
		color: var(--chrome-text-active);
		font-family: inherit;
		font-size: var(--chrome-font-size-lg);
		font-weight: 400;
		caret-color: var(--chrome-accent);
	}

	.input::placeholder {
		color: var(--chrome-text);
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
		background: var(--chrome-border);
		border-radius: 3px;
	}

	.item {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 10px;
		border-radius: var(--chrome-radius);
		cursor: pointer;
		transition: none;
	}

	.item.selected {
		background: var(--chrome-bg-hover);
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
		font-size: var(--chrome-font-size-sm);
		color: var(--chrome-text);
		white-space: nowrap;
	}

	.item-shortcut {
		font-family: var(--chrome-font-mono);
		font-size: var(--chrome-font-size-xs);
		color: var(--chrome-text);
		background: var(--chrome-bg);
		padding: 2px 6px;
		border-radius: var(--chrome-radius);
		border: 1px solid var(--chrome-border);
		white-space: nowrap;
	}

	.item-arrow {
		color: var(--chrome-text);
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
		border: 1px solid var(--chrome-border);
	}

	.empty {
		padding: 20px;
		text-align: center;
		color: var(--chrome-text);
		font-size: var(--chrome-font-size-md);
	}

	/* Theme preview pane */
	.theme-preview-pane {
		min-width: 0;
		border-left: var(--chrome-border-width) solid var(--chrome-border);
		overflow: hidden;
	}
</style>
