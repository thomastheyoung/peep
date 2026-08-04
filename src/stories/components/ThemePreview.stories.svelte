<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ThemePreview from '$lib/components/ThemePreview.svelte';
	import Frame from '$lib/storybook/Frame.svelte';
	import { themes } from '$lib/themes/registry';
	import { sampleDoc } from '$lib/storybook/sample-doc';

	const { Story } = defineMeta({
		title: 'Shared Components/ThemePreview',
		component: ThemePreview,
		parameters: {
			layout: 'centered',
			docs: {
				description: {
					component:
						'Renders a miniature themed document inside a Shadow DOM so theme CSS cannot leak into the surrounding page. Used by the command palette for live theme preview.',
				},
			},
		},
		argTypes: {
			themeId: {
				control: 'select',
				options: themes.map((t) => t.id),
			},
		},
	});
</script>

<Story name="Playground" args={{ themeId: 'github-dark', markdown: sampleDoc }}>
	{#snippet template(args)}
		<Frame>
			<ThemePreview {...args} />
		</Frame>
	{/snippet}
</Story>

<Story name="Fallback Sample" args={{ themeId: 'minimal-mono' }}>
	{#snippet template(args)}
		<Frame>
			<ThemePreview {...args} />
		</Frame>
	{/snippet}
</Story>

<Story name="Shadow DOM Isolation" args={{ themeId: 'neo-brutalist', markdown: sampleDoc }}>
	{#snippet template(args)}
		<div style="font-family: ui-sans-serif, system-ui, sans-serif;">
			<p style="max-width: 460px; margin: 0 0 12px; font-size: 13px; color: #6b7280;">
				This surrounding text is deliberately unstyled by the theme — proof the
				theme CSS stays inside the shadow root.
			</p>
			<Frame>
				<ThemePreview {...args} />
			</Frame>
		</div>
	{/snippet}
</Story>
