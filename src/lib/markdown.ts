import { Marked } from "marked";
import markedKatex from "marked-katex-extension";
import markedFootnote from "marked-footnote";
import { markedEmoji } from "marked-emoji";
import { gemoji } from "gemoji";
import katex from "katex";
import {
	createCssVariablesTheme,
	createHighlighter,
	type Highlighter,
} from "shiki";
import { sanitizeHtml, type SanitizedHtml } from "./sanitize-html";

export interface TocHeading {
	text: string;
	level: number;
	id: string;
}

function stripHtmlTags(html: string): string {
	return html.replace(/<[^>]*>/g, "");
}

/**
 * Namespace prefix for every generated heading id.
 *
 * NOT cosmetic — without it, headings silently lose their anchors. DOMPurify's
 * DOM-clobbering protection strips `id` values that collide with a property of
 * `document`, because an injected `id="cookie"` shadows `document.cookie`.
 * That is a real attack and the protection stays on.
 *
 * The cost is that ordinary headings collide too. MEASURED against this repo's
 * config: `title`, `body`, `head`, `forms`, `images`, `links`, `location`,
 * `cookie`, `scripts`, `embeds`, `name` and `length` are all stripped — so a
 * document whose first heading is `# Title` loses its ToC entry, its
 * scroll-spy tracking, and its scroll restore, with nothing reporting an error.
 *
 * Prefixing at the SOURCE rather than reaching for DOMPurify's
 * `SANITIZE_NAMED_PROPS` keeps `TocHeading.id` and the DOM id identical by
 * construction — `FloatingDock.svelte:20` and `+page.svelte:153` both resolve
 * `#${CSS.escape(id)}` from that array, so the two must never diverge. The
 * `user-content-` spelling is the same convention GitHub uses on rendered
 * markdown, for exactly this reason.
 */
const HEADING_ID_PREFIX = "user-content-";

function slugify(text: string): string {
	const slug = text
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, "")
		.replace(/[\s_]+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
	return slug ? `${HEADING_ID_PREFIX}${slug}` : "";
}

const emojiMap: Record<string, string> = {};
for (const entry of gemoji) {
	for (const name of entry.names) {
		emojiMap[name] = entry.emoji;
	}
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
	// `trust: false` is KaTeX's default, stated explicitly because it is a
	// security control: it refuses \href, \url and \htmlClass, which would
	// otherwise let LaTeX in an untrusted document emit arbitrary links and
	// class names. Relying on an undeclared upstream default for that is the
	// same single-control pattern this whole change exists to remove — and a
	// KaTeX major bump could flip it without any signal here.
	md.use(markedKatex({ throwOnError: false, nonStandard: true, trust: false }));
	md.use(markedFootnote());
	md.use(markedEmoji({
		emojis: emojiMap,
		renderer: (token) => token.emoji,
	}));
	md.use({
		renderer: {
			code({ text, lang }) {
				if (lang === "mermaid") {
					return `<div class="mermaid-diagram">${escapeHtml(text)}</div>`;
				}
				if (lang === "math" || lang === "katex") {
					try {
						// `trust: false` for the same reason as the inline path above.
						return `<div class="katex-block">${katex.renderToString(text, { displayMode: true, throwOnError: false, trust: false })}</div>`;
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
			heading({ tokens, depth }) {
				const rendered = this.parser.parseInline(tokens);
				const plainText = stripHtmlTags(rendered);
				// The fallback carries the same prefix as `slugify`'s output — a
				// heading with no slug-able characters must still get an id the
				// sanitizer keeps.
				let slug = slugify(plainText) || `${HEADING_ID_PREFIX}heading-${depth}`;
				const count = currentSlugCounts.get(slug) ?? 0;
				currentSlugCounts.set(slug, count + 1);
				if (count > 0) slug = `${slug}-${count}`;

				currentHeadings.push({ text: plainText, level: depth, id: slug });
				return `<h${depth} id="${escapeHtml(slug)}">${rendered}</h${depth}>`;
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
): Promise<{ html: SanitizedHtml; generation: number; headings: TocHeading[] }> {
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
	// THE choke point. Every consumer of `html` — the page's {@html}, the theme
	// preview's shadow root, the Storybook seed — receives an already-sanitized
	// value, and the `SanitizedHtml` return type means a future consumer cannot
	// opt out or forget. See `sanitize-html.ts` for why it lives here and not at
	// the injection sites. This runs on live-reload re-renders too, which is
	// correct: a file edited on disk is fresh untrusted input.
	const html = sanitizeHtml(await md.parse(source));
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
