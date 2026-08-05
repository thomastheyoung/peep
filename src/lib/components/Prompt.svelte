<script lang="ts">
	// Render surface for src/lib/prompt.svelte.ts's `ask()` queue. Mounted
	// once in +page.svelte alongside <Preferences /> and <CommandPalette />,
	// which this file's structure and CSS conventions (`--chrome-*` tokens,
	// the showModal/close $effect pattern) deliberately match — see
	// Preferences.svelte:141 and CommandPalette.svelte:107.
	import { prompt } from "$lib/prompt.svelte";

	let dialogEl: HTMLDialogElement | undefined = $state();
	let inputEl: HTMLInputElement | undefined = $state();
	let primaryEl: HTMLButtonElement | undefined = $state();
	let value = $state("");

	// `bind:this` cannot target a conditional expression, and the primary
	// choice's position among `choices` is caller-defined (not always
	// index 0), so a plain action captures whichever button element is
	// currently flagged `primary` for the focus effect below to use.
	function registerPrimary(node: HTMLButtonElement, isPrimary: boolean | undefined) {
		if (isPrimary) primaryEl = node;
		return {
			destroy() {
				if (primaryEl === node) primaryEl = undefined;
			},
		};
	}

	const request = $derived(prompt.current);
	const inputSpec = $derived(request?.input);
	const validationError = $derived.by(() => {
		if (!inputSpec?.validate) return null;
		return inputSpec.validate(value);
	});
	const hint = $derived.by(() => {
		if (!inputSpec?.hint) return null;
		return inputSpec.hint(value);
	});
	const primaryChoice = $derived(request?.choices.find((c) => c.primary));
	const canSubmit = $derived(!inputSpec || validationError === null);

	$effect(() => {
		if (request) {
			value = inputSpec?.initial ?? "";
			dialogEl?.showModal();
			// Focus after the dialog has actually opened and the DOM for this
			// request has rendered — an input takes priority (so a pre-filled
			// suggestion can be typed over immediately), otherwise the primary
			// (safe) button, never a danger button by default.
			requestAnimationFrame(() => {
				if (inputEl) {
					inputEl.focus();
					inputEl.select();
				} else {
					primaryEl?.focus();
				}
			});
		} else {
			dialogEl?.close();
		}
	});

	function choose(choiceValue: string) {
		if (inputSpec && choiceValue === primaryChoice?.value && !canSubmit) return;
		prompt.resolve(choiceValue, inputSpec ? value : undefined);
	}

	function handleCancel(e: Event) {
		e.preventDefault();
		// Must not bubble: this dialog can open ON TOP of the already-modal
		// Preferences dialog (Preferences.svelte:145 has its own `oncancel`).
		// Letting Escape bubble would close both on a single press.
		e.stopPropagation();
		prompt.cancel();
	}

	function handleDialogClick(e: MouseEvent) {
		if (e.target === dialogEl) {
			prompt.cancel();
		}
	}

	function handleInputKeydown(e: KeyboardEvent) {
		if (e.key === "Enter") {
			e.preventDefault();
			if (primaryChoice) choose(primaryChoice.value);
		}
	}
</script>

<dialog
	bind:this={dialogEl}
	class="prompt"
	aria-labelledby="prompt-title"
	aria-describedby={request?.body ? "prompt-body" : undefined}
	oncancel={handleCancel}
	onclick={handleDialogClick}
>
	{#if request}
		<div class="prompt-content">
			<h2 id="prompt-title" class="prompt-title">{request.title}</h2>
			{#if request.body}
				<p id="prompt-body" class="prompt-body">{request.body}</p>
			{/if}

			{#if inputSpec}
				<div class="input-group">
					<label class="input-label" for="prompt-input">{inputSpec.label}</label>
					<input
						id="prompt-input"
						bind:this={inputEl}
						type="text"
						class="input-field"
						class:invalid={validationError !== null}
						placeholder={inputSpec.placeholder}
						bind:value
						onkeydown={handleInputKeydown}
						aria-invalid={validationError !== null}
						aria-describedby={validationError ? "prompt-input-error" : hint ? "prompt-input-hint" : undefined}
					/>
					{#if validationError}
						<span id="prompt-input-error" class="input-error">{validationError}</span>
					{:else if hint}
						<span id="prompt-input-hint" class="input-hint">{hint}</span>
					{/if}
				</div>
			{/if}

			<div class="choices">
				{#each request.choices as choice (choice.value)}
					<button
						type="button"
						class="choice-btn"
						class:primary={choice.primary}
						class:danger={choice.danger}
						use:registerPrimary={choice.primary}
						disabled={choice.primary && !canSubmit}
						onclick={() => choose(choice.value)}
					>
						{choice.label}
					</button>
				{/each}
			</div>
		</div>
	{/if}
</dialog>

<style>
	dialog.prompt:not([open]) {
		display: none;
	}

	dialog.prompt {
		padding: 0;
		width: 380px;
		border-radius: var(--chrome-radius);
		background: var(--chrome-surface);
		border: var(--chrome-border-width) solid var(--chrome-border);
		box-shadow: 6px 6px 0 var(--chrome-border);
		font-family: var(--chrome-font);
		font-size: var(--chrome-font-size-md);
		color: var(--chrome-text-active);
		text-shadow: none;
		font-style: normal;
		font-weight: 400;
		letter-spacing: normal;
		text-transform: none;
	}

	dialog.prompt::backdrop {
		background: rgba(0, 0, 0, 0.5);
	}

	dialog.prompt[open] {
		animation: prompt-in 120ms ease-out;
	}

	@keyframes prompt-in {
		from {
			opacity: 0;
			transform: translateY(-4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		dialog.prompt[open] {
			animation: none;
		}
	}

	.prompt-content {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 20px;
	}

	.prompt-title {
		margin: 0;
		font-family: var(--chrome-font-mono);
		font-size: var(--chrome-font-size-md);
		font-weight: 600;
		color: var(--chrome-text-active);
		letter-spacing: 0.02em;
	}

	.prompt-body {
		margin: 0;
		font-size: var(--chrome-font-size-sm);
		color: var(--chrome-text);
		line-height: 1.5;
	}

	.input-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.input-label {
		font-size: var(--chrome-font-size-xs);
		font-weight: 600;
		color: var(--chrome-text);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.input-field {
		padding: 6px 10px;
		border: var(--chrome-border-width) solid var(--chrome-border);
		border-radius: var(--chrome-radius);
		background: var(--chrome-bg);
		color: var(--chrome-text-active);
		font-family: inherit;
		font-size: var(--chrome-font-size-md);
		outline: none;
	}

	.input-field:focus-visible {
		border-color: var(--chrome-accent);
	}

	.input-field.invalid {
		border-color: #e5484d;
	}

	.input-error {
		font-size: var(--chrome-font-size-xs);
		color: #e5484d;
	}

	.input-hint {
		font-size: var(--chrome-font-size-xs);
		color: var(--chrome-text);
	}

	.choices {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
		margin-top: 4px;
	}

	.choice-btn {
		padding: 6px 14px;
		border: var(--chrome-border-width) solid var(--chrome-border);
		border-radius: var(--chrome-radius);
		background: var(--chrome-bg);
		color: var(--chrome-text);
		font-family: var(--chrome-font-mono);
		font-size: var(--chrome-font-size-sm);
		cursor: pointer;
		transition: transform 100ms ease, box-shadow 100ms ease;
	}

	.choice-btn:hover:not(:disabled) {
		transform: translate(-1px, -1px);
		box-shadow: 2px 2px 0 var(--chrome-border);
		color: var(--chrome-text-active);
	}

	.choice-btn:active:not(:disabled) {
		transform: translate(1px, 1px);
		box-shadow: none;
	}

	.choice-btn:disabled {
		opacity: 0.5;
		cursor: default;
	}

	.choice-btn.primary {
		border-color: var(--chrome-accent);
		color: var(--chrome-accent);
		font-weight: 600;
	}

	.choice-btn.primary:hover:not(:disabled) {
		box-shadow: 2px 2px 0 var(--chrome-accent);
	}

	.choice-btn.danger {
		border-color: #e5484d;
		color: #e5484d;
	}

	.choice-btn.danger:hover:not(:disabled) {
		box-shadow: 2px 2px 0 #e5484d;
	}

	@media (prefers-reduced-motion: reduce) {
		.choice-btn {
			transition: none;
		}
	}
</style>
