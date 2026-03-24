import { Marked } from "marked";
import { createHighlighter, type Highlighter } from "shiki";

let highlighter: Highlighter | null = null;

async function getHighlighter(): Promise<Highlighter> {
	if (!highlighter) {
		highlighter = await createHighlighter({
			themes: ["github-dark", "github-light"],
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
	return highlighter;
}

export async function renderMarkdown(
	source: string,
	theme: "dark" | "light",
): Promise<string> {
	const hl = await getHighlighter();
	const shikiTheme = theme === "dark" ? "github-dark" : "github-light";

	const marked = new Marked({
		renderer: {
			code({ text, lang }) {
				const language = lang || "text";
				try {
					const loadedLangs = hl.getLoadedLanguages();
					if (loadedLangs.includes(language as never)) {
						return hl.codeToHtml(text, { lang: language, theme: shikiTheme });
					}
				} catch {
					// fall through to plain
				}
				return `<pre><code class="language-${language}">${escapeHtml(text)}</code></pre>`;
			},
		},
	});

	return await marked.parse(source);
}

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");
}
