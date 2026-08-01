<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import CommandPalette from '$lib/components/CommandPalette.svelte';
	import { commandPalette } from '$lib/command-palette.svelte';
	import { buildCommands } from '$lib/commands';
	import { preferences } from '$lib/preferences.svelte';
	import { tabs } from '$lib/tabs.svelte';
	import { updater } from '$lib/updater.svelte';
	import { seedTabs, resetTabs, DEMO_TABS } from '$lib/storybook/seed';
	import { fn } from 'storybook/test';

	/** Real command list, built from the real singletons. */
	function commands() {
		return buildCommands({
			prefs: preferences,
			tabs,
			updater,
			openFileDialog: fn(),
			closeTab: fn(),
		});
	}

	function openPalette() {
		commandPalette.show(commands());
	}

	/** Open the palette already drilled into the theme picker. */
	function openThemePicker() {
		openPalette();
		const themeCmd = commandPalette.filtered.find((c) => c.id === 'theme');
		// `children` is a thunk, matching how CommandPalette.svelte invokes it.
		if (themeCmd?.kind === 'parent') {
			commandPalette.drillIn(themeCmd.children(), themeCmd.label);
		}
	}

	const { Story } = defineMeta({
		title: 'Shared Components/CommandPalette',
		component: CommandPalette,
		parameters: {
			layout: 'fullscreen',
			docs: {
				description: {
					component:
						'Cmd+K palette with fuzzy search, keyboard navigation, and drill-in sub-lists. The theme level shows a live Shadow DOM preview of the highlighted theme.',
				},
			},
		},
		beforeEach: () => {
			// Restore both singletons the palette reads from.
			return () => {
				commandPalette.close();
				resetTabs();
			};
		},
	});
</script>

<Story
	name="Open"
	beforeEach={async () => {
		await seedTabs(DEMO_TABS);
		openPalette();
	}}
/>

<Story
	name="Theme Picker"
	beforeEach={async () => {
		await seedTabs(DEMO_TABS);
		openThemePicker();
	}}
/>

<!-- Typing narrows the list; selection resets to the first match. -->
<Story
	name="Filtered Query"
	beforeEach={async () => {
		await seedTabs(DEMO_TABS);
		openPalette();
		commandPalette.setQuery('theme');
	}}
/>

<Story
	name="No Document Open"
	beforeEach={() => {
		resetTabs();
		openPalette();
	}}
/>
