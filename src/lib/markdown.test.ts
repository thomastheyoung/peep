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
