<script lang="ts">
	import { toast } from "$lib/toast.svelte";
</script>

<!--
	App chrome, rendered as a sibling of `.app` in +page.svelte — NOT inside
	`.markdown-body`. That placement is what keeps it outside the sanitized
	theme CSS's `@scope (.markdown-body)` boundary (see base.css and
	sanitize-theme-css.ts's file header): a theme is exactly what this
	component reports failures ABOUT, so it must render somewhere a broken or
	hostile theme cannot reach.
-->
<div class="toast-region" role="status" aria-live="polite">
	{#each toast.toasts as t (t.id)}
		<div class="toast" class:error={t.kind === "error"}>
			<span class="message">{t.message}</span>
			<button class="dismiss" onclick={() => toast.dismiss(t.id)} aria-label="Dismiss">&times;</button>
		</div>
	{/each}
</div>

<style>
	.toast-region {
		position: fixed;
		bottom: 20px;
		right: 20px;
		z-index: 1000;
		display: flex;
		flex-direction: column-reverse;
		gap: 8px;
		pointer-events: none;
	}

	.toast {
		display: flex;
		align-items: center;
		gap: 10px;
		max-width: 360px;
		padding: 10px 12px;
		border: var(--chrome-border-width) solid var(--chrome-border);
		border-radius: var(--chrome-radius);
		background: var(--chrome-surface);
		color: var(--chrome-text-active);
		font-family: var(--chrome-font);
		font-size: var(--chrome-font-size-md);
		box-shadow: 4px 4px 0 var(--chrome-border);
		pointer-events: auto;
	}

	.toast.error {
		border-color: #e5484d;
		box-shadow: 4px 4px 0 #e5484d;
	}

	.message {
		flex: 1;
		min-width: 0;
	}

	.dismiss {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		border: none;
		background: transparent;
		color: var(--chrome-text);
		font-size: var(--chrome-font-size-md);
		line-height: 1;
		cursor: pointer;
	}

	.dismiss:hover {
		color: var(--chrome-text-active);
	}
</style>
