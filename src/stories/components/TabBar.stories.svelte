<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import TabBar from '$lib/components/TabBar.svelte';
	import { seedTabs, resetTabs, DEMO_TABS } from '$lib/storybook/seed';
	import { fn } from 'storybook/test';

	const { Story } = defineMeta({
		title: 'Shared Components/TabBar',
		component: TabBar,
		parameters: {
			layout: 'fullscreen',
			docs: {
				description: {
					component:
						'Titlebar and tab strip. Reads the `tabs` singleton directly, so stories seed it in `beforeEach` rather than passing props. Tauri window APIs (used for drag and close) are stubbed in `.storybook/tauri-mock.ts`.',
				},
			},
		},
		args: { onclose: fn() },
		// Returned cleanup empties the singleton so stories stay independent.
		beforeEach: () => resetTabs,
	});
</script>

<Story name="Multiple Tabs" beforeEach={() => seedTabs(DEMO_TABS)} />

<Story name="Single Tab" beforeEach={() => seedTabs(DEMO_TABS.slice(0, 1))} />

<Story name="No Tabs" beforeEach={() => resetTabs()} />
