<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Preferences from '$lib/components/Preferences.svelte';
	import { preferences } from '$lib/preferences.svelte';

	const { Story } = defineMeta({
		title: 'Shared Components/Preferences',
		component: Preferences,
		parameters: {
			layout: 'fullscreen',
			docs: {
				description: {
					component:
						'Two-column settings panel (Cmd+,). Controls are generated from the `settings` registry in `preferences.svelte.ts`, the same source the command palette reads — adding a setting there adds it to both surfaces.',
				},
			},
		},
		beforeEach: () => () => preferences.closePanel(),
	});
</script>

<Story
	name="Appearance"
	beforeEach={() => {
		preferences.setActiveSection('appearance');
		preferences.openPanel();
	}}
/>

<Story
	name="Layout"
	beforeEach={() => {
		preferences.setActiveSection('layout');
		preferences.openPanel();
	}}
/>

<Story
	name="Font"
	beforeEach={() => {
		preferences.setActiveSection('font');
		preferences.openPanel();
	}}
/>
