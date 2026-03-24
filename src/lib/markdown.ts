import DOMPurify from "dompurify";
import { Marked } from "marked";
import {
	createCssVariablesTheme,
	createHighlighter,
	type Highlighter,
} from "shiki";

const cssVarsTheme = createCssVariablesTheme();

let highlighterPromise: Promise<Highlighter> | null = null;

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

export async function renderMarkdown(source: string): Promise<string> {
	const hl = await getHighlighter();

	const marked = new Marked({
		renderer: {
			code({ text, lang }) {
				const language = lang || "text";
				try {
					const loadedLangs = hl.getLoadedLanguages() as string[];
					if (loadedLangs.includes(language)) {
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
	return DOMPurify.sanitize(html, {
		ADD_ATTR: ["style"],
	});
}

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}
