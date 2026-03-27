import { Marked } from "marked";
import markedKatex from "marked-katex-extension";
import katex from "katex";
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

// Per-render heading state — reset before each render call
let currentHeadings: TocHeading[] = [];
let currentSlugCounts = new Map<string, number>();

// Module-level Marked singleton — configured once, reused across renders.
// The heading renderer reads from `currentHeadings`/`currentSlugCounts` which
// are reset before each call to `renderMarkdown()`.
let mdInstance: Marked | null = null;

function getMd(): Marked {
	if (mdInstance) return mdInstance;
	const md = new Marked();
	md.use(markedKatex({ throwOnError: false, nonStandard: true }));
	md.use({
		renderer: {
			code({ text, lang }) {
				if (lang === "math" || lang === "katex") {
					try {
						return `<div class="katex-block">${katex.renderToString(text, { displayMode: true, throwOnError: false })}</div>`;
					} catch {
						return `<pre><code class="language-math">${escapeHtml(text)}</code></pre>`;
					}
				}
				const language = lang || "text";
				try {
					if (loadedLangsSet?.has(language)) {
						return cachedHighlighter!.codeToHtml(text, {
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
				const count = currentSlugCounts.get(slug) ?? 0;
				currentSlugCounts.set(slug, count + 1);
				if (count > 0) slug = `${slug}-${count}`;

				currentHeadings.push({ text: plainText, level: depth, id: slug });
				return `<h${depth} id="${escapeHtml(slug)}">${text}</h${depth}>`;
			},
		},
	});
	mdInstance = md;
	return md;
}

let cachedHighlighter: Highlighter | null = null;

export async function renderMarkdown(
	source: string,
	path?: string,
): Promise<{ html: string; generation: number; headings: TocHeading[] }> {
	const key = path ?? "";
	const generation = (renderGenerations.get(key) ?? 0) + 1;
	renderGenerations.set(key, generation);

	if (!cachedHighlighter) {
		cachedHighlighter = await getHighlighter();
		loadedLangsSet = new Set(cachedHighlighter.getLoadedLanguages() as string[]);
	}

	// Reset per-render heading state
	currentHeadings = [];
	currentSlugCounts = new Map<string, number>();

	const md = getMd();
	const html = await md.parse(source);
	const headings = currentHeadings;
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
