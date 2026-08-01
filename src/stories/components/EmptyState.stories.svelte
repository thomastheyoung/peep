<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import EmptyStateStamp from '$lib/components/EmptyStateStamp.svelte';
	import { fn } from 'storybook/test';

	const { Story } = defineMeta({
		title: 'Shared Components/EmptyState',
		component: EmptyState,
		parameters: {
			layout: 'fullscreen',
			docs: {
				description: {
					component:
						'Shown when no document is open. Presents the keyboard shortcuts and an Open File action. Two variants exist in the app: the aurora default and a stamp alternative.',
				},
			},
		},
		args: {
			onOpenFile: fn(),
			hidden: false,
		},
	});
</script>

<Story name="Aurora (default)" />

<Story name="Stamp">
	{#snippet template(args)}
		<EmptyStateStamp {...args} />
	{/snippet}
</Story>

<!-- `hidden` drives the fade-out when a document opens. -->
<Story name="Hidden" args={{ hidden: true }} />
