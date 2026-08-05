/**
 * Tests for the rendered-markdown HTML sanitizer (markdown-viewer-r74).
 *
 * ENVIRONMENT CAPABILITY, MEASURED — READ BEFORE ADDING ASSERTIONS
 * -----------------------------------------------------------------
 * DOMPurify parses with whatever DOM the environment provides. Under vitest
 * that is jsdom, whose HTML parser is NOT the parser that ships in the app's
 * WKWebView. That difference is not academic: the entire mXSS attack class
 * exists because real engines re-interpret a serialized tree differently than
 * they parsed it, and jsdom's parser/serializer pair is self-consistent in
 * ways real engines are not.
 *
 * So this file asserts STRUCTURAL, engine-independent facts only:
 *   - the allow-list keeps what the render pipeline actually emits
 *   - the allow-list drops what a hostile document would inject
 *   - the config object has the shape the pipeline depends on
 *
 * These belong in the REAL-BROWSER harness (`scripts/sanitizer-attack.mjs`,
 * `pnpm test:sanitizer`, gated in CI on Chromium AND on real Apple WebKit) and
 * a green result here proves NOTHING about them:
 *
 *   1. mXSS namespace confusion (`mglyph`/`mtext`/`annotation-xml`
 *      integration points). jsdom does not faithfully implement HTML5
 *      foreign-content integration-point rules; the payload's danger IS the
 *      parser quirk, so jsdom parses it "sensibly" and reports clean. The
 *      case below is kept as a smoke test and labelled as such.
 *   2. Serialize -> reparse divergence. `{@html}` reparses the sanitized
 *      string via the engine's own parser. Testing that round trip here
 *      measures jsdom agreeing with itself.
 *   3. `<style>` surviving in SVG context but not HTML context — the branch
 *      mermaid's ~4KB per-diagram stylesheet depends on.
 *   4. `contain: content` overlay/clickjack containment. jsdom implements no
 *      layout: `getBoundingClientRect` returns zeros and `elementFromPoint`
 *      does not exist, so every such assertion is unfalsifiable.
 *   5. Cascade outcomes (`@layer`, `var()`), per this repo's existing note in
 *      CLAUDE.md.
 *
 * PROBE RESULTS (measured against this repo's actual dompurify 3.4.13 +
 * jsdom 29 install while writing this suite, not re-run automatically):
 *   - KaTeX emits: annotation, math, mfrac, mi, mrow, semantics, span.
 *   - DOMPurify's DEFAULT config and its explicit MathML profile BOTH strip
 *     `<semantics>` and `<annotation>` (`removed.length === 2`). Only
 *     `ADD_TAGS` restores them. This is why `ADD_TAGS` is not optional.
 *   - DOMPurify keeps `<form>`/`<button>` by default; both are forbidden
 *     explicitly. `<input>` is deliberately NOT forbidden — GFM task lists
 *     need it.
 */
import { describe, it, expect } from "vitest";
import { sanitizeHtml, trustedConstant, SANITIZE_CONFIG } from "./sanitize-html";

/** Parse sanitizer output so assertions run against a tree, not a substring. */
function parse(html: string): Document {
	return new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
}

function hasEventHandlerAttr(doc: Document): boolean {
	return [...doc.querySelectorAll("*")].some((el) =>
		[...el.attributes].some((a) => a.name.toLowerCase().startsWith("on")),
	);
}

describe("sanitizeHtml: what the render pipeline emits must survive", () => {
	// Each case below is a shape produced by `markdown.ts`. If one starts
	// failing, a downstream consumer breaks — the comment names which.

	it("keeps the mermaid container class AND its exact textContent", () => {
		// `mermaid.ts` reads the diagram source from `el.textContent`. Any
		// entity re-encoding here silently breaks every diagram, so this
		// asserts the text round-trips byte-identically, not merely that the
		// element survived.
		const source = 'graph TD\n  A["a & b"] --> B';
		const html = `<div class="mermaid-diagram">graph TD\n  A[&quot;a &amp; b&quot;] --&gt; B</div>`;
		const el = parse(sanitizeHtml(html)).querySelector(".mermaid-diagram");
		expect(el).not.toBeNull();
		expect(el?.textContent).toBe(source);
	});

	it("keeps heading ids", () => {
		// `scroll-spy.ts` selects `h1[id]..h6[id]`, and tab-switch scroll
		// restore resolves `#<id>` via `CSS.escape`. Stripping `id` breaks both.
		const doc = parse(sanitizeHtml(`<h2 id="user-content-my-slug">Title <code>x</code></h2>`));
		expect(doc.querySelector("h2")?.id).toBe("user-content-my-slug");
	});

	it("keeps ids for headings whose text collides with a document property", () => {
		// REGRESSION. DOMPurify's DOM-clobbering protection strips an `id` that
		// shadows a property of `document` — so `# Title` produced `<h1>` with
		// NO id, silently killing its ToC entry, scroll-spy tracking and scroll
		// restore. Found by rendering real markdown end to end; the hand-written
		// `id="my-slug"` case above passed throughout, because "my-slug" is not
		// a document property.
		//
		// `markdown.ts` prefixes every generated id (`HEADING_ID_PREFIX`) so the
		// collision cannot occur. These are the words measured as clobbering.
		for (const word of [
			"title", "body", "head", "forms", "images", "links",
			"location", "cookie", "scripts", "embeds", "name", "length",
		]) {
			const id = `user-content-${word}`;
			const doc = parse(sanitizeHtml(`<h1 id="${id}">${word}</h1>`));
			expect(doc.querySelector("h1")?.id, `id stripped for heading "${word}"`).toBe(id);
		}
	});

	it("keeps shiki's class and inline custom-property styles", () => {
		// Shiki's CSS-variables theme puts `color:var(--shiki-*)` in a `style`
		// attribute on every token span — that is how themes control code
		// colours. A `FORBID_ATTR: ["style"]` would kill all highlighting, and
		// nothing else in the suite would notice.
		const html =
			`<pre class="shiki css-variables" style="background:#000"><code>` +
			`<span style="color:var(--shiki-token-keyword)">const</span></code></pre>`;
		const doc = parse(sanitizeHtml(html));
		expect(doc.querySelector("pre.shiki")).not.toBeNull();
		expect(doc.querySelector("pre")?.getAttribute("style")).toContain("background");
		expect(doc.querySelector("span")?.getAttribute("style")).toContain("--shiki");
		// `copy-code.ts` requires a `code` element inside the `pre`.
		expect(doc.querySelector("pre > code")).not.toBeNull();
	});

	it("keeps KaTeX's MathML semantics and annotation", () => {
		// THE highest-ranked risk in this change. Both elements are stripped by
		// DOMPurify's default config AND by its MathML profile; only `ADD_TAGS`
		// keeps them. They carry the machine-readable LaTeX source used by
		// assistive tech, and the equation renders pixel-perfectly without them
		// — so no visual check can catch the regression.
		const html =
			`<math><semantics><mrow><mi>a</mi></mrow>` +
			`<annotation encoding="application/x-tex">a</annotation></semantics></math>`;
		const doc = parse(sanitizeHtml(html));
		expect(doc.querySelector("semantics")).not.toBeNull();
		expect(doc.querySelector("annotation")?.getAttribute("encoding")).toBe(
			"application/x-tex",
		);
	});

	it("keeps footnote anchors and the footnotes section", () => {
		const html =
			`<sup id="fnref-1"><a href="#fn-1">1</a></sup>` +
			`<section class="footnotes"><ol><li id="fn-1">note</li></ol></section>`;
		const doc = parse(sanitizeHtml(html));
		expect(doc.querySelector("sup#fnref-1")).not.toBeNull();
		expect(doc.querySelector("section.footnotes")).not.toBeNull();
	});

	it("keeps the raw inline HTML that test.md exercises", () => {
		// `test.md` deliberately covers these across six sections. Escaping
		// rather than sanitizing was rejected partly because it would turn all
		// of them into literal angle brackets — this pins that decision.
		const html =
			`<kbd>Cmd</kbd><mark>hi</mark>` +
			`<dl><dt>term</dt><dd>def</dd></dl>` +
			`<details><summary>More</summary><p>body</p></details>` +
			`<div style="padding:1rem"><figure><blockquote>q</blockquote>` +
			`<figcaption>c</figcaption></figure></div>`;
		const doc = parse(sanitizeHtml(html));
		for (const sel of ["kbd", "mark", "dl", "dt", "dd", "details", "summary", "figure", "figcaption"]) {
			expect(doc.querySelector(sel), `${sel} was stripped`).not.toBeNull();
		}
		expect(doc.querySelector("div")?.getAttribute("style")).toContain("padding");
	});

	it("keeps GFM task-list checkboxes", () => {
		// `input` is deliberately absent from FORBID_TAGS for exactly this.
		const doc = parse(
			sanitizeHtml(`<ul><li><input type="checkbox" disabled checked> done</li></ul>`),
		);
		const input = doc.querySelector("input");
		expect(input).not.toBeNull();
		expect(input?.getAttribute("type")).toBe("checkbox");
	});

	it("keeps tables and images", () => {
		const doc = parse(
			sanitizeHtml(
				`<table><thead><tr><th align="left">h</th></tr></thead>` +
					`<tbody><tr><td>c</td></tr></tbody></table>` +
					`<img src="diagram.png" alt="a diagram" title="t">`,
			),
		);
		expect(doc.querySelector("table th")).not.toBeNull();
		expect(doc.querySelector("img")?.getAttribute("alt")).toBe("a diagram");
	});
});

describe("sanitizeHtml: what a hostile document injects must not survive", () => {
	it("removes script elements", () => {
		const doc = parse(sanitizeHtml(`<p>ok</p><script>alert(1)</script>`));
		expect(doc.querySelector("script")).toBeNull();
		expect(doc.querySelector("p")?.textContent).toBe("ok");
	});

	it("removes every event-handler attribute", () => {
		const html =
			`<img src=x onerror=alert(1)><div onclick=alert(2)>d</div>` +
			`<svg onload=alert(3)><circle r="1"></circle></svg>` +
			`<body onload=alert(4)>`;
		expect(hasEventHandlerAttr(parse(sanitizeHtml(html)))).toBe(false);
	});

	it("removes javascript: URLs from href and xlink:href", () => {
		const doc = parse(
			sanitizeHtml(
				`<a href="javascript:alert(1)">x</a>` +
					`<svg><a xlink:href="javascript:alert(2)"><text>y</text></a></svg>`,
			),
		);
		for (const el of doc.querySelectorAll("*")) {
			for (const attr of el.attributes) {
				expect(attr.value.toLowerCase()).not.toContain("javascript:");
			}
		}
	});

	it("removes framing and plugin elements", () => {
		const doc = parse(
			sanitizeHtml(
				`<iframe src="https://evil.example"></iframe>` +
					`<object data="x"></object><embed src="y">`,
			),
		);
		expect(doc.querySelector("iframe")).toBeNull();
		expect(doc.querySelector("object")).toBeNull();
		expect(doc.querySelector("embed")).toBeNull();
	});

	it("removes forms so a document cannot present a credential prompt", () => {
		// Markdown never legitimately emits a form, and one rendered inside a
		// trusted-looking document is a phishing surface. DOMPurify keeps forms
		// by default — this is FORBID_TAGS doing real work, not belt-and-braces.
		const doc = parse(
			sanitizeHtml(
				`<form action="https://evil.example"><input name="password" type="password">` +
					`<button>Sign in</button></form>`,
			),
		);
		expect(doc.querySelector("form")).toBeNull();
		expect(doc.querySelector("button")).toBeNull();
		// A residual bare input has no submission target and no name.
		expect(doc.querySelector("input")?.getAttribute("name")).toBeNull();
	});

	it("removes document-scope hijack elements", () => {
		// `<base href>` re-points every relative URL in the document;
		// `<meta http-equiv=refresh>` navigates away. `base-uri 'none'` in the
		// CSP is the second layer behind this one.
		const doc = parse(
			sanitizeHtml(
				`<base href="https://evil.example/">` +
					`<meta http-equiv="refresh" content="0;url=https://evil.example">`,
			),
		);
		expect(doc.querySelector("base")).toBeNull();
		expect(doc.querySelector("meta")).toBeNull();
	});

	it("contains a classic mXSS payload (SMOKE TEST ONLY — see file header)", () => {
		// This payload's danger is a real-engine parser quirk. jsdom does not
		// reproduce that quirk, so a pass here is NOT evidence of containment
		// in WKWebView. The real assertion lives in scripts/sanitizer-attack.mjs,
		// which sanitizes and then RE-PARSES via innerHTML in both engines.
		const payload =
			`<math><mtext><table><mglyph><style><!--</style>` +
			`<img title="--><img src=x onerror=alert(1)>"></math>`;
		const doc = parse(sanitizeHtml(payload));
		expect(doc.querySelector("script")).toBeNull();
		expect(hasEventHandlerAttr(doc)).toBe(false);
	});
});

describe("sanitizeHtml: contract", () => {
	it("is idempotent", () => {
		// Live reload re-renders on every save; a sanitizer that mutated its own
		// output would let a document drift on each pass.
		const corpus = [
			`<h2 id="s">H</h2>`,
			`<div class="mermaid-diagram">graph TD</div>`,
			`<details><summary>s</summary><p>b</p></details>`,
			`<img src=x onerror=alert(1)>`,
			`<math><semantics><annotation>a</annotation></semantics></math>`,
			`<pre class="shiki"><code><span style="color:var(--shiki-x)">c</span></code></pre>`,
		];
		for (const input of corpus) {
			const once = sanitizeHtml(input);
			expect(sanitizeHtml(once), `not idempotent for: ${input}`).toBe(once);
		}
	});

	it("never throws, including on malformed input", () => {
		for (const input of ["", "<<<>>>", "<div", "<p>unclosed", " <b>x</b>"]) {
			expect(() => sanitizeHtml(input)).not.toThrow();
		}
	});
});

describe("SANITIZE_CONFIG: shape the pipeline depends on", () => {
	// These assert the config OBJECT, not behaviour, so that a well-meaning
	// "hardening" edit fails loudly here with the reason attached rather than
	// silently breaking a feature nobody tests visually.

	it("adds the KaTeX MathML tags DOMPurify would otherwise strip", () => {
		expect(SANITIZE_CONFIG.ADD_TAGS).toContain("semantics");
		expect(SANITIZE_CONFIG.ADD_TAGS).toContain("annotation");
	});

	it("forbids form controls but NOT input", () => {
		expect(SANITIZE_CONFIG.FORBID_TAGS).toContain("form");
		expect(SANITIZE_CONFIG.FORBID_TAGS).toContain("button");
		// GFM task lists render as a disabled checkbox — forbidding `input`
		// would break a real markdown feature.
		expect(SANITIZE_CONFIG.FORBID_TAGS).not.toContain("input");
	});

	it("does not forbid the style attribute", () => {
		// Would break all shiki syntax highlighting AND test.md's styled div.
		expect(SANITIZE_CONFIG.FORBID_ATTR).not.toContain("style");
	});

	it("enables the MathML and SVG profiles KaTeX needs", () => {
		expect(SANITIZE_CONFIG.USE_PROFILES).toMatchObject({
			html: true,
			svg: true,
			mathMl: true,
		});
	});

	it("returns a string rather than a DOM node", () => {
		// The `{@html}` sinks require a string. `RETURN_DOM`/`RETURN_DOM_FRAGMENT`
		// would change `sanitize()`'s return type and break every consumer.
		expect(typeof sanitizeHtml("<p>x</p>")).toBe("string");
	});
});

describe("trustedConstant", () => {
	it("passes its input through unchanged", () => {
		// It is an assertion about provenance, not a transform. If it ever
		// modified its input, callers would silently get different markup than
		// the literal they wrote.
		const literal = `<h1>Heading</h1><pre><code>const x = 1;</code></pre>`;
		expect(trustedConstant(literal)).toBe(literal);
	});
});
