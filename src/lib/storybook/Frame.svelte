<script lang="ts">
	/** Fixed-size bordered box, so components that fill their container have
	 *  something to fill inside Storybook's canvas. */
	import type { Snippet } from "svelte";

	let {
		width = "460px",
		height = "460px",
		children,
	}: { width?: string; height?: string; children: Snippet } = $props();
</script>

<div class="frame" style="width: {width}; height: {height}">
	{@render children()}
</div>

<style>
	.frame {
		border: 1px solid rgb(0 0 0 / 0.15);
		border-radius: 10px;
		overflow: hidden;
		position: relative;
	}
</style>
