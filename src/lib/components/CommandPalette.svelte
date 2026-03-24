<script lang="ts">
	import { getCommandPalette } from "$lib/command-palette.svelte";
	import type { Command } from "$lib/commands";
	import { themes } from "$lib/themes/registry";
	import baseCssRaw from "$lib/themes/base.css?raw";

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

	const isThemePanel = $derived(filtered.length > 0 && filtered[0]?.swatches != null);

	// Extract theme ID from selected command (format: "theme:<id>")
	const previewThemeId = $derived.by(() => {
		if (!isThemePanel) return undefined;
		const cmd = filtered[palette.selectedIndex];
		if (!cmd) return undefined;
		const parts = cmd.id.split(":");
		return parts.length === 2 ? parts[1] : undefined;
	});

	// Load and scope theme CSS for preview
	let previewCss = $state("");
	const cssCache = new Map<string, string>();

	function scopeCss(raw: string): string {
		// Extract @font-face blocks (keep global)
		const fontFaces: string[] = [];
		let css = raw.replace(/@font-face\s*\{[^}]*\}/g, (match) => {
			fontFaces.push(match);
			return "";
		});

		// Strip @layer declarations and wrappers
		css = css.replace(/@layer\s+[\w,\s]+;/g, "");
		css = css.replace(/@layer\s+[\w,\s]+\{/g, "");
		// Remove matching closing braces (one per stripped @layer)
		const stripped = (raw.match(/@layer\s+[\w,\s]+\{/g) || []).length;
		for (let i = 0; i < stripped; i++) {
			const idx = css.lastIndexOf("}");
			if (idx !== -1) css = css.slice(0, idx) + css.slice(idx + 1);
		}

		// Scope selectors into preview container
		css = css.replace(/\.app\b/g, ".theme-preview-scope");
		css = css.replace(/\.markdown-body\b/g, ".theme-preview-scope .preview-markdown");
		css = css.replace(/\.shiki\b/g, ".theme-preview-scope .shiki");

		return fontFaces.join("\n") + "\n" + css;
	}

	const scopedBaseCss = scopeCss(baseCssRaw);

	$effect(() => {
		const id = previewThemeId;
		if (!id) {
			previewCss = "";
			return;
		}

		const cached = cssCache.get(id);
		if (cached) {
			previewCss = cached;
			return;
		}

		const meta = themes.find((t) => t.id === id);
		if (!meta) return;

		meta.load().then((raw) => {
			const scoped = scopedBaseCss + "\n" + scopeCss(raw);
			cssCache.set(id, scoped);
			// Only apply if still the selected theme
			if (previewThemeId === id) previewCss = scoped;
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
		<div class="palette" class:palette-wide={isThemePanel} role="dialog" aria-label="Command palette">
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

			<div class="palette-body" class:palette-body-split={isThemePanel}>
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

				{#if isThemePanel && previewCss}
					<div class="theme-preview-pane theme-preview-scope">
						{@html `<style>${previewCss}</style>`}
						<div class="preview-markdown">
							<h1>Heading</h1>
							<p>Body text with a <a href="#preview">hyperlink</a> and some <strong>bold words</strong> in a paragraph.</p>
							<blockquote><p>A blockquote adds emphasis to a passage.</p></blockquote>
							<!-- svelte-ignore element_invalid_self_closing_tag -->
							<hr />
							<pre><code>const theme = "preview";</code></pre>
							<ul>
								<li>List item one</li>
								<li>List item <a href="#preview">with link</a></li>
							</ul>
						</div>
					</div>
				{/if}
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
		max-height: 480px;
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

	.palette-wide {
		width: 780px;
	}

	.palette-body {
		display: flex;
		flex: 1;
		overflow: hidden;
	}

	.palette-body-split {
		border-top: none;
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
		width: 300px;
		flex-shrink: 0;
		border-left: 1px solid rgba(255, 255, 255, 0.08);
		overflow-y: auto;
		overflow-x: hidden;
		border-radius: 0 0 12px 0;
	}

	/* Override base CSS layout values for the compact preview */
	.theme-preview-pane :global(.preview-markdown) {
		max-width: none !important;
		padding: 20px !important;
		font-size: 13px !important;
	}

	.theme-preview-pane :global(.preview-markdown h1) {
		font-size: 1.4em !important;
		margin-top: 0 !important;
	}

	.theme-preview-pane :global(.preview-markdown pre) {
		overflow: hidden !important;
	}
</style>
