import { Marked } from "marked";
import {
	createCssVariablesTheme,
	createHighlighter,
	type Highlighter,
} from "shiki";

const cssVarsTheme = createCssVariablesTheme();

let highlighterPromise: Promise<Highlighter> | null = null;
let loadedLangsSet: Set<string> | null = null;

function getHighlighter(): Promise<Highlighter> {
	if (!highlighterPromise) {
		highlighterPromise = createHighlighter({
			themes: [cssVarsTheme],
			langs: [
				"javascript",
				"typescript",
				"python",
				"rust",
				"go",
				"html",
				"css",
				"json",
				"yaml",
				"toml",
				"bash",
				"shell",
				"markdown",
				"sql",
				"svelte",
				"jsx",
				"tsx",
				"diff",
			],
		});
	}
	return highlighterPromise;
}

const marked = new Marked();

let renderGeneration = 0;

export async function renderMarkdown(
	source: string,
): Promise<{ html: string; generation: number }> {
	const generation = ++renderGeneration;
	const hl = await getHighlighter();

	if (!loadedLangsSet) {
		loadedLangsSet = new Set(hl.getLoadedLanguages() as string[]);
	}

	marked.use({
		renderer: {
			code({ text, lang }) {
				const language = lang || "text";
				try {
					if (loadedLangsSet!.has(language)) {
						return hl.codeToHtml(text, {
							lang: language,
							theme: "css-variables",
						});
					}
				} catch {
					// fall through to plain
				}
				return `<pre><code class="language-${escapeHtml(language)}">${escapeHtml(text)}</code></pre>`;
			},
		},
	});

	const html = await marked.parse(source);
	return { html, generation };
}

export function isLatestRender(generation: number): boolean {
	return generation === renderGeneration;
}

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}
