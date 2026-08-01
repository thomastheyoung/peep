/**
 * Seeding helpers for stories of components backed by module-level singletons
 * (`tabs`, `commandPalette`, `preferences`).
 *
 * Those singletons are instantiated once per page load, so state set by one
 * story would otherwise leak into the next. Everything here goes through the
 * public API and resets before seeding, which keeps stories independent without
 * adding test-only setters to the production interfaces.
 */
import { tabs } from "$lib/tabs.svelte";
import { renderMarkdown } from "$lib/markdown";
import { sampleDoc } from "./sample-doc";

export interface SeedTab {
	path: string;
	filename: string;
	content?: string;
}

export const DEMO_TABS: SeedTab[] = [
	{ path: "/docs/readme.md", filename: "readme.md", content: sampleDoc },
	{ path: "/docs/changelog.md", filename: "changelog.md" },
	{ path: "/docs/contributing.md", filename: "contributing.md" },
];

/** Remove every open tab. `close(0)` repeatedly, since there is no clear(). */
export function resetTabs() {
	while (tabs.items.length > 0) tabs.close(0);
}

/**
 * Replace open tabs with `seeds`, rendering each through the real markdown
 * pipeline so headings (and therefore the ToC) are populated exactly as in the app.
 */
export async function seedTabs(seeds: SeedTab[] = DEMO_TABS) {
	resetTabs();

	for (const seed of seeds) {
		const content = seed.content ?? `# ${seed.filename}\n\nPlaceholder content.`;
		const { html, headings } = await renderMarkdown(content);
		tabs.add({
			path: seed.path,
			filename: seed.filename,
			content,
			rendered: html,
			headings,
		});
	}

	tabs.activate(0);
}
