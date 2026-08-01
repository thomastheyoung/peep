<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import FloatingDock from '$lib/components/FloatingDock.svelte';
	import { seedTabs, resetTabs, DEMO_TABS } from '$lib/storybook/seed';

	const { Story } = defineMeta({
		title: 'Shared Components/FloatingDock',
		component: FloatingDock,
		parameters: {
			layout: 'fullscreen',
			docs: {
				description: {
					component:
						'Floating table-of-contents dock. Headings come from the active tab via the `toc` facade, so stories seed a rendered document. Click the dock to expand the heading strip.',
				},
			},
		},
		beforeEach: () => resetTabs,
	});
</script>

<script lang="ts">
	// The dock scrolls its target on heading click; a story has no page
	// scroller, so pass undefined — clicks become no-ops but layout is faithful.
	const scrollContainer = undefined;
</script>

<Story name="With Headings" beforeEach={() => seedTabs(DEMO_TABS)}>
	{#snippet template()}
		<div style="height: 100vh; position: relative;">
			<FloatingDock {scrollContainer} />
		</div>
	{/snippet}
</Story>

<!-- No open document: the dock has no headings to show. -->
<Story name="No Document" beforeEach={() => resetTabs()}>
	{#snippet template()}
		<div style="height: 100vh; position: relative;">
			<FloatingDock {scrollContainer} />
		</div>
	{/snippet}
</Story>
