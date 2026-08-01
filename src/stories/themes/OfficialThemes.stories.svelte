<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ThemeGallery from '$lib/storybook/ThemeGallery.svelte';
	import { sampleDoc } from '$lib/storybook/sample-doc';

	/** Exercises the elements themes most often get wrong. */
	const codeHeavyDoc = `## Code and tables

\`\`\`typescript
export async function renderMarkdown(source: string) {
  const highlighter = await getHighlighter();
  return marked.parse(source);
}
\`\`\`

| Theme         | Kind  |
| ------------- | ----- |
| GitHub Dark   | dark  |
| Warm Paper    | light |

> Blockquote following a table.

- Nested list
  - Second level
    - Third level
`;

	const { Story } = defineMeta({
		title: 'Official Themes/Gallery',
		component: ThemeGallery,
		parameters: {
			layout: 'fullscreen',
			docs: {
				description: {
					component:
						'Every theme in `$lib/themes/registry`, each rendered through the real markdown pipeline inside its own Shadow DOM. Adding a theme to the registry adds it here — no story edit needed.',
				},
			},
		},
		argTypes: {
			columns: { control: { type: 'range', min: 1, max: 4, step: 1 } },
			height: { control: { type: 'range', min: 240, max: 1200, step: 20 } },
		},
		args: { markdown: sampleDoc, columns: 2, height: 560 },
	});
</script>

<Story name="All Themes" />

<Story name="Single Column" args={{ columns: 1, height: 720 }} />

<Story name="Contact Sheet" args={{ columns: 4, height: 380 }} />

<!-- Code blocks, tables, and nested lists across every theme. -->
<Story name="Code And Tables" args={{ markdown: codeHeavyDoc, columns: 2, height: 520 }} />

<!-- No `markdown` prop: each preview falls back to ThemePreview's built-in sample. -->
<Story name="Default Sample" args={{ markdown: undefined }} />
