<script lang="ts">
	import { getCommandPalette } from "$lib/command-palette.svelte";
	import type { Command } from "$lib/commands";

	const palette = getCommandPalette();

	let inputEl: HTMLInputElement | undefined = $state();
	let listEl: HTMLDivElement | undefined = $state();

	const filtered: Command[] = $derived.by(() => {
		const level = palette.currentLevel;
		if (!level) return [];
		const q = palette.query.toLowerCase();
		if (!q) return level.commands;
		return level.commands.filter((cmd) => {
			if (cmd.label.toLowerCase().includes(q)) return true;
			return cmd.keywords?.some((k) => k.toLowerCase().includes(q)) ?? false;
		});
	});

	$effect(() => {
		if (palette.open) {
			// Focus input when palette opens or drills in/out
			palette.depth; // track depth changes
			requestAnimationFrame(() => inputEl?.focus());
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
		} else if (e.key === "Escape") {
			e.preventDefault();
			palette.back();
		} else if (
			e.key === "Backspace" &&
			palette.query === "" &&
			palette.depth > 1
		) {
			e.preventDefault();
			palette.back();
		}
	}

	async function executeCommand(cmd: Command) {
		if (cmd.children) {
			palette.drillIn(cmd.children(), cmd.label);
		} else if (cmd.action) {
			palette.close();
			await cmd.action();
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
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

{#if palette.open}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="backdrop" onclick={handleBackdropClick} onkeydown={() => {}}>
		<div class="palette" role="dialog" aria-label="Command palette">
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

			<div class="list" bind:this={listEl}>
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
		</div>
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 3000;
		background: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
		display: flex;
		justify-content: center;
		padding-top: 20vh;
	}

	.palette {
		width: 520px;
		max-height: 420px;
		border-radius: 12px;
		background: rgba(30, 30, 30, 0.95);
		border: 1px solid rgba(255, 255, 255, 0.1);
		box-shadow:
			0 24px 80px rgba(0, 0, 0, 0.5),
			0 0 0 1px rgba(255, 255, 255, 0.05) inset;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		align-self: flex-start;
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, sans-serif;
		font-size: 13px;
		color: #e0e0e0;
		text-shadow: none;
		font-style: normal;
		font-weight: 400;
		letter-spacing: normal;
		text-transform: none;
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

	.list {
		overflow-y: auto;
		padding: 6px;
		flex: 1;
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
</style>
