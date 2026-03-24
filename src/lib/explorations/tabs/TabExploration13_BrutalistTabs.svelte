<script lang="ts">
	const tabs = ['README.md', 'CHANGELOG.md', 'design-notes.md', 'api-docs.md'];
	let activeIndex = $state(1);

	const colors = ['#fde047', '#f472b6', '#67e8f9', '#a78bfa'];
</script>

<div class="container">
	<span class="label">13 / Brutalist tabs</span>
	<div class="tab-bar">
		{#each tabs as tab, i (tab)}
			<button
				class="tab"
				class:active={activeIndex === i}
				style="--tab-color: {colors[i]}"
				onclick={() => (activeIndex = i)}
			>
				<span class="tab-name">{tab}</span>
				<span class="close" role="button" tabindex="-1" onkeydown={(e) => e.key === 'Enter' && e.stopPropagation()} onclick={(e) => e.stopPropagation()}>×</span>
			</button>
		{/each}
	</div>
</div>

<style>
	.container {
		font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		padding: 20px;
		background: #fffdf0;
		border-radius: 0;
		border: 3px solid #000;
	}

	.label {
		display: block;
		font-size: 12px;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #000;
		margin-bottom: 14px;
	}

	.tab-bar {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
	}

	.tab {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 18px;
		border: 3px solid #000;
		border-radius: 0;
		background: var(--tab-color);
		color: #000;
		font-size: 14px;
		font-weight: 700;
		font-family: inherit;
		cursor: pointer;
		transition: all 0.1s ease;
		white-space: nowrap;
		box-shadow: 4px 4px 0 #000;
		position: relative;
	}

	.tab:hover:not(.active) {
		transform: translate(-1px, -1px);
		box-shadow: 5px 5px 0 #000;
	}

	.tab:active {
		transform: translate(2px, 2px);
		box-shadow: 2px 2px 0 #000;
	}

	.tab.active {
		transform: translate(2px, 2px);
		box-shadow: 2px 2px 0 #000;
		outline: 2px solid #000;
		outline-offset: 3px;
	}

	.close {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		border-radius: 0;
		border: 2px solid #000;
		font-size: 14px;
		font-weight: 900;
		line-height: 1;
		background: #fff;
		transition: all 0.1s ease;
	}

	.close:hover {
		background: #ef4444;
		color: #fff;
	}
</style>
