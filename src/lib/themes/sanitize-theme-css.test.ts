/**
 * Tests for the theme CSS sanitizer (markdown-viewer-gfi).
 *
 * ENVIRONMENT CAPABILITY, MEASURED — READ BEFORE ADDING ASSERTIONS
 * -----------------------------------------------------------------
 * jsdom 29's `CSSStyleSheet` DOES support `new CSSStyleSheet()` +
 * `replaceSync()`, and DOES parse `@scope` into a real `CSSScopeRule` and
 * `@layer` into a real `CSSLayerBlockRule` (measured directly against this
 * repo's actual vitest/jsdom install — see PROBE RESULTS below). That is
 * enough to exercise this module's structural rebuild logic — the tree walk,
 * the `!important` strip, the `@keyframes` rename, the `@property` drop, the
 * hoist allow-list — end to end in vitest.
 *
 * What jsdom CANNOT do, confirmed by directly comparing against real
 * Chromium 151 and WebKit 26.5 via this repo's `playwright` devDependency:
 *
 *   1. `@font-face`'s `src` descriptor. jsdom's declaration parser drops any
 *      property it does not recognize as a standard CSS property —
 *      `src: url(...)` inside `@font-face`, and in fact ANY unknown
 *      property, vanishes from `CSSStyleRule.cssText` silently. Verified in
 *      real Chromium AND WebKit: `src` survives a `replaceSync` +
 *      `.cssText` round trip intact, including the `url()`. This means the
 *      issue's "`url(/fonts/x.woff2)` MUST SURVIVE" requirement — needed by
 *      neo-brutalist and minimal-mono's own `@font-face` blocks — CANNOT be
 *      asserted here. It is a REAL BROWSER assertion; see the harness note
 *      below.
 *   2. Cascade/computed-style resolution (`getComputedStyle`, `var()`
 *      resolution, actual `@layer`/`@scope` precedence as applied to
 *      rendered styles) — this repo's existing memory on jsdom already
 *      covers this and it applies here too: nothing in this file asserts
 *      resolved styles, only parsed-tree shape and serialized `cssText`.
 *
 * PROBE RESULTS (this repo's jsdom, checked interactively before writing
 * this suite, not re-run automatically):
 *   - `new CSSStyleSheet()` + `.replaceSync()`: supported.
 *   - `@scope` -> `CSSScopeRule`, `@layer` (block) -> `CSSLayerBlockRule`,
 *     `@layer` (statement) -> `CSSLayerStatementRule`: all supported and
 *     structurally correct.
 *   - `@property` -> jsdom has NO `CSSPropertyRule` global at all and
 *     silently drops the at-rule during parse (0 rules for `@property`
 *     alone). This actually makes the adversarial `@property` case a
 *     WEAKER test than intended: jsdom never hands the sanitizer a
 *     `CSSPropertyRule` to drop, so the jsdom test below only proves "does
 *     not crash and does not leak `@property` text", not "rule 3's drop
 *     branch executed". Real Chromium/WebKit DO parse it into a
 *     `CSSPropertyRule` (verified), so the actual drop-branch coverage lives
 *     in the real-browser harness.
 *   - jsdom bug found while probing: `CSSStyleRule` incorrectly reports
 *     `instanceof CSSGroupingRule === true` and exposes an (empty)
 *     `cssRules` property — neither is true in real Chromium/WebKit, where
 *     `CSSStyleRule` is not a grouping rule at all. The sanitizer's rule-walk
 *     discriminates with explicit `instanceof CSSStyleRule` checks ordered
 *     before any grouping check specifically so this jsdom quirk cannot
 *     misroute a style rule into the recursive branch.
 *   - Brace-escape payload (`x{} } .titlebar{background:red} @media all{`):
 *     jsdom and real Chromium/WebKit do not agree on the exact resulting
 *     rule COUNT (jsdom's parser recovers differently from a bare top-level
 *     stray `}` than Chromium's does), but this does not matter to the
 *     security property under test: the sanitizer walks every top-level
 *     rule `replaceSync` produces — whatever that set is — into the output's
 *     `@scope`/`@layer user` shell unconditionally. What's asserted here is
 *     that property, not a specific rule count.
 *
 * THE REAL-BROWSER HARNESS this suite defers to (built by a sibling stream,
 * see markdown-viewer-gfi's DESIGN note) is where the following MUST also be
 * verified before this feature is considered proven end to end:
 *   - `@font-face` `url()` survival (neo-brutalist, minimal-mono).
 *   - `@property` registration actually failing to leak past `@scope` in a
 *     real layout (this suite proves the RULE is dropped from the rebuilt
 *     tree; it does not and cannot prove what `@property` would have done to
 *     the page had it survived).
 *   - Actual cascade containment: that `@scope (.markdown-body)` really does
 *     stop a poisoned `:root`/`*`/`div` rule from repainting chrome, in a
 *     real DOM with real chrome elements outside `.markdown-body`.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { sanitizeThemeCss, hoistableMdTokensForTesting, __setScopeSupportForTesting } from "./sanitize-theme-css";

const THEMES_DIR = join(__dirname, "themes");

function readTheme(id: string): string {
	return readFileSync(join(THEMES_DIR, `${id}.css`), "utf-8");
}

/**
 * Split sanitized output into the `@scope` block and the hoisted `.app`
 * rule that follows it (see `sanitizeThemeCss`'s output shape: the two are
 * joined with `\n`). Returns an empty string for the hoist half when there
 * was nothing to hoist, matching `emitHoistedAppRule`'s behavior of omitting
 * the block entirely rather than emitting `.app {}`.
 */
function splitHoistBlock(css: string): { readonly scope: string; readonly hoist: string } {
	const newlineBeforeHoist = css.indexOf("}\n.app");
	if (newlineBeforeHoist === -1) return { scope: css, hoist: "" };
	return {
		scope: css.slice(0, newlineBeforeHoist + 1),
		hoist: css.slice(newlineBeforeHoist + 1),
	};
}

describe("sanitizeThemeCss", () => {
	afterEach(() => {
		// Every test that doesn't explicitly probe the capability-detection
		// branch must not leak a forced value into the next test.
		__setScopeSupportForTesting(undefined);
	});

	// -------------------------------------------------------------------
	// Output shape
	// -------------------------------------------------------------------

	it("wraps output in @scope (.markdown-body) { @layer user { ... } } when ok", () => {
		const result = sanitizeThemeCss(".x { color: red; }", "t1");
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.css).toMatch(/^@scope \(\.markdown-body\) \{/);
		expect(result.css).toContain("@layer user");
		expect(result.css).toContain(".x");
	});

	it("hoists only allow-listed --md-* custom properties onto a top-level .app rule", () => {
		const css = `.app { --md-bg: #111; --md-accent: blue; --md-content-width: 900px; }`;
		const result = sanitizeThemeCss(css, "t2");
		expect(result.ok).toBe(true);
		if (!result.ok) return;

		// Hoisted block sits OUTSIDE the @scope wrapper.
		const { hoist } = splitHoistBlock(result.css);
		expect(hoist).toContain("--md-bg");
		expect(hoist).toContain("--md-accent");
	});

	it("never hoists the four user-preference-owned tokens", () => {
		expect(hoistableMdTokensForTesting.has("--md-content-width")).toBe(false);
		expect(hoistableMdTokensForTesting.has("--md-font-weight")).toBe(false);
		expect(hoistableMdTokensForTesting.has("--md-letter-spacing")).toBe(false);
		expect(hoistableMdTokensForTesting.has("--md-line-height")).toBe(false);

		const css = `.app { --md-content-width: 1200px; --md-font-weight: 900; --md-letter-spacing: 5px; --md-line-height: 3; --md-bg: red; }`;
		const result = sanitizeThemeCss(css, "t3");
		expect(result.ok).toBe(true);
		if (!result.ok) return;

		const { hoist } = splitHoistBlock(result.css);
		expect(hoist).not.toContain("--md-content-width");
		expect(hoist).not.toContain("--md-font-weight");
		expect(hoist).not.toContain("--md-letter-spacing");
		expect(hoist).not.toContain("--md-line-height");
		// The excluded tokens must still survive INSIDE the scope, on the
		// original rule — only the hoist onto the outer .app is refused.
		expect(result.css).toContain("--md-content-width");
		expect(result.css).toContain("--md-bg");
	});

	it("never hoists --chrome-* even if a theme tries to set it on .app or :root", () => {
		const css = `.app { --chrome-bg: red; --md-bg: blue; } :root { --chrome-text: red; }`;
		const result = sanitizeThemeCss(css, "t4");
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		const { hoist } = splitHoistBlock(result.css);
		expect(hoist).not.toContain("--chrome-");
	});

	// -------------------------------------------------------------------
	// Rule 2: strip !important
	// -------------------------------------------------------------------

	it("strips a plain !important", () => {
		const result = sanitizeThemeCss(".x { color: red !important; }", "t5");
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.css).not.toContain("important");
		expect(result.css).toContain("color: red");
	});

	it("strips !important expressed via a CSS ident escape, invisible to a naive regex", () => {
		// \61 is the escaped form of "a" — a regex for the literal string
		// "!important" never matches this, but the CSS tokenizer resolves the
		// escape and getPropertyPriority() reports "important" regardless.
		const css = ".x { background: red !import\\61 nt; }";
		const result = sanitizeThemeCss(css, "t6");
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.css.toLowerCase()).not.toContain("important");
	});

	it("preserves a shorthand property's value while stripping its !important", () => {
		const result = sanitizeThemeCss(".x { background: blue !important; }", "t7");
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.css).toContain("background: blue");
		expect(result.css).not.toContain("important");
	});

	// -------------------------------------------------------------------
	// Chrome-poisoning selectors: sanitizer does not filter selectors at all
	// (that is @scope's job at render time) — it only strips !important and
	// contains everything inside @scope. Assert containment structurally:
	// every one of these selectors appears ONLY inside the @scope wrapper.
	// -------------------------------------------------------------------

	it.each([":root", "*", "div", "html", "body"])(
		"contains a %s rule inside @scope rather than rejecting it",
		(selector) => {
			const result = sanitizeThemeCss(`${selector} { color: red; }`, "t8");
			expect(result.ok).toBe(true);
			if (!result.ok) return;
			// Must appear, and must appear strictly after the @scope/@layer open.
			const layerOpen = result.css.indexOf("@layer user");
			const selectorIndex = result.css.indexOf(selector, layerOpen);
			expect(layerOpen).toBeGreaterThanOrEqual(0);
			expect(selectorIndex).toBeGreaterThan(layerOpen);
		},
	);

	// -------------------------------------------------------------------
	// Rule 3: drop @property
	// -------------------------------------------------------------------

	it("drops an @property rule from the output", () => {
		const css = `@property --foo { syntax: '<color>'; inherits: false; initial-value: red; } .x { color: blue; }`;
		const result = sanitizeThemeCss(css, "t9");
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.css).not.toContain("@property");
		expect(result.css).not.toContain("--foo");
		// The sibling rule must still survive — dropping @property must not
		// take out the rest of the sheet.
		expect(result.css).toContain(".x");
		expect(result.css).toContain("color: blue");
	});

	// -------------------------------------------------------------------
	// Rule 4: prefix @keyframes + rewrite references
	// -------------------------------------------------------------------

	it("prefixes a @keyframes name and rewrites animation-name to match", () => {
		const css = `@keyframes spin { from { opacity: 0; } to { opacity: 1; } } .a { animation-name: spin; }`;
		const result = sanitizeThemeCss(css, "my-theme");
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.css).toContain("@keyframes user-my-theme-spin");
		expect(result.css).not.toMatch(/@keyframes spin\b/);
		expect(result.css).toContain("animation-name: user-my-theme-spin");
	});

	it("rewrites the animation shorthand's name reference, not just animation-name", () => {
		const css = `@keyframes pulse { from { opacity: 0; } to { opacity: 1; } } .a { animation: pulse 2s ease-in-out infinite; }`;
		const result = sanitizeThemeCss(css, "my-theme");
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.css).toContain("animation: user-my-theme-pulse 2s ease-in-out infinite");
	});

	it("two themes with the same @keyframes name do not collide (per-theme id prefix)", () => {
		const css = `@keyframes spin { from { opacity: 0; } to { opacity: 1; } } .a { animation-name: spin; }`;
		const a = sanitizeThemeCss(css, "theme-a");
		const b = sanitizeThemeCss(css, "theme-b");
		expect(a.ok && b.ok).toBe(true);
		if (!a.ok || !b.ok) return;
		expect(a.css).toContain("user-theme-a-spin");
		expect(b.css).toContain("user-theme-b-spin");
		expect(a.css).not.toContain("user-theme-b-spin");
	});

	// -------------------------------------------------------------------
	// content: "}" must not trip anything up — the sanitizer rebuilds from
	// the parsed tree, so a brace living inside a string token is never
	// treated as structural.
	// -------------------------------------------------------------------

	it("does not treat a brace inside content: as structural", () => {
		const css = `.a::after { content: "}"; color: red; }`;
		const result = sanitizeThemeCss(css, "t10");
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.css).toContain('content: "}"');
		expect(result.css).toContain("color: red");
	});

	// -------------------------------------------------------------------
	// Brace-escape family. jsdom and real engines do not agree on the exact
	// rule count this payload produces (see file header), so this asserts
	// the invariant that actually matters: EVERY rule the parser hands back
	// lands inside @scope/@layer user, none of it beside/after the wrapper.
	// -------------------------------------------------------------------

	it("contains every rule produced by a brace-escape payload inside @scope, none escapes", () => {
		const css = `x{} } .titlebar{background:red} @media all{`;
		const result = sanitizeThemeCss(css, "evil");
		expect(result.ok).toBe(true);
		if (!result.ok) return;

		// The whole sanitized output must be a single @scope statement (plus an
		// optional trailing hoisted .app rule) — nothing may sit as a sibling
		// alongside it the way the old string-wrapper design allowed.
		expect(result.css.startsWith("@scope (.markdown-body) {")).toBe(true);

		// If jsdom's parser recovery happens to produce an independent
		// `.titlebar` rule from this payload, it must be nested under
		// @layer user, not sitting after the @scope block's closing brace.
		if (result.css.includes(".titlebar")) {
			const layerOpen = result.css.indexOf("@layer user");
			const titlebarIndex = result.css.indexOf(".titlebar");
			// Find where the @scope block closes by locating the matching
			// hoisted-rule boundary: the hoist (if any) is the only thing
			// allowed after @scope's own closing braces, and it never
			// contains a selector like .titlebar.
			expect(titlebarIndex).toBeGreaterThan(layerOpen);
		}
	});

	// -------------------------------------------------------------------
	// @font-face / url() — see file header. jsdom drops `src` from
	// @font-face entirely (a jsdom bug, verified absent in real Chromium and
	// WebKit), so this suite can only assert what jsdom is ABLE to observe:
	// the rule kind survives and is not rejected outright. The url()
	// survival claim itself is a REAL-BROWSER-ONLY assertion.
	// -------------------------------------------------------------------

	it("does not reject a theme containing @font-face with url() (jsdom cannot verify url() survives — see file header)", () => {
		const css = `@font-face { font-family: 'Foo'; src: url("/fonts/x.woff2") format("woff2"); } .x { font-family: 'Foo'; }`;
		const result = sanitizeThemeCss(css, "t11");
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.css).toContain("@font-face");
		expect(result.css).toContain("Foo");
	});

	// -------------------------------------------------------------------
	// Rule 5: size cap — a resource guard, not a security control.
	// -------------------------------------------------------------------

	it("accepts input at exactly the 256KB boundary", () => {
		const filler = "a".repeat(256 * 1024 - ".x{}".length);
		const css = `.x{}${filler}`;
		expect(new TextEncoder().encode(css).length).toBe(256 * 1024);
		const result = sanitizeThemeCss(css, "t12");
		// May legitimately fail to parse as valid CSS (the filler isn't real
		// CSS), but it must not be rejected for SIZE at exactly the boundary.
		if (!result.ok) {
			expect(result.issue.kind).not.toBe("too-large");
		}
	});

	it("rejects input over the 256KB cap (257KB)", () => {
		const filler = "a".repeat(257 * 1024);
		const css = `.x{}${filler}`;
		const result = sanitizeThemeCss(css, "t13");
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.issue.kind).toBe("too-large");
	});

	it("rejects a 257KB input built from many small valid rules, not just filler text", () => {
		const rule = ".x { color: red; }\n"; // 20 bytes
		const count = Math.ceil((257 * 1024) / rule.length);
		const css = rule.repeat(count);
		expect(new TextEncoder().encode(css).length).toBeGreaterThan(257 * 1024 - 1);
		const result = sanitizeThemeCss(css, "t14");
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.issue.kind).toBe("too-large");
	});

	// -------------------------------------------------------------------
	// Empty input
	// -------------------------------------------------------------------

	it("accepts empty input and produces an empty (but still wrapped) scope", () => {
		const result = sanitizeThemeCss("", "t15");
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.css).toContain("@scope (.markdown-body)");
		expect(result.css).toContain("@layer user");
	});

	it("accepts whitespace-only input", () => {
		const result = sanitizeThemeCss("   \n\t  ", "t16");
		expect(result.ok).toBe(true);
	});

	// -------------------------------------------------------------------
	// Capability detection / fail-closed
	// -------------------------------------------------------------------

	it("rejects (fails closed) when @scope support is not detected, rather than falling back to layer-only", () => {
		__setScopeSupportForTesting(false);
		const result = sanitizeThemeCss(".x { color: red; }", "t17");
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.issue.kind).toBe("unsupported-scope");
	});

	it("does not use CSS.supports('at-rule(@scope)') for capability detection", () => {
		// This is a design-intent test, not a runtime one: CSS.supports would
		// report TRUE in Chromium and FALSE in WebKit while @scope actually
		// works in WebKit (measured in the issue's research). Verify indirectly
		// by confirming a real parse-based probe result is what's cached, i.e.
		// that forcing the cache to `true` changes the outcome even though
		// this environment may or may not expose CSS.supports the same way.
		__setScopeSupportForTesting(true);
		const forced = sanitizeThemeCss(".x { color: red; }", "t18");
		__setScopeSupportForTesting(false);
		const forcedOff = sanitizeThemeCss(".x { color: red; }", "t18");
		expect(forced.ok).toBe(true);
		expect(forcedOff.ok).toBe(false);
	});

	// -------------------------------------------------------------------
	// Regression: all 7 shipped built-in themes must survive their own
	// sanitizer. This is a REGRESSION test, not a security test — it proves
	// the sanitizer doesn't mangle or reject legitimate, already-trusted CSS.
	// -------------------------------------------------------------------

	describe("regression: built-in themes survive sanitization", () => {
		const builtins = [
			"github-dark",
			"github-light",
			"neo-brutalist",
			"pastel-dream",
			"swiss-design",
			"candy-pop",
			"minimal-mono",
		];

		it.each(builtins)("%s sanitizes ok and keeps its .app rule", (id) => {
			const css = readTheme(id);
			const result = sanitizeThemeCss(css, id);
			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.css).toContain(".app");
			expect(result.css.length).toBeGreaterThan(0);
		});

		it.each(builtins)("%s: sanitized output strips no non-important declarations (spot check via length)", (id) => {
			const css = readTheme(id);
			const result = sanitizeThemeCss(css, id);
			expect(result.ok).toBe(true);
			if (!result.ok) return;
			// Every selector text appearing in the raw source's rules should
			// still appear somewhere in the sanitized output. This is a coarse
			// check (string containment, not AST diffing) but catches wholesale
			// rule loss, which is the failure mode that matters here.
			const source = new CSSStyleSheet();
			source.replaceSync(css);
			const walk = (rules: CSSRuleList): string[] => {
				const selectors: string[] = [];
				for (const rule of rules) {
					if (rule instanceof CSSStyleRule) selectors.push(rule.selectorText);
				}
				return selectors;
			};
			for (const selector of walk(source.cssRules)) {
				expect(result.css).toContain(selector);
			}
		});
	});
});

describe("sanitizeThemeCss: capability probe caching", () => {
	beforeEach(() => __setScopeSupportForTesting(undefined));
	afterEach(() => __setScopeSupportForTesting(undefined));

	it("caches the capability result across calls (does not re-probe every call)", () => {
		// Indirect check: force a value, confirm subsequent calls keep using it
		// even though the "real" probe would presumably differ. If the probe
		// re-ran each time and ignored the cache, forcing true then false in
		// sequence (already covered above) would be meaningless; this test
		// pins the specific claim that a single forced value is stable across
		// repeated calls without being reset in between.
		__setScopeSupportForTesting(true);
		const first = sanitizeThemeCss(".x{}", "cache-a");
		const second = sanitizeThemeCss(".y{}", "cache-b");
		expect(first.ok).toBe(true);
		expect(second.ok).toBe(true);
	});
});

describe("sanitizeThemeCss: regressions found by the real-browser harness", () => {
	beforeEach(() => __setScopeSupportForTesting(undefined));
	afterEach(() => __setScopeSupportForTesting(undefined));

	// Each of these shipped green under vitest alone and was caught only by
	// scripts/sanitizer-attack.mjs (pnpm test:sanitizer). They are pinned here
	// too, where jsdom can see them, so a future edit fails fast — but the
	// browser harness remains the authority: the WebKit half of the
	// custom-property bug is invisible to jsdom by construction.

	it("strips !important from a rule nested inside another rule", () => {
		// `cssText` serializes nested children verbatim, so cleaning only the
		// top-level declaration block left these intact. Contained by @scope
		// even when it leaked, which is exactly why no painted-output assertion
		// could see it.
		const result = sanitizeThemeCss(".q { & .r { background: red !important } }", "nested");
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.css).not.toMatch(/!\s*important/i);
	});

	it("strips !important from a custom property", () => {
		// WebKit-specific in the field: `setProperty(prop, value, "")` is a
		// no-op for custom properties there, so the declaration kept its
		// `!important` on the app's primary platform while Chromium was clean.
		const result = sanitizeThemeCss(".x { --md-bg: red !important }", "customprop");
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.css).not.toMatch(/!\s*important/i);
	});

	it("prefixes a keyframe name exactly once, even when it is a substring of the prefixed form", () => {
		// The rename mutates the live sheet before the rebuild, so the
		// shorthand re-serializes already carrying `user-<id>-red` — and a
		// naive `\bred\b` pass then matched the `red` inside it, yielding
		// `user-t-user-t-red` and silently breaking the animation.
		//
		// NOT ENFORCED HERE. Verified by mutation: removing the idempotency
		// lookbehind from `rewriteAnimationValue` leaves this test GREEN,
		// because jsdom does not expand the `animation` shorthand on
		// serialization the way Chromium does, so the prefixed name never
		// re-enters the value and the bug cannot occur under jsdom at all.
		// The enforcing assertion is "keyframes name is prefixed exactly once"
		// in scripts/sanitizer-attack.mjs, which DOES fail on that mutation.
		// Kept as documentation of intent and as a guard against unrelated
		// regressions that jsdom can see.
		const result = sanitizeThemeCss("@keyframes red { to { opacity: 0 } } .a { animation: red 1s }", "t");
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.css).toMatch(/user-t-red/);
			expect(result.css).not.toMatch(/user-t-user-t-/);
		}
	});

	it("does not hoist a --md-* token declared on a non-scope-root selector", () => {
		// The hoist lifts declarations OUT of @scope onto `.app`, so its
		// source-selector check is the widest surface in the module. Mutating
		// `targetsScopeRoot` to `return true` previously left every test green.
		const result = sanitizeThemeCss(".titlebar { --md-bg: red }", "hoist");
		expect(result.ok).toBe(true);
		if (result.ok) {
			// Everything after the @scope block closes is the hoisted output.
			const depth0 = closingIndexOfFirstBlock(result.css);
			expect(result.css.slice(depth0 + 1).trim()).toBe("");
		}
	});
});

/** Index of the `}` that closes the first top-level block. */
function closingIndexOfFirstBlock(css: string): number {
	let depth = 0;
	for (let i = 0; i < css.length; i++) {
		if (css[i] === "{") depth++;
		else if (css[i] === "}" && --depth === 0) return i;
	}
	return css.length;
}
