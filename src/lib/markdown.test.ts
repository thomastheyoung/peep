import { describe, it, expect } from "vitest";
import { renderMarkdown, isLatestRender } from "./markdown";

describe("renderMarkdown", () => {
	it("renders basic markdown to HTML", async () => {
		const { html } = await renderMarkdown("# Hello\n\nWorld");
		expect(html).toContain("<h1");
		expect(html).toContain("Hello");
		expect(html).toContain("<p>World</p>");
	});

	it("renders inline formatting", async () => {
		const { html } = await renderMarkdown("**bold** and *italic*");
		expect(html).toContain("<strong>bold</strong>");
		expect(html).toContain("<em>italic</em>");
	});

	it("renders links", async () => {
		const { html } = await renderMarkdown("[click](https://example.com)");
		expect(html).toContain('href="https://example.com"');
		expect(html).toContain("click");
	});

	it("renders lists", async () => {
		const { html } = await renderMarkdown("- one\n- two\n- three");
		expect(html).toContain("<ul>");
		expect(html).toContain("<li>one</li>");
	});

	it("syntax-highlights known languages", async () => {
		const { html } = await renderMarkdown('```typescript\nconst x: number = 1;\n```');
		// Shiki wraps in <pre class="shiki ...">
		expect(html).toContain("shiki");
		expect(html).toContain("<pre");
		expect(html).toContain("<code");
	});

	it("falls back to plain code for unknown languages", async () => {
		const { html } = await renderMarkdown('```brainfuck\n+++[>++<-]\n```');
		expect(html).toContain('class="language-brainfuck"');
		expect(html).toContain("+++[&gt;++&lt;-]");
	});

	it("escapes HTML in unknown-language code blocks", async () => {
		const { html } = await renderMarkdown('```unknown\n<script>alert("xss")</script>\n```');
		expect(html).not.toContain("<script>");
		expect(html).toContain("&lt;script&gt;");
	});

	it("handles empty input", async () => {
		const { html } = await renderMarkdown("");
		expect(html).toBe("");
	});

	it("renders tables", async () => {
		const md = "| A | B |\n|---|---|\n| 1 | 2 |";
		const { html } = await renderMarkdown(md);
		expect(html).toContain("<table>");
		expect(html).toContain("<td>1</td>");
	});

	it("renders blockquotes", async () => {
		const { html } = await renderMarkdown("> quoted text");
		expect(html).toContain("<blockquote>");
	});

	it("renders images", async () => {
		const { html } = await renderMarkdown("![alt](image.png)");
		expect(html).toContain("<img");
		expect(html).toContain('alt="alt"');
		expect(html).toContain('src="image.png"');
	});
});

describe("isLatestRender (generation tracking)", () => {
	it("returns true for the most recent render", async () => {
		const { generation } = await renderMarkdown("test", "/tmp/test.md");
		expect(isLatestRender(generation, "/tmp/test.md")).toBe(true);
	});

	it("returns false for stale renders", async () => {
		const first = await renderMarkdown("first", "/tmp/stale.md");
		await renderMarkdown("second", "/tmp/stale.md");
		expect(isLatestRender(first.generation, "/tmp/stale.md")).toBe(false);
	});

	it("increments generation on each call", async () => {
		const a = await renderMarkdown("a", "/tmp/inc.md");
		const b = await renderMarkdown("b", "/tmp/inc.md");
		expect(b.generation).toBeGreaterThan(a.generation);
	});

	it("tracks generations independently per path", async () => {
		const a = await renderMarkdown("a", "/tmp/fileA.md");
		const b = await renderMarkdown("b", "/tmp/fileB.md");
		expect(isLatestRender(a.generation, "/tmp/fileA.md")).toBe(true);
		expect(isLatestRender(b.generation, "/tmp/fileB.md")).toBe(true);
	});
});

/**
 * End-to-end assertions over the REAL pipeline (markdown-viewer-r74).
 *
 * These live here rather than in `sanitize-html.test.ts` deliberately. That
 * suite feeds the sanitizer hand-written HTML, which is why it did not catch
 * the heading-id regression below: `id="my-slug"` is not a `document`
 * property, so it survived while the id the pipeline ACTUALLY generates for
 * `# Title` did not. Only rendering real markdown exercises the interaction
 * between the slug generator and the sanitizer.
 */
describe("renderMarkdown: sanitization (r74)", () => {
	it("strips script, event handlers, frames and javascript: URLs", async () => {
		const { html } = await renderMarkdown(
			[
				"Raw <script>alert(1)</script> html",
				"",
				"<img src=x onerror=alert(2)>",
				"",
				'<iframe src="https://evil.example"></iframe>',
				"",
				"[click](javascript:alert(3))",
			].join("\n"),
		);
		expect(html).not.toMatch(/<script/i);
		expect(html).not.toMatch(/onerror/i);
		expect(html).not.toMatch(/<iframe/i);
		// Pure CommonMark link syntax with no raw HTML — this is why escaping
		// HTML instead of sanitizing would NOT have fixed the issue.
		expect(html).not.toMatch(/javascript:/i);
	});

	it("preserves the inline HTML that test.md exercises", async () => {
		const { html } = await renderMarkdown(
			"Use <kbd>Cmd</kbd> and <mark>highlight</mark>.\n\n" +
				"<details><summary>More</summary>\n\n<p>body</p>\n\n</details>",
		);
		expect(html).toContain("<kbd>");
		expect(html).toContain("<mark>");
		expect(html).toContain("<details>");
	});

	it("preserves shiki, mermaid and KaTeX output", async () => {
		const { html } = await renderMarkdown(
			"```js\nconst x = 1;\n```\n\n" +
				"```mermaid\ngraph TD\n  A-->B\n```\n\n" +
				"```math\n\\frac{a}{b}\n```",
		);
		expect(html).toContain('class="shiki');
		expect(html).toContain("mermaid-diagram");
		// `annotation` is the KaTeX MathML payload DOMPurify strips without
		// `ADD_TAGS` — and the equation renders correctly WITHOUT it, so this
		// is the only assertion that can catch its loss.
		expect(html).toContain("<annotation");
	});

	it("keeps heading ids that collide with document properties", async () => {
		// REGRESSION, found end to end: `# Title` rendered as `<h1>Title</h1>`
		// with NO id, because DOMPurify's DOM-clobbering protection strips an
		// `id` shadowing `document.title`. That silently breaks the ToC entry,
		// scroll-spy, and scroll restore for a heading as ordinary as "Title".
		//
		// The heading text -> DOM id relationship is what matters here; the
		// exact prefix is an implementation detail of `markdown.ts`.
		for (const word of ["Title", "Body", "Links", "Location", "Name", "Images"]) {
			const { html, headings } = await renderMarkdown(`# ${word}\n\ntext`);
			expect(headings).toHaveLength(1);
			const id = headings[0]!.id;
			expect(id, `no slug generated for "${word}"`).toBeTruthy();
			// The id in the emitted HTML must match the one handed to the ToC —
			// FloatingDock and scroll restore resolve `#${CSS.escape(id)}`
			// against the DOM using exactly this value.
			expect(html, `heading id lost for "${word}"`).toContain(`id="${id}"`);
		}
	});

	it("gives every heading in a document a resolvable id", async () => {
		const { html, headings } = await renderMarkdown(
			"# Title\n\n## Overview\n\n### Links\n\n#### 日本語\n\n##### !!!",
		);
		expect(headings.length).toBe(5);
		for (const h of headings) {
			expect(h.id, `empty id for heading "${h.text}"`).toBeTruthy();
			expect(html, `id "${h.id}" missing from HTML`).toContain(`id="${h.id}"`);
		}
	});
});
