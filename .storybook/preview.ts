import type { Preview } from '@storybook/sveltekit'
import { installTauriMock } from './tauri-mock'
// Same import `+page.svelte` makes: supplies the `--chrome-*` design tokens and
// @font-face rules the chrome components rely on.
import '../src/lib/themes/base.css'

installTauriMock()

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    // The three top-level sections. Anything unlisted sorts after them, so a
    // new story shows up at the bottom rather than being silently buried.
    options: {
      storySort: {
        order: ['Shared Components', 'Official Themes', 'Design Explorations'],
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    }
  },
};

export default preview;
