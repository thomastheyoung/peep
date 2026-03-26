import { Marked } from "marked";
import {
	createCssVariablesTheme,
	createHighlighter,
	type Highlighter,
} from "shiki";

export interface TocHeading {
	text: string;
	level: number;
	id: string;
}

function stripHtmlTags(html: string): string {
	return html.replace(/<[^>]*>/g, "");
}

function slugify(text: string): string {
	return text
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, "")
		.replace(/[\s_]+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
}

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

const renderGenerations = new Map<string, number>();

export async function renderMarkdown(
	source: string,
	path?: string,
): Promise<{ html: string; generation: number; headings: TocHeading[] }> {
	const key = path ?? "";
	const generation = (renderGenerations.get(key) ?? 0) + 1;
	renderGenerations.set(key, generation);

	const hl = await getHighlighter();

	if (!loadedLangsSet) {
		loadedLangsSet = new Set(hl.getLoadedLanguages() as string[]);
	}

	const headings: TocHeading[] = [];
	const slugCounts = new Map<string, number>();

	const md = new Marked();
	md.use({
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
			heading({ text, depth }) {
				const plainText = stripHtmlTags(text);
				let slug = slugify(plainText) || `heading-${depth}`;
				const count = slugCounts.get(slug) ?? 0;
				slugCounts.set(slug, count + 1);
				if (count > 0) slug = `${slug}-${count}`;

				headings.push({ text: plainText, level: depth, id: slug });
				return `<h${depth} id="${escapeHtml(slug)}">${text}</h${depth}>`;
			},
		},
	});

	const html = await md.parse(source);
	return { html, generation, headings };
}

export function clearGeneration(path: string): void {
	renderGenerations.delete(path);
}

export function isLatestRender(generation: number, path?: string): boolean {
	const key = path ?? "";
	return generation === renderGenerations.get(key);
}

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}
