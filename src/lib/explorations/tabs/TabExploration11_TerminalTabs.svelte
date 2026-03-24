<script lang="ts">
	const tabs = ['README.md', 'CHANGELOG.md', 'design-notes.md', 'api-docs.md'];
	let activeIndex = $state(1);
</script>

<div class="container">
	<span class="label">11 / Terminal tabs</span>
	<div class="tab-bar">
		{#each tabs as tab, i (tab)}
			<button
				class="tab"
				class:active={activeIndex === i}
				onclick={() => (activeIndex = i)}
			>
				<span class="prompt">~/</span>
				<span class="tab-name">{tab}</span>
				{#if activeIndex === i}
					<span class="cursor"></span>
				{/if}
				<span class="close" role="button" tabindex="-1" onkeydown={(e) => e.key === 'Enter' && e.stopPropagation()} onclick={(e) => e.stopPropagation()}>×</span>
			</button>
		{/each}
	</div>
</div>

<style>
	.container {
		font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
		padding: 20px;
		background: #0a0a1a;
		border-radius: 12px;
	}

	.label {
		display: block;
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: #4ade80;
		margin-bottom: 12px;
		opacity: 0.6;
	}

	.tab-bar {
		display: flex;
		gap: 0;
		background: #1a1a2e;
		border-radius: 0;
		border-bottom: 1px solid #2a2a4a;
	}

	.tab {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 10px 16px;
		border: none;
		border-bottom: 2px solid transparent;
		background: transparent;
		color: #6b7280;
		font-size: 13px;
		font-family: inherit;
		font-weight: 400;
		cursor: pointer;
		transition: all 0.15s ease;
		white-space: nowrap;
		position: relative;
	}

	.tab:hover:not(.active) {
		background: rgba(74, 222, 128, 0.05);
		color: #9ca3af;
	}

	.tab.active {
		background: rgba(74, 222, 128, 0.08);
		color: #4ade80;
		border-bottom-color: #4ade80;
	}

	.prompt {
		color: #22c55e;
		opacity: 0.5;
	}

	.tab.active .prompt {
		opacity: 1;
	}

	.cursor {
		display: inline-block;
		width: 7px;
		height: 15px;
		background: #4ade80;
		animation: blink 1s step-end infinite;
		margin-left: 2px;
		vertical-align: middle;
	}

	@keyframes blink {
		0%, 100% { opacity: 1; }
		50% { opacity: 0; }
	}

	.close {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		border-radius: 3px;
		font-size: 14px;
		line-height: 1;
		margin-left: 8px;
		transition: background 0.15s ease;
		color: inherit;
	}

	.tab:not(.active) .close:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.tab.active .close:hover {
		background: rgba(74, 222, 128, 0.2);
	}
</style>
