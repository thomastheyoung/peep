import type { StorybookConfig } from '@storybook/sveltekit';

const config: StorybookConfig = {
  // Stories live in three sections under src/stories:
  //   components/   -> "Shared Components"    (real app components)
  //   themes/       -> "Official Themes"      (driven by $lib/themes/registry)
  //   explorations/ -> "Design Explorations"  (frozen design studies)
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|ts|svelte)"
  ],
  "addons": [
    "@storybook/addon-svelte-csf",
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs"
  ],
  "framework": "@storybook/sveltekit",
  // Serves the same assets SvelteKit does, so base.css @font-face URLs
  // (/fonts/*.woff2) resolve instead of silently falling back.
  "staticDirs": ["../static"]
};
export default config;
