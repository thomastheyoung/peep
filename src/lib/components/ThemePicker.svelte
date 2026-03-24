<script lang="ts">
	import { getThemeState } from "$lib/themes/theme.svelte";

	const themeState = getThemeState();
	let open = $state(false);
	let focusedIndex = $state(-1);
	let triggerEl: HTMLButtonElement;
	let listEl = $state<HTMLElement>();

	function toggle() {
		open = !open;
		if (open) {
			focusedIndex = themeState.all.findIndex((t) => t.id === themeState.id);
		}
	}

	function select(id: string) {
		themeState.setTheme(id);
		open = false;
		triggerEl.focus();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!open) {
			if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				toggle();
			}
			return;
		}

		switch (e.key) {
			case "ArrowDown":
				e.preventDefault();
				focusedIndex = (focusedIndex + 1) % themeState.all.length;
				break;
			case "ArrowUp":
				e.preventDefault();
				focusedIndex =
					(focusedIndex - 1 + themeState.all.length) %
					themeState.all.length;
				break;
			case "Enter":
			case " ": {
				e.preventDefault();
				const theme = themeState.all[focusedIndex];
				if (theme) select(theme.id);
				break;
			}
			case "Escape":
				e.preventDefault();
				open = false;
				triggerEl.focus();
				break;
		}
	}

	function handleClickOutside(e: MouseEvent) {
		if (
			open &&
			e.target instanceof Node &&
			!triggerEl.contains(e.target) &&
			!listEl?.contains(e.target)
		) {
			open = false;
		}
	}
</script>

<svelte:window onclick={handleClickOutside} />

<div class="theme-picker">
	<button
		bind:this={triggerEl}
		class="theme-picker-trigger"
		onclick={toggle}
		onkeydown={handleKeydown}
		aria-haspopup="listbox"
		aria-expanded={open}
		aria-label="Theme: {themeState.meta?.name}"
	>
		<span
			class="trigger-swatch"
			style:background={themeState.meta?.colors.accent}
		></span>
	</button>

	{#if open}
		<div
			bind:this={listEl}
			class="theme-list"
			role="listbox"
			aria-label="Select theme"
		>
			{#each themeState.all as theme, i}
				<button
					class="theme-option"
					class:active={theme.id === themeState.id}
					class:focused={i === focusedIndex}
					role="option"
					aria-selected={theme.id === themeState.id}
					onclick={() => select(theme.id)}
				>
					<span class="option-swatches">
						<span class="swatch" style:background={theme.colors.bg}></span>
						<span class="swatch" style:background={theme.colors.text}></span>
						<span class="swatch" style:background={theme.colors.accent}></span>
					</span>
					<span class="option-name">{theme.name}</span>
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.theme-picker {
		position: relative;
	}

	.theme-picker-trigger {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		transition: background-color 0.15s;
		background: transparent;
		color: inherit;
	}

	.trigger-swatch {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		border: 2px solid currentColor;
	}

	.theme-list {
		position: absolute;
		top: 100%;
		right: 0;
		margin-top: 4px;
		width: 200px;
		border-radius: 8px;
		border: 1px solid rgba(128, 128, 128, 0.4);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		background: rgba(30, 30, 30, 0.92);
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.4),
			0 0 0 1px rgba(255, 255, 255, 0.05) inset;
		padding: 4px;
		z-index: 1000;
		overflow: hidden;
		/* Override theme font/size — dropdown should be consistent */
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica,
			sans-serif;
		font-size: 13px;
		color: #e0e0e0;
		text-shadow: none;
		font-style: normal;
		font-weight: 400;
		letter-spacing: normal;
		text-transform: none;
	}

	.theme-option {
		display: flex;
		align-items: center;
		gap: 10px;
		width: 100%;
		padding: 7px 10px;
		border: none;
		border-radius: 6px;
		background: transparent;
		color: #e0e0e0;
		font-family: inherit;
		font-size: 13px;
		font-weight: 400;
		font-style: normal;
		text-shadow: none;
		letter-spacing: normal;
		text-transform: none;
		cursor: pointer;
		transition: background-color 0.1s;
		text-align: left;
	}

	.theme-option:hover,
	.theme-option.focused {
		background: rgba(255, 255, 255, 0.1);
	}

	.theme-option.active {
		background: rgba(255, 255, 255, 0.06);
		font-weight: 500;
	}

	.theme-option.active::before {
		content: "";
		position: absolute;
		left: 6px;
		width: 3px;
		height: 16px;
		border-radius: 2px;
		background: currentColor;
		opacity: 0.5;
	}

	.option-swatches {
		display: flex;
		gap: 2px;
		flex-shrink: 0;
	}

	.swatch {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		border: 1.5px solid rgba(255, 255, 255, 0.2);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
	}

	.option-name {
		white-space: nowrap;
	}
</style>
