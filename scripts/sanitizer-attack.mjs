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
import { chromium, webkit } from "playwright";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(REPO, "src/lib/themes/sanitize-theme-css.ts");
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

	await browser.close();
	return { probe, results, outputResults, keeperResults };
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
	const { probe, results, outputResults, keeperResults } = await run(name, engine);
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
}

console.log("");
if (failures) {
	console.log(`${failures} failure(s).`);
	process.exit(1);
}
console.log("All attacks contained; all keeper themes survived their own sanitizer.");
process.exit(0);
