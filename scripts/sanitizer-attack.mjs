/**
 * Real-browser adversarial harness for the user-theme CSS sanitizer.
 *
 * WHY THIS EXISTS AND WHY THE VITEST SUITE IS NOT ENOUGH
 * ------------------------------------------------------
 * `sanitize-theme-css.test.ts` runs under jsdom, which parses enough CSSOM to
 * exercise the structural rebuild — but two of the five rules have NO real
 * enforcement coverage there, and one of them looks fully covered:
 *
 *   - `@property`: jsdom has no `CSSPropertyRule` global and discards the
 *     at-rule during parsing, before the sanitizer ever sees it. Mutation-
 *     tested: replacing `isPropertyRule` with `return false` leaves the entire
 *     vitest suite green. A rule whose deletion no test notices is not tested.
 *   - `@font-face` `src: url(...)`: jsdom's declaration parser silently drops
 *     properties it does not recognise, so the "url survives" requirement
 *     cannot be asserted there at all. Two shipped themes (neo-brutalist,
 *     minimal-mono) depend on it.
 *
 * More fundamentally, the thing being defended is a CASCADE outcome — "app
 * chrome still paints its own colour" — and jsdom models neither `@layer` nor
 * `var()`. So this harness does not assert on the sanitizer's output string.
 * It renders a fixture mirroring the real app, injects the attack CSS, and
 * asks the engine what colour the titlebar actually is.
 *
 * Both engines are exercised because they disagree in ways that matter:
 * `CSS.supports("at-rule(@scope)")` is true in Chromium and false in WebKit
 * while `@scope` works in both, which is why the sanitizer's capability probe
 * parses a fixture instead of asking `CSS.supports`.
 *
 * Usage:
 *   node scripts/sanitizer-attack.mjs
 *   node scripts/sanitizer-attack.mjs --engine chromium
 *
 * Exit codes: 0 = every attack contained and every keeper survived,
 * 1 = a containment failure, 2 = the run itself was invalid.
 */

import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { chromium, webkit } from "playwright";

// This file is ESM, so `require` is not ambient — but `require.resolve` is the
// only API that answers "where did the package manager actually put this?".
const require = createRequire(import.meta.url);

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(REPO, "src/lib/themes/sanitize-theme-css.ts");
const HTML_SRC = join(REPO, "src/lib/sanitize-html.ts");
const THEMES_DIR = join(REPO, "src/lib/themes/themes");

const KEEPERS = [
	"github-dark",
	"github-light",
	"neo-brutalist",
	"pastel-dream",
	"swiss-design",
	"candy-pop",
	"minimal-mono",
];

/**
 * Load the REAL sanitizer source as browser-executable JS.
 *
 * Types are stripped by Node itself (`--experimental-strip-types`, the same
 * mechanism `scripts/extract-theme-colors.ts` relies on) rather than by
 * regexes here. That matters more than convenience: a hand-rolled stripper is
 * a second, weaker TypeScript parser, and any place it disagrees with the real
 * one silently feeds this harness DIFFERENT code than the app ships — while
 * still reporting green. Same failure shape as the string-sanitizing design
 * this module exists to replace.
 *
 * The module cannot simply be imported here: it is browser-only by design
 * (constructed-stylesheet CSSOM has no Node equivalent). So Node parses and
 * strips it, and the resulting text is injected into the page.
 */
function loadSanitizerAsScript() {
	if (!existsSync(SRC)) {
		console.error(`Sanitizer source not found: ${SRC}`);
		process.exit(2);
	}
	let js;
	try {
		js = execFileSync(
			process.execPath,
			[
				"--experimental-strip-types",
				"--eval",
				`import{stripTypeScriptTypes}from"node:module";` +
					`import{readFileSync}from"node:fs";` +
					`process.stdout.write(stripTypeScriptTypes(readFileSync(process.argv[1],"utf8")));`,
				SRC,
			],
			{ encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
		);
	} catch (err) {
		console.error(`Could not strip types from ${SRC}:\n${err.stderr || err.message}`);
		process.exit(2);
	}
	// `export` has no meaning in a classic script tag; the declarations become
	// page globals instead. Nothing else about the source is altered.
	return js.replace(/^export (const|function|type) /gm, "$1 ");
}

/**
 * Locate the `esbuild` binary through Node's resolver.
 *
 * NOT `node_modules/.bin/esbuild`. That path is a hoisting artifact: under
 * pnpm's isolated layout a package lives at a content-addressed store path and
 * only appears in the flat `.bin/` when something hoists it there. It happened
 * to be present locally because Vite pulls esbuild in transitively — and was
 * ABSENT on a clean CI install, which is exactly the state a developer machine
 * cannot reproduce. `esbuild` is now an explicit devDependency (this harness
 * uses it directly, so it should declare it rather than borrow Vite's copy),
 * and resolving through `require.resolve` means the lookup follows the same
 * rules the package manager guarantees.
 */
function esbuildBin() {
	try {
		// The package root, then its declared binary — `require.resolve` on the
		// package itself lands on its main entry, not the executable.
		const pkg = require.resolve("esbuild/package.json");
		return join(dirname(pkg), "bin", "esbuild");
	} catch {
		console.error("esbuild could not be resolved — run `pnpm install`");
		process.exit(2);
	}
}

/**
 * Load the REAL HTML sanitizer as browser-executable JS (peep-r74).
 *
 * Unlike the CSS sanitizer above, this module imports DOMPurify, so stripping
 * types is not enough — the import has to be resolved. esbuild (already a
 * transitive dev dependency via vite) bundles it to an IIFE exposing `SH`.
 *
 * Bundling the REAL module, rather than re-declaring its config here, is the
 * point: a hand-copied allow-list is a second source of truth, and the moment
 * it drifts this harness reports green on a configuration the app does not
 * ship. Same reasoning as the type-stripping above.
 */
function loadHtmlSanitizerAsScript() {
	if (!existsSync(HTML_SRC)) {
		console.error(`HTML sanitizer source not found: ${HTML_SRC}`);
		process.exit(2);
	}
	try {
		return execFileSync(
			esbuildBin(),
			[
				HTML_SRC,
				"--bundle",
				"--format=iife",
				"--global-name=SH",
				"--platform=browser",
				"--log-level=warning",
			],
			{ encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
		);
	} catch (err) {
		console.error(`Could not bundle ${HTML_SRC}:\n${err.stderr || err.message}`);
		process.exit(2);
	}
}

/**
 * Read the `securityLevel` the app ACTUALLY configures out of `mermaid.ts`.
 *
 * This indirection is the whole point of the mermaid assertion. Hardcoding
 * `"strict"` in this harness would test a fact about MERMAID ("strict mode
 * works") rather than a fact about THIS REPO ("we configure it strictly") —
 * and those are indistinguishable while green. Verified by mutation: with the
 * literal hardcoded here, flipping mermaid.ts to `"loose"` left the suite
 * passing, which is precisely the vacuous-security-test shape this project has
 * shipped once before. Sourcing the value means that flip now fails.
 */
function mermaidSecurityLevel() {
	const src = join(REPO, "src/lib/mermaid.ts");
	if (!existsSync(src)) {
		console.error(`mermaid source not found: ${src}`);
		process.exit(2);
	}
	// Anchored to the start of a line (allowing only leading whitespace) so a
	// COMMENT mentioning `securityLevel: "strict"` cannot satisfy this check.
	// mermaid.ts has exactly such a comment further down explaining the trust
	// boundary; without the anchor, deleting the real config line still matched
	// it and the mutation check passed — measured.
	const m = readFileSync(src, "utf8").match(
		/^[ \t]*securityLevel:\s*["']([a-z]+)["']/m,
	);
	if (!m) {
		// Absent is itself a failure: mermaid's default is strict TODAY, but an
		// unstated default is exactly what this assertion exists to forbid.
		console.error(
			`No explicit securityLevel found in ${src} — mermaid's SVG is assigned via innerHTML and its only control must be stated, not inherited.`,
		);
		process.exit(2);
	}
	return m[1];
}

/**
 * Bundle the repo's OWN mermaid so the strict-mode assertion tests the version
 * the app ships, offline, with no network dependency in CI.
 */
function loadMermaidAsScript() {
	try {
		return execFileSync(
			esbuildBin(),
			[
				"--bundle",
				"--format=iife",
				"--global-name=MM",
				"--platform=browser",
				"--log-level=error",
				"--define:process.env.NODE_ENV=\"production\"",
				// Resolved through Node rather than joined onto a hardcoded
				// `node_modules/mermaid/...` path — under pnpm's isolated layout
				// a package's real location is a content-addressed store path,
				// and the flat path only exists when hoisting happens to put it
				// there.
				require.resolve("mermaid/dist/mermaid.esm.mjs"),
			],
			{ encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64 * 1024 * 1024 },
		);
	} catch (err) {
		console.error(`Could not bundle mermaid:\n${(err.stderr || err.message).slice(0, 400)}`);
		process.exit(2);
	}
}

/**
 * mXSS corpus — the assertion that justifies keeping `{@html}`.
 *
 * DOMPurify sanitizes a TREE, serializes it to a string, and `{@html}` hands
 * that string back to the engine to parse again. If serialize+reparse yields a
 * different tree than the one that was sanitized, sanitization is bypassed.
 * That divergence is a property of real HTML parsers; jsdom's parser and
 * serializer agree with each other in ways Blink and WebKit do not, so this
 * class CANNOT be tested in vitest.
 *
 * Each payload is sanitized and then assigned via `innerHTML` — mirroring
 * exactly what `{@html}` does — and the resulting LIVE DOM is inspected. If
 * this suite ever goes red, the decision to keep `{@html}` flips and the fix
 * is DOMPurify's `RETURN_DOM_FRAGMENT` plus a Svelte action.
 */
const MXSS_PAYLOADS = [
	[
		"mglyph/mtext namespace confusion",
		`<math><mtext><table><mglyph><style><!--</style><img title="--><img src=x onerror=alert(1)>"></math>`,
	],
	[
		"annotation-xml integration point",
		`<math><annotation-xml encoding="text/html"><style><!--</style><img title="--><img src=x onerror=alert(1)>"></annotation-xml></math>`,
	],
	[
		"svg foreignObject CDATA breakout",
		`<svg><foreignObject><![CDATA[</foreignObject><img src=x onerror=alert(1)>]]></foreignObject></svg>`,
	],
	[
		"noscript reparse",
		`<noscript><p title="</noscript><img src=x onerror=alert(1)>"></noscript>`,
	],
	[
		"svg style comment breakout",
		`<svg><style><!--</style><img title="--><img src=x onerror=alert(1)>"></svg>`,
	],
	[
		"template nesting",
		`<template><script>alert(1)</script></template><p>after</p>`,
	],
	[
		"form nesting with formaction",
		`<form><math><mtext></form><form><mglyph><style></math><img src=x onerror=alert(1)>`,
	],
];

/**
 * Overlay payloads delivered through MARKDOWN rather than through theme CSS.
 *
 * A colour assertion cannot see a transparent overlay, so these hit-test the
 * titlebar's centre pixel with `elementFromPoint`. `contain: content` on
 * `.content` (see the fixture) is what actually contains them — the same
 * structural defence the theme attacks rely on, re-asserted from the other
 * direction so removing that rule fails both suites.
 */
const OVERLAY_PAYLOADS = [
	[
		"fixed-position chrome spoof",
		`<div style="position:fixed;inset:0 0 auto 0;height:38px;background:red;z-index:2147483647">SPOOF</div>`,
	],
	[
		"invisible full-viewport clickjack",
		`<div style="position:fixed;inset:0;z-index:2147483647;opacity:0.01;background:#000"></div>`,
	],
	[
		"absolutely-positioned negative offset",
		`<div style="position:absolute;top:-100px;left:0;width:100vw;height:200px;background:lime"></div>`,
	],
];

/**
 * Shapes the render pipeline emits that MUST survive, asserted in a real
 * engine. These are regression tests, not security tests: each corresponds to
 * a plausible "hardening" edit that would silently break a feature.
 */
const has = (r, tag) => r.present.some((e) => e.tag === tag);

/**
 * Read the heading-id prefix the app ACTUALLY generates, out of `markdown.ts`.
 *
 * Same reasoning as `mermaidSecurityLevel()`: hardcoding `"user-content-"`
 * here would assert a fact about DOMPurify rather than about this repo, and
 * would keep passing if the prefix were removed — at which point real headings
 * lose their ids and the ToC, scroll-spy and scroll restore break silently.
 * Returning `""` when absent is correct: the fixture then asserts the
 * unprefixed id survives, which is exactly what fails.
 */
function headingIdPrefix() {
	const src = join(REPO, "src/lib/markdown.ts");
	if (!existsSync(src)) {
		console.error(`markdown source not found: ${src}`);
		process.exit(2);
	}
	const m = readFileSync(src, "utf8").match(
		/^const HEADING_ID_PREFIX = ["']([^"']*)["']/m,
	);
	return m ? m[1] : "";
}

const HTML_KEEPERS = [
	{
		label: "shiki inline custom-property styles (FORBID_ATTR:style would kill highlighting)",
		html: `<pre class="shiki css-variables" style="background:#000"><code><span style="color:var(--shiki-token-keyword)">const</span></code></pre>`,
		check: (r) =>
			r.present.some((e) => e.tag === "pre" && e.cls.includes("shiki")) &&
			has(r, "code") &&
			r.present.some((e) => e.tag === "span" && e.style.includes("--shiki")),
	},
	{
		label: "KaTeX MathML semantics + annotation (ADD_TAGS)",
		html: `<math><semantics><mrow><mi>a</mi></mrow><annotation encoding="application/x-tex">a</annotation></semantics></math>`,
		check: (r) => has(r, "semantics") && has(r, "annotation"),
	},
	{
		label: "test.md raw inline HTML (details/dl/kbd/mark/figure)",
		html: `<kbd>Cmd</kbd><mark>m</mark><dl><dt>t</dt><dd>d</dd></dl><details><summary>s</summary><p>b</p></details><figure><blockquote>q</blockquote><figcaption>c</figcaption></figure>`,
		check: (r) =>
			["kbd", "mark", "dl", "dt", "dd", "details", "summary", "figure", "figcaption"].every(
				(t) => has(r, t),
			),
	},
	{
		// Two properties make this non-vacuous, and both are needed:
		//
		//   1. The slug MUST be a word that collides with a `document`
		//      property. DOMPurify's DOM-clobbering protection strips exactly
		//      those, so a neutral fixture like `a-slug` passes whether or not
		//      `markdown.ts` prefixes its slugs — measured. That was the blind
		//      spot `markdown.test.ts` already documents, reproduced here.
		//   2. The prefix is READ FROM markdown.ts (`headingIdPrefix()`), not
		//      hardcoded, so deleting HEADING_ID_PREFIX changes what this
		//      fixture asserts and the check fails.
		label: "heading ids survive DOM-clobbering protection (scroll-spy + restore)",
		html: `<h2 id="${headingIdPrefix()}title">Title</h2>`,
		check: (r) =>
			r.present.some((e) => e.tag === "h2" && e.id === `${headingIdPrefix()}title`),
	},
	{
		label: "mermaid container textContent byte-identical",
		html: `<div class="mermaid-diagram">graph TD\n  A[&quot;x &amp; y&quot;] --&gt; B</div>`,
		check: (r) =>
			r.present.some((e) => e.cls === "mermaid-diagram") &&
			r.text === 'graph TD\n  A["x & y"] --> B',
	},
	{
		label: "GFM task-list checkbox survives (input not forbidden)",
		html: `<ul><li><input type="checkbox" disabled checked> done</li></ul>`,
		check: (r) => r.present.some((e) => e.tag === "input" && e.type === "checkbox"),
	},
];

/**
 * Fixture mirroring the real app's chrome relationship: `--chrome-bg` declared
 * inside `@layer base` (as base.css does), consumed by an UNLAYERED rule (as
 * component <style> blocks do). Getting this wrong is what made an earlier
 * analysis conclude `:root` poisoning was defended when it is not.
 */
const CHROME_GREEN = "rgb(0, 128, 0)";
const CHROME_BLUE = "rgb(0, 0, 255)";
/**
 * `.probe` consumes `--chrome-unset` WITHOUT anything ever declaring it, which
 * is the only shape `@property` can actually attack. Registration is
 * document-global and escapes both `@layer` and `@scope`, but it loses to any
 * real declaration — so a payload aimed at `--chrome-bg` (which chrome does
 * declare) is contained whether or not the sanitizer drops `@property` at all.
 * Probing only that would make the drop rule look tested when it is not; this
 * mirrors every `var(--x, fallback)` in base.css that no theme sets.
 */
const PAGE = `<!doctype html><html><head>
<style>
@layer base, tokens, theme, user;
@layer base { :root { --chrome-bg: ${CHROME_GREEN}; } }
* { margin: 0 }
.app { display: flex; flex-direction: column; height: 100vh }
.titlebar { height: 38px; background: var(--chrome-bg); position: relative; z-index: 10 }
.probe { color: var(--chrome-unset, ${CHROME_BLUE}) }
/* Mirrors +page.svelte's .content. \`contain: content\` implies
   \`contain: layout\`, which makes this a containing block for fixed-position
   descendants — that, not @scope, is what keeps an in-scope element from
   painting over the titlebar. Do not "simplify" it out of this fixture: the
   overlay attacks below exist to fail if the real rule is ever removed. */
.content { flex: 1; overflow-y: auto; contain: content }
</style>
<style id="theme"></style>
</head><body>
<div class="app">
  <div class="titlebar">chrome</div>
  <div class="probe">unset-token consumer</div>
  <main class="content"><article class="markdown-body">
    <h1>Heading</h1><p>Body <code>code</code></p>
    <pre><code>x</code><button class="copy-code-btn">copy</button></pre>
  </article></main>
</div>
</body></html>`;

/**
 * Each attack asserts the titlebar keeps its own colour. `expectContained` is
 * always true here — these are the payloads that MUST NOT reach chrome.
 */
const ATTACKS = [
	["plain :root custom-property poison", `:root { --chrome-bg: red }`],
	["universal-selector poison", `* { --chrome-bg: red }`],
	["element-selector poison", `div { --chrome-bg: red }`],
	["poison with !important", `:root { --chrome-bg: red !important }`],
	["ident-escaped !important", `.titlebar { background: red !import\\61 nt }`],
	["direct chrome selector", `.titlebar { background: red }`],
	["chrome hidden", `.titlebar { display: none !important }`],
	["brace escape out of the wrapper", `x{} } .titlebar{background:red} @media all{`],
	["brace escape, nested variant", `.a { color: blue } } .titlebar { background: red } @media all {`],
	["html/body reach", `html, body { --chrome-bg: red }`],
	[
		"@property poison of an UNDECLARED chrome token",
		`@property --chrome-unset { syntax: '<color>'; inherits: true; initial-value: red }`,
	],
	[
		"@property poison, nested inside @scope+@layer",
		`@scope (.markdown-body) { @layer user { @property --chrome-unset { syntax: '<color>'; inherits: true; initial-value: red } } }`,
	],
	["@layer escape attempt", `@layer base { .titlebar { background: red } }`],
	["@media-wrapped payload", `@media all { .titlebar { background: red } }`],
	["@supports-wrapped payload", `@supports (color: red) { .titlebar { background: red } }`],
	// `@scope` bounds selector MATCHING, not PAINTING. An element that
	// legitimately matches inside `.markdown-body` can still be given
	// `position: fixed` and drawn over chrome. What stops it is `contain:
	// content` on `.content` (+page.svelte), which makes that element a
	// containing block for fixed descendants. These probe that specific
	// property, so removing it fails here rather than silently reopening a
	// spoofing/clickjacking vector — a colour-only assertion cannot see this.
	[
		"fixed overlay via ::after on in-scope element",
		`p::after { content: "FAKE CHROME"; position: fixed; inset: 0 0 auto 0; height: 38px; z-index: 2147483647; background: red }`,
	],
	[
		"invisible clickjack via .copy-code-btn (inside scope root)",
		`.copy-code-btn { position: fixed; top: 0; left: 0; right: 0; height: 38px; z-index: 2147483647; opacity: 0 }`,
	],
	[":scope root made a full-viewport fixed overlay", `:scope { position: fixed; inset: 0; z-index: 99999; background: red }`],
	// Rule 2 through CSS nesting: `cssText` serializes nested children
	// verbatim, so cleaning only the top-level declaration block leaves these
	// intact. Contained by @scope even when it leaks, so assert on the OUTPUT.
	["!important inside a nested rule", `.q { & .titlebar { background: red !important } }`],
	["!important on a custom property (WebKit strips no priority here)", `.x { --md-bg: red !important }`],
];

/**
 * The hoisted `.app` rule is emitted AFTER the `@scope` block closes. Matching
 * `.app {` anywhere would also match the SCOPED copy of the same rule, which
 * is how the first version of these assertions passed and failed for the wrong
 * reason — the scoped copy is expected and harmless.
 */
function hoistBlock(css) {
	// Walk from the start tracking brace depth; the hoisted rule is whatever
	// follows the point where the @scope block returns to depth 0.
	let depth = 0;
	for (let i = 0; i < css.length; i++) {
		if (css[i] === "{") depth++;
		else if (css[i] === "}") {
			depth--;
			if (depth === 0) return css.slice(i + 1).trim();
		}
	}
	return "";
}

/** Payloads asserted on the sanitizer's OUTPUT rather than on painted chrome. */
const OUTPUT_ASSERTIONS = [
	{
		label: "nested !important is stripped",
		css: `.q { & .r { background: red !important } }`,
		ok: (out) => out.ok && !/!\s*important/i.test(out.css),
	},
	{
		label: "custom-property !important is stripped",
		css: `.x { --md-bg: red !important }`,
		ok: (out) => out.ok && !/!\s*important/i.test(out.css),
	},
	{
		label: "keyframes name is prefixed exactly once",
		css: `@keyframes red { to { opacity: 0 } } .a { animation: red 1s }`,
		ok: (out) => out.ok && !/user-[^\s;]*user-/.test(out.css) && /user-probe-red/.test(out.css),
	},
	{
		label: "hoist refuses a non-scope-root selector",
		css: `.titlebar { --md-bg: red }`,
		ok: (out) => out.ok && hoistBlock(out.css) === "",
	},
	{
		label: "hoist accepts .app and emits it",
		css: `.app { --md-bg: rgb(1,2,3) }`,
		ok: (out) => out.ok && /--md-bg/.test(hoistBlock(out.css)),
	},
	{
		label: "user-preference tokens are never hoisted",
		css: `.app { --md-line-height: 9; --md-content-width: 9px; --md-font-weight: 900; --md-letter-spacing: 9px }`,
		ok: (out) => out.ok && hoistBlock(out.css) === "",
	},
];

async function run(engineName, engine) {
	const browser = await engine.launch();
	const page = await browser.newPage();
	await page.setContent(PAGE, { waitUntil: "load" });
	await page.addScriptTag({ content: loadSanitizerAsScript() });
	await page.addScriptTag({ content: loadHtmlSanitizerAsScript() });

	const results = [];

	// Capability probe must agree with reality in BOTH engines.
	const probe = await page.evaluate(() => {
		const sheet = new CSSStyleSheet();
		sheet.replaceSync("@scope (.markdown-body) { .x { color: red } }");
		return {
			scopeWorks: typeof CSSScopeRule !== "undefined" && sheet.cssRules[0] instanceof CSSScopeRule,
			cssSupportsSaysScope: CSS.supports("at-rule(@scope)"),
			sanitizerLoaded: typeof sanitizeThemeCss === "function",
		};
	});
	if (!probe.sanitizerLoaded) {
		console.error(`${engineName}: sanitizer failed to load into the page`);
		await browser.close();
		process.exit(2);
	}
	if (!(await page.evaluate(() => typeof globalThis.SH?.sanitizeHtml === "function"))) {
		console.error(`${engineName}: HTML sanitizer failed to load into the page`);
		await browser.close();
		process.exit(2);
	}

	for (const [label, attack] of ATTACKS) {
		const r = await page.evaluate(
			({ attack, green, blue }) => {
				const out = sanitizeThemeCss(attack, "probe");
				const el = document.getElementById("theme");
				el.textContent = out.ok ? out.css : "";
				const titlebar = document.querySelector(".titlebar");
				const cs = getComputedStyle(titlebar);
				const probe = getComputedStyle(document.querySelector(".probe"));
				// Hit-test the titlebar's own centre. A colour assertion cannot
				// see an element painted OVER it, which is the whole point of
				// the overlay/clickjack payloads.
				const box = titlebar.getBoundingClientRect();
				const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
				const ownsPixel = hit === titlebar || titlebar.contains(hit);
				return {
					accepted: out.ok,
					bg: cs.backgroundColor,
					display: cs.display,
					probeColor: probe.color,
					hit: hit ? `${hit.tagName}.${hit.className || ""}` : "none",
					token: cs.getPropertyValue("--chrome-bg").trim(),
					contained:
						cs.backgroundColor === green &&
						cs.display !== "none" &&
						probe.color === blue &&
						ownsPixel,
				};
			},
			{ attack, green: CHROME_GREEN, blue: CHROME_BLUE },
		);
		results.push({ label, ...r });
	}

	// Assertions about the sanitizer's OUTPUT, for rules whose failure is
	// currently masked by @scope containment. `!important` surviving inside a
	// nested rule paints nothing today — but it means one of the two documented
	// defences is not running, which is exactly the kind of silent erosion the
	// cascade comment in base.css warns about.
	// The sanitizer runs in the page; the predicates run here in Node. Only the
	// resulting CSS crosses the boundary, so no function source is shipped into
	// the page and evaluated there.
	const sanitized = await page.evaluate(
		(cases) =>
			cases.map(({ label, css }) => {
				const out = sanitizeThemeCss(css, "probe");
				return { label, ok: out.ok, css: out.ok ? out.css : "" };
			}),
		OUTPUT_ASSERTIONS.map(({ label, css }) => ({ label, css })),
	);
	const outputResults = sanitized.map((r, i) => ({
		label: r.label,
		passed: OUTPUT_ASSERTIONS[i].ok(r),
		css: r.ok ? r.css : "REJECTED",
	}));

	// The 7 shipped themes must survive their own sanitizer. This is a
	// REGRESSION test (does the sanitizer break trusted input?), NOT a security
	// test — it says nothing about whether untrusted input is stopped.
	const keeperResults = [];
	for (const id of KEEPERS) {
		const file = join(THEMES_DIR, `${id}.css`);
		if (!existsSync(file)) {
			console.error(`Missing keeper theme: ${file}`);
			await browser.close();
			process.exit(2);
		}
		const css = readFileSync(file, "utf8");
		const r = await page.evaluate(
			({ css, id }) => {
				const out = sanitizeThemeCss(css, id);
				if (!out.ok) return { ok: false, issue: out.issue.kind };
				return {
					ok: true,
					// The two font-declaring keepers must keep their url() intact;
					// jsdom drops `src` entirely and cannot assert this.
					fontFaces: (out.css.match(/@font-face/g) ?? []).length,
					fontUrls: (out.css.match(/url\(["']?\/fonts\//g) ?? []).length,
					scoped: out.css.includes("@scope"),
					importantLeft: /!\s*important/i.test(out.css),
				};
			},
			{ css, id },
		);
		keeperResults.push({ id, ...r });
	}

	// ---- HTML sanitizer suite (peep-r74) -----------------------
	// Runs in the same page so it shares the real chrome fixture, and so the
	// overlay attacks below are hit-tested against the SAME `contain: content`
	// rule the theme attacks use.

	const mxssResults = await page.evaluate((payloads) => {
		const host = document.querySelector("article.markdown-body");
		const original = host.innerHTML;
		const out = payloads.map(([label, payload]) => {
			// Sanitize, then hand the STRING back to the engine's parser —
			// exactly what {@html} does. Inspecting the live DOM afterwards is
			// the only way to observe a serialize/reparse divergence.
			host.innerHTML = globalThis.SH.sanitizeHtml(payload);
			const els = [...host.querySelectorAll("*")];
			const bad = els.filter(
				(el) =>
					/^(SCRIPT|IFRAME|OBJECT|EMBED|FORM|BASE|META)$/.test(el.tagName) ||
					[...el.attributes].some(
						(a) =>
							a.name.toLowerCase().startsWith("on") ||
							/javascript:/i.test(a.value),
					),
			);
			return {
				label,
				contained: bad.length === 0,
				offender: bad.length ? `${bad[0].tagName} ${bad[0].outerHTML.slice(0, 90)}` : "",
			};
		});
		host.innerHTML = original;
		return out;
	}, MXSS_PAYLOADS);

	const overlayResults = await page.evaluate((payloads) => {
		const host = document.querySelector("article.markdown-body");
		const original = host.innerHTML;
		const bar = document.querySelector(".titlebar");
		const out = payloads.map(([label, payload]) => {
			host.innerHTML = globalThis.SH.sanitizeHtml(payload);
			const r = bar.getBoundingClientRect();
			// Who owns the titlebar's centre pixel? A colour check cannot see a
			// transparent overlay; hit-testing can.
			const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
			return {
				label,
				contained: hit === bar || bar.contains(hit),
				owner: hit ? `${hit.tagName}.${hit.className}` : "(none)",
			};
		});
		host.innerHTML = original;
		return out;
	}, OVERLAY_PAYLOADS);

	// Each keeper is checked by sanitizing IN the page (real engine parser) and
	// returning the resulting markup, then asserting in Node. Declarative
	// selector/text assertions travel across the boundary as data; serializing
	// predicate functions and rebuilding them in the page would not.
	const htmlKeeperResults = [];
	for (const keeper of HTML_KEEPERS) {
		const got = await page.evaluate((html) => {
			const host = document.querySelector("article.markdown-body");
			const original = host.innerHTML;
			host.innerHTML = globalThis.SH.sanitizeHtml(html);
			const result = {
				html: host.innerHTML,
				// Read back through the live DOM so assertions see what the
				// engine actually parsed, not what the sanitizer emitted.
				present: [...host.querySelectorAll("*")].map((el) => ({
					tag: el.tagName.toLowerCase(),
					id: el.id,
					style: el.getAttribute("style") || "",
					cls: el.getAttribute("class") || "",
					type: el.getAttribute("type") || "",
				})),
				text: host.textContent,
			};
			host.innerHTML = original;
			return result;
		}, keeper.html);
		htmlKeeperResults.push({
			label: keeper.label,
			passed: keeper.check(got),
			got: got.html.slice(0, 120),
		});
	}

	// Mermaid's strict mode is the ONLY control on the SVG it assigns via
	// innerHTML, so this asserts it directly in a real engine. Without it,
	// deleting `securityLevel: "strict"` from mermaid.ts turns nothing red.
	await page.addScriptTag({ content: loadMermaidAsScript() });
	const mermaidResult = await page.evaluate(async (securityLevel) => {
		try {
			const mermaid = globalThis.MM?.default ?? globalThis.MM;
			// `securityLevel` is READ FROM mermaid.ts, not hardcoded — see
			// `mermaidSecurityLevel()`. That is what makes flipping the app's
			// config fail this assertion instead of silently passing.
			mermaid.initialize({ startOnLoad: false, securityLevel });
			const { svg } = await mermaid.render(
				"probe",
				'graph TD\n  A[Start] --> B\n  click A "javascript:alert(1)"',
			);
			// Scan the SVG TEXT, not a parsed attribute list. Measured: mermaid
			// emits the click binding in a form that `DOMParser(..., image/svg+xml)`
			// does not expose as an attribute node, so an attribute walk reports
			// "clean" under BOTH strict and loose — a detector bug that is
			// indistinguishable from the control working. Verified by mutation:
			// with this string check, `securityLevel: "loose"` fails here and
			// `"strict"` passes.
			const dangerous = /javascript:/i.test(svg);
			return { available: true, passed: !dangerous, securityLevel };
		} catch (err) {
			return { available: false, reason: String(err).slice(0, 120) };
		}
	}, mermaidSecurityLevel());

	await browser.close();
	return {
		probe,
		results,
		outputResults,
		keeperResults,
		mxssResults,
		overlayResults,
		htmlKeeperResults,
		mermaidResult,
	};
}

const argv = process.argv.slice(2);
const onlyEngine = argv.includes("--engine") ? argv[argv.indexOf("--engine") + 1] : null;
const engines = [
	["chromium", chromium],
	["webkit", webkit],
].filter(([n]) => !onlyEngine || n === onlyEngine);

if (!engines.length) {
	console.error(`Unknown engine: ${onlyEngine}`);
	process.exit(2);
}

let failures = 0;

for (const [name, engine] of engines) {
	const {
		probe,
		results,
		outputResults,
		keeperResults,
		mxssResults,
		overlayResults,
		htmlKeeperResults,
		mermaidResult,
	} = await run(name, engine);
	console.log(`\n===== ${name} =====`);
	console.log(
		`  @scope functional: ${probe.scopeWorks}   CSS.supports says: ${probe.cssSupportsSaysScope}` +
			(probe.scopeWorks !== probe.cssSupportsSaysScope ? "   <- feature detection would LIE here" : ""),
	);

	console.log("\n  Attacks (all must be contained):");
	for (const r of results) {
		if (!r.contained) failures++;
		const mark = r.contained ? "✓" : "✗ ESCAPED";
		console.log(`    ${mark}  ${r.label}`);
		if (!r.contained) {
			console.log(
				`         bg=${r.bg} display=${r.display} token=${r.token} probeColor=${r.probeColor}`,
			);
		}
	}

	console.log("\n  Output assertions (rules whose failure @scope would mask):");
	for (const o of outputResults) {
		if (!o.passed) failures++;
		console.log(`    ${o.passed ? "\u2713" : "\u2717 FAILED"}  ${o.label}`);
		if (!o.passed) console.log(`         ${o.css.replace(/\s+/g, " ").slice(0, 140)}`);
	}

	console.log("\n  Keeper themes (regression, not security):");
	for (const k of keeperResults) {
		const bad = !k.ok || k.importantLeft;
		if (bad) failures++;
		if (!k.ok) {
			console.log(`    ✗  ${k.id} REJECTED (${k.issue})`);
			continue;
		}
		const urls = k.fontFaces ? `  @font-face=${k.fontFaces} url(/fonts/)=${k.fontUrls}` : "";
		console.log(
			`    ${k.importantLeft ? "✗" : "✓"}  ${k.id} scoped=${k.scoped}${urls}` +
				(k.importantLeft ? "  !important SURVIVED" : ""),
		);
		if (k.fontFaces && k.fontUrls === 0) {
			console.log(`         ^ @font-face kept but its url() was dropped — fonts would silently fail`);
			failures++;
		}
	}

	console.log("\n  HTML mXSS (sanitize -> reparse via innerHTML, as {@html} does):");
	for (const m of mxssResults) {
		if (!m.contained) failures++;
		console.log(`    ${m.contained ? "✓" : "✗ ESCAPED"}  ${m.label}`);
		if (!m.contained) console.log(`         ${m.offender}`);
	}

	console.log("\n  HTML overlay containment (markdown direction, hit-tested):");
	for (const o of overlayResults) {
		if (!o.contained) failures++;
		console.log(`    ${o.contained ? "✓" : "✗ ESCAPED"}  ${o.label}`);
		if (!o.contained) console.log(`         titlebar centre owned by ${o.owner}`);
	}

	console.log("\n  HTML pipeline survival (regression, not security):");
	for (const k of htmlKeeperResults) {
		if (!k.passed) failures++;
		console.log(`    ${k.passed ? "✓" : "✗ FAILED"}  ${k.label}`);
		if (!k.passed) console.log(`         got: ${k.got}`);
	}

	console.log("\n  Mermaid strict mode (the only control on its innerHTML SVG):");
	if (!mermaidResult.available) {
		console.log(`    ✗ UNAVAILABLE  ${mermaidResult.reason}`);
		failures++;
	} else {
		if (!mermaidResult.passed) failures++;
		console.log(
			`    ${mermaidResult.passed ? "✓" : "✗ FAILED"}  click directive with javascript: is neutralized` +
				`  (securityLevel="${mermaidResult.securityLevel}", read from mermaid.ts)`,
		);
	}
}

console.log("");
if (failures) {
	console.log(`${failures} failure(s).`);
	process.exit(1);
}
console.log("All attacks contained; all keeper themes survived their own sanitizer.");
process.exit(0);
