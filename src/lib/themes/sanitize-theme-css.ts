/**
 * Sanitize untrusted user theme CSS before it reaches the page.
 *
 * BROWSER-ONLY. Deliberately separate from `parse-theme-css.ts`, whose
 * dependency-free/Node-runnable constraint (documented at that file's
 * header) is what lets `node scripts/extract-theme-colors.ts` run it with no
 * build step. This module's entire design rests on the constructed-
 * stylesheet CSSOM (`new CSSStyleSheet()` + `replaceSync`), which has no
 * Node equivalent — it cannot be dependency-free in the same sense and must
 * not be imported by that script.
 *
 * Runs at INJECTION time, not import time, and is NOT memoized internally —
 * callers memoize by id+source-hash (see `ThemePreview.svelte`'s
 * module-level `cssCache` for the pattern). Injection-time matters because
 * theme files live in a user-writable directory: a sanitized artifact stored
 * once could be edited on disk afterward (a TOCTOU window measured in days),
 * and a sanitizer bugfix should retroactively protect already-installed
 * themes rather than requiring re-import.
 *
 * DESIGN — see markdown-viewer-gfi for the full measurement record. The short
 * version: an earlier string-rewriting design was measured to be defeated in
 * real Chromium and WebKit two different ways (a brace escape that produces
 * balanced-but-wrapper-breaking output, and a CSS ident escape invisible to
 * regex but resolved by the CSS tokenizer). CSSOM defeats both structurally
 * because we never look at the input string again after `replaceSync` — the
 * output is REBUILT from the parsed rule tree, so an attack that only exists
 * in the source text cannot be expressed in the output.
 *
 * Five things this module does, and only these five:
 *   1. Rebuild output from `cssRules`, never pass the input string through.
 *   2. Strip `!important` from every declaration.
 *   3. Drop `@property` rules (registration is document-global, escapes both
 *      `@layer` and `@scope`).
 *   4. Prefix `@keyframes` names per-theme and rewrite `animation-name` /
 *      `animation` shorthand references in the same pass (same global-escape
 *      reasoning as `@property`).
 *   5. Enforce a 256KB size cap — a resource guard, NOT a security control.
 *
 * Everything the previous string-sanitizing design also checked (unbalanced
 * braces, NUL bytes, `</style>`/`<!--`/`-->`, remote `url()`, `javascript:`,
 * `expression()`, `@charset`/`@namespace`/`@page`/`@viewport`, …) is
 * deliberately NOT reimplemented here. Each was either dead in all three
 * shipping engines, already closed by another layer (CSP at
 * `src-tauri/tauri.conf.json`, `.textContent` injection instead of
 * `{@html}`), inert on a constructed sheet, or — in the unbalanced-brace
 * case — actively harmful: it manufactured false confidence against exactly
 * the payload that defeats it.
 */

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export type SanitizeIssue =
	| { readonly kind: "too-large"; readonly bytes: number; readonly limit: number }
	| { readonly kind: "unsupported-scope" }
	| { readonly kind: "parse-failed" };

export type SanitizeResult =
	| { readonly ok: true; readonly css: string }
	| { readonly ok: false; readonly issue: SanitizeIssue };

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Resource guard, NOT a security control — see file header, rule 5. */
const MAX_THEME_CSS_BYTES = 256 * 1024;

const SCOPE_ROOT_SELECTOR = ".markdown-body";

/**
 * The closed `--md-*` token vocabulary a theme may set on `.app`, documented
 * at `base.css` around lines 121-138. `--md-content-width`, `--md-font-weight`,
 * `--md-letter-spacing`, and `--md-line-height` are USER-PREFERENCE-owned
 * (base.css:136-138) and deliberately excluded — a theme hoisting one of
 * those would let imported CSS fight user settings for a variable the user
 * expects to control from Preferences alone.
 */
const HOISTABLE_MD_TOKENS: ReadonlySet<string> = new Set([
	"--md-bg",
	"--md-text",
	"--md-text-muted",
	"--md-accent",
	"--md-accent-text",
	"--md-border",
	"--md-surface",
	"--md-code-bg",
	"--md-code-text",
	"--md-radius",
	"--md-radius-sm",
	"--md-font-body",
	"--md-font-mono",
	"--md-shadow",
]);

// ---------------------------------------------------------------------------
// Capability detection
// ---------------------------------------------------------------------------

let scopeSupportCache: boolean | undefined;

/**
 * Probe once whether this engine's constructed-stylesheet CSSOM actually
 * parses `@scope` into a `CSSScopeRule`, and cache the boolean.
 *
 * Deliberately NOT `CSS.supports("at-rule(@scope)")` — measured TRUE in
 * Chromium but FALSE in WebKit 26.5 while `@scope` demonstrably works there.
 * Trusting that API would disable user themes on macOS, the primary
 * platform. Probing the actual parse result is the only measurement that
 * agreed with reality in both engines.
 */
function supportsScope(): boolean {
	if (scopeSupportCache !== undefined) return scopeSupportCache;

	try {
		const probe = new CSSStyleSheet();
		probe.replaceSync("@scope (.x) { .y { color: red; } }");
		scopeSupportCache =
			typeof CSSScopeRule !== "undefined" && probe.cssRules[0] instanceof CSSScopeRule;
	} catch {
		scopeSupportCache = false;
	}
	return scopeSupportCache;
}

/**
 * Test-only escape hatch: force the cached capability result. Restores the
 * lazy-probe behavior when called with `undefined`. Exists so tests can
 * exercise the fail-closed branch without depending on which engine the
 * suite happens to run under.
 */
export function __setScopeSupportForTesting(value: boolean | undefined): void {
	scopeSupportCache = value;
}

// ---------------------------------------------------------------------------
// Declaration-level: strip !important
// ---------------------------------------------------------------------------

/**
 * Strip `!important` from every declaration on a style rule, in place.
 *
 * Mutating the rule's own `CSSStyleDeclaration` and reading `cssText` back
 * (rather than reassembling `property: value` pairs by hand) is what keeps
 * shorthands intact: `style.item()` enumerates `background` as its eight
 * expanded longhands, but writing each one back with `setProperty(prop, val,
 * "")` and then reading `rule.cssText` recollapses them to the shorthand —
 * verified against jsdom's own serializer, which round-trips
 * `background: blue !important` to `background: blue`.
 */
function stripImportant(style: CSSStyleDeclaration): void {
	const props: string[] = [];
	for (let i = 0; i < style.length; i++) {
		const prop = style.item(i);
		if (prop) props.push(prop);
	}
	for (const prop of props) {
		if (!style.getPropertyPriority(prop)) continue;
		const value = style.getPropertyValue(prop);

		// WebKit divergence, measured in WebKit 26.5 vs Chromium 151: for a
		// CUSTOM property, `setProperty(prop, value, "")` is a NO-OP — the
		// declaration keeps its `!important`, even though `getPropertyPriority`
		// correctly reported it. Chromium honours the same call. macOS ships
		// WebKit, so a plain setProperty would leave the primary platform
		// unprotected while every Chromium-based test reported green.
		//
		// Removing first and re-adding works in both engines. Done only for
		// custom properties because for a standard property the plain
		// setProperty round-trip preserves shorthand expansion, which
		// remove+add would not.
		if (prop.startsWith("--")) {
			style.removeProperty(prop);
			style.setProperty(prop, value.replace(/!\s*important\s*$/i, "").trimEnd(), "");
			continue;
		}
		style.setProperty(prop, value, "");
	}
}

/**
 * Apply `stripImportant` (and animation-name rewriting) to a style rule's
 * NESTED children, recursively, in place.
 *
 * The rebuild re-emits a style rule via `cssText`, which serializes nested
 * rules verbatim — so unlike every other rule kind, a style rule's descendants
 * never pass back through `rebuildInto`'s dispatch. Without this, CSS nesting
 * is a hole straight through rule 2.
 *
 * Deliberately does NOT hoist from nested rules: hoisting lifts a declaration
 * out of `@scope` onto `.app`, and a nested selector's real match set is not
 * knowable from its own `selectorText` alone (`& .x` means nothing without its
 * parent). Refusing to hoist is the conservative direction — a nested
 * `--md-*` simply stays scoped.
 */
function stripImportantDeep(rule: CSSRule, keyframes: KeyframeRenames): void {
	const children = (rule as CSSRule & { cssRules?: CSSRuleList }).cssRules;
	if (!children || children.length === 0) return;
	for (let i = 0; i < children.length; i++) {
		const child = children[i];
		if (!child) continue;
		if (child instanceof CSSStyleRule) {
			stripImportant(child.style);
			rewriteAnimationDeclarations(child.style, keyframes);
		}
		stripImportantDeep(child, keyframes);
	}
}

/** Rewrite `animation-name` / `animation` on one declaration block, in place. */
function rewriteAnimationDeclarations(style: CSSStyleDeclaration, keyframes: KeyframeRenames): void {
	for (const prop of ["animation-name", "animation"] as const) {
		const value = style.getPropertyValue(prop);
		if (!value) continue;
		style.setProperty(prop, rewriteAnimationValue(value, keyframes), style.getPropertyPriority(prop));
	}
}

// ---------------------------------------------------------------------------
// Keyframes: per-theme prefixing
// ---------------------------------------------------------------------------

function keyframesPrefix(themeId: string): string {
	return `user-${themeId}-`;
}

/**
 * The keyframe renames for one theme, carried together because
 * `rewriteAnimationValue` needs BOTH the map and the prefix: the prefix is what
 * makes the rewrite idempotent (see that function).
 */
interface KeyframeRenames {
	readonly names: ReadonlyMap<string, string>;
	readonly prefix: string;
}

/**
 * Rewrite an `animation` shorthand or `animation-name` value's keyframe
 * name references to the prefixed name, when the value mentions one of this
 * rule's own declared keyframe names.
 *
 * Both properties can hold a comma-separated list (multiple animations), so
 * this replaces per-token rather than assuming a single bare name. Matching
 * is whole-token (`\b`) so a name that happens to be a substring of another
 * identifier or a timing keyword is not corrupted.
 */
function rewriteAnimationValue(value: string, keyframes: KeyframeRenames): string {
	const { names: knownNames, prefix } = keyframes;
	if (knownNames.size === 0) return value;
	// This rewrite MUST be idempotent, and that is not a stylistic preference.
	// `collectAndRenameKeyframes` renames each `CSSKeyframesRule.name` in the
	// live sheet BEFORE the rebuild, so an `animation` shorthand re-serializes
	// carrying the already-prefixed name. A naive `\bred\b` pass then matches
	// the `red` inside `user-t-red` and yields `user-t-user-t-red` — measured in
	// both engines, and it silently breaks the animation rather than erroring.
	//
	// The negative lookbehind makes a name that is already prefixed ineligible,
	// so running this once or a hundred times gives the same answer. One
	// alternation pass with a callback (never a loop of sequential replaces,
	// which would re-enter its own output), longest-first so `spin` cannot
	// pre-empt `spin-fast`.
	const pattern = [...knownNames.keys()]
		.sort((a, b) => b.length - a.length)
		.map(escapeRegExp)
		.join("|");
	const re = new RegExp(`(?<!${escapeRegExp(prefix)})\\b(?:${pattern})\\b`, "g");
	return value.replace(re, (m) => knownNames.get(m) ?? m);
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ---------------------------------------------------------------------------
// Hoisting: --md-* custom properties declared on a selector matching the
// scope root, collected during the walk and emitted on `.app` outside
// `@scope`.
// ---------------------------------------------------------------------------

type HoistedTokens = Map<string, string>;

/**
 * A declaration is eligible for hoisting when its rule's selector targets
 * the scope root itself. All 22 built-in themes set `--md-*` on `.app`
 * (base.css:140-148), and a theme may also reasonably reach for `:root` —
 * both resolve to "the page surface" once `@scope` narrows everything to
 * `.markdown-body`'s ancestor chain, so both are accepted.
 */
function targetsScopeRoot(selectorText: string): boolean {
	return selectorText
		.split(",")
		.map((s) => s.trim())
		.some((s) => s === ".app" || s === ":root");
}

function collectHoistableDeclarations(rule: CSSStyleRule, into: HoistedTokens): void {
	if (!targetsScopeRoot(rule.selectorText)) return;
	const { style } = rule;
	for (let i = 0; i < style.length; i++) {
		const prop = style.item(i);
		if (prop && HOISTABLE_MD_TOKENS.has(prop)) {
			into.set(prop, style.getPropertyValue(prop));
		}
	}
}

// ---------------------------------------------------------------------------
// Rebuild: walk the parsed tree, emit each surviving rule into a fresh
// output stylesheet nested under @scope + @layer user.
// ---------------------------------------------------------------------------

/**
 * Recursively rebuild `source`'s rules into `target` (a `CSSGroupingRule` or
 * top-level `CSSStyleSheet`, both of which expose `insertRule`/`cssRules`).
 *
 * Discriminates by `instanceof` against concrete rule constructors rather
 * than the presence of a `cssRules` property — jsdom's `CSSStyleRule`
 * incorrectly reports `cssRules` (an empty `CSSRuleList`) and `instanceof
 * CSSGroupingRule` as `true`, which a "does it have children" duck-type
 * check would misread as a container. Real Chromium and WebKit do not
 * expose `cssRules` on `CSSStyleRule` at all, so a type-first discrimination
 * is the one approach that behaves the same in both jsdom and real engines.
 */
function rebuildInto(
	source: CSSRuleList,
	target: { insertRule(rule: string, index?: number): number; readonly cssRules: CSSRuleList },
	keyframes: KeyframeRenames,
	hoisted: HoistedTokens,
): void {
	for (let i = 0; i < source.length; i++) {
		const rule = source[i];
		if (!rule) continue;

		if (rule instanceof CSSStyleRule) {
			collectHoistableDeclarations(rule, hoisted);
			stripImportant(rule.style);
			// CSS nesting: a style rule can contain child style rules, and
			// `cssText` below serializes those children verbatim. Cleaning only
			// `rule.style` would leave `.a { & .b { color: red !important } }`
			// with its `!important` intact — measured in both engines before this
			// was added. Guarded on a populated `cssRules` because jsdom exposes
			// an empty one on every style rule (see this function's docstring).
			stripImportantDeep(rule, keyframes);

			rewriteAnimationDeclarations(rule.style, keyframes);

			target.insertRule(rule.cssText, target.cssRules.length);
			continue;
		}

		if (rule instanceof CSSKeyframesRule) {
			// Renamed up front (see collectKeyframeNames), so cssText already
			// carries the prefixed name — nothing further to rewrite here.
			target.insertRule(rule.cssText, target.cssRules.length);
			continue;
		}

		if (isPropertyRule(rule)) {
			// Rule 3: dropped. Registration via @property is document-global and
			// would escape both @layer and @scope, so it cannot be rebuilt at all
			// — not narrowed, not renamed.
			//
			// This branch is DEFENCE IN DEPTH, not the control. Measured: with it
			// disabled, `@property` is still dropped, because this dispatch is an
			// allow-list — only the rule kinds named above are re-emitted, and
			// anything unrecognised falls off the end of the walk. That is what
			// also handles at-rules nobody has thought of yet (@counter-style,
			// @view-transition, whatever ships next).
			//
			// It is kept because the allow-list property is easy to lose: a future
			// "preserve anything we don't understand" fallthrough would silently
			// reopen this. scripts/sanitizer-attack.mjs negative-controls exactly
			// that regression, and it is the branch below — not this one — that
			// the test actually pins.
			continue;
		}

		if (rule instanceof CSSFontFaceRule) {
			target.insertRule(rule.cssText, target.cssRules.length);
			continue;
		}

		if (isGroupingContainer(rule)) {
			// @media, @supports, @layer (nested) — walk their children into a
			// same-kind empty shell inserted into target, preserving nesting.
			const shellIndex = target.insertRule(emptyShellFor(rule), target.cssRules.length);
			const shell = target.cssRules[shellIndex];
			if (shell && isGroupingContainer(shell)) {
				rebuildInto(rule.cssRules, shell, keyframes, hoisted);
			}
			continue;
		}

		// THIS FALLTHROUGH IS THE SECURITY PROPERTY, not a loose end.
		//
		// The dispatch above is an ALLOW-LIST: a rule kind reaches the output
		// only by being named and re-emitted. Everything else — @import (which
		// replaceSync already drops per spec), @charset/@namespace/@page/
		// @viewport (inert on a constructed sheet), @property, and every
		// at-rule the CSS WG has not shipped yet — is silently omitted because
		// no branch claims it.
		//
		// Do NOT add a "preserve anything we don't recognise" fallthrough here.
		// It reads like a kindness to theme authors and is the single change
		// that would convert this module from an allow-list back into the
		// blocklist the string-rewriting design failed as.
		// scripts/sanitizer-attack.mjs negative-controls precisely this.
	}
}

function isPropertyRule(rule: CSSRule): boolean {
	return typeof CSSPropertyRule !== "undefined" && rule instanceof CSSPropertyRule;
}

/** A rule that groups other rules and is not itself a style/keyframes/font-face/property rule. */
function isGroupingContainer(
	rule: CSSRule,
): rule is CSSRule & { readonly cssRules: CSSRuleList; insertRule(rule: string, index?: number): number } {
	return (
		(rule instanceof CSSMediaRule || rule instanceof CSSSupportsRule || rule instanceof CSSLayerBlockRule) &&
		!(rule instanceof CSSStyleRule)
	);
}

/** Build an empty version of a grouping rule's opening (its condition/prelude) with no body, for insertRule. */
function emptyShellFor(rule: CSSRule): string {
	if (rule instanceof CSSMediaRule) return `@media ${rule.media.mediaText} {}`;
	if (rule instanceof CSSSupportsRule) return `@supports ${rule.conditionText} {}`;
	if (rule instanceof CSSLayerBlockRule) {
		return rule.name ? `@layer ${rule.name} {}` : `@layer {}`;
	}
	// Unreachable given isGroupingContainer's guard, but keeps this function total.
	return "@media all {}";
}

/**
 * First pass over the FLAT top-level rule list (recursing into grouping
 * rules) to collect every `@keyframes` name declared anywhere in the theme,
 * assign each its prefixed form, and rewrite the `CSSKeyframesRule`'s own
 * `name` in place before the rebuild pass runs. Doing the rename before the
 * rebuild — rather than rewriting `cssText` textually afterward — means the
 * keyframes rule that reaches `rebuildInto` is already correct and needs no
 * special-casing there.
 */
function collectAndRenameKeyframes(rules: CSSRuleList, themeId: string, into: Map<string, string>): void {
	for (let i = 0; i < rules.length; i++) {
		const rule = rules[i];
		if (!rule) continue;
		if (rule instanceof CSSKeyframesRule) {
			const original = rule.name;
			const prefixed = `${keyframesPrefix(themeId)}${original}`;
			into.set(original, prefixed);
			rule.name = prefixed;
			continue;
		}
		if (isGroupingContainer(rule)) {
			collectAndRenameKeyframes(rule.cssRules, themeId, into);
		}
	}
}

// ---------------------------------------------------------------------------
// Hoist emission
// ---------------------------------------------------------------------------

function emitHoistedAppRule(hoisted: HoistedTokens): string {
	if (hoisted.size === 0) return "";
	const declarations = Array.from(hoisted, ([prop, value]) => `${prop}: ${value};`).join(" ");
	return `.app { ${declarations} }`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Sanitize a theme's raw CSS text for safe injection into the app's page.
 *
 * `themeId` must already be a slugified id (see `slugifyThemeId` in
 * `parse-theme-css.ts`) — it is interpolated into the `@keyframes` prefix and
 * is not itself re-validated here, since callers already run every theme id
 * through that slugifier before a theme is installed.
 *
 * Never throws. Call at injection time (see file header for why), not once
 * at import/install time.
 */
export function sanitizeThemeCss(css: string, themeId: string): SanitizeResult {
	const byteLength = new TextEncoder().encode(css).length;
	if (byteLength > MAX_THEME_CSS_BYTES) {
		return { ok: false, issue: { kind: "too-large", bytes: byteLength, limit: MAX_THEME_CSS_BYTES } };
	}

	if (!supportsScope()) {
		// Fail closed. Falling back to @layer-only containment would serve a
		// boundary measured NOT to contain (see file header / issue notes):
		// `@layer user { :root { --chrome-bg: red } }` repaints all app chrome
		// with no !important needed, because --chrome-* is declared inside
		// `@layer base` and a later layer outranks it unconditionally.
		return { ok: false, issue: { kind: "unsupported-scope" } };
	}

	const source = new CSSStyleSheet();
	try {
		source.replaceSync(css);
	} catch {
		// replaceSync does not throw on malformed CSS (invalid rules are simply
		// omitted per the CSS Syntax spec), so this branch is defensive rather
		// than expected to fire in practice.
		return { ok: false, issue: { kind: "parse-failed" } };
	}

	const keyframeNames = new Map<string, string>();
	collectAndRenameKeyframes(source.cssRules, themeId, keyframeNames);
	const keyframes: KeyframeRenames = { names: keyframeNames, prefix: keyframesPrefix(themeId) };

	const output = new CSSStyleSheet();
	const scopeShellIndex = output.insertRule(`@scope (${SCOPE_ROOT_SELECTOR}) { @layer user {} }`, 0);
	const scopeRule = output.cssRules[scopeShellIndex];
	if (!(scopeRule instanceof CSSScopeRule)) {
		return { ok: false, issue: { kind: "unsupported-scope" } };
	}
	const layerRule = scopeRule.cssRules[0];
	if (!(layerRule instanceof CSSLayerBlockRule)) {
		return { ok: false, issue: { kind: "unsupported-scope" } };
	}

	const hoisted: HoistedTokens = new Map();
	rebuildInto(source.cssRules, layerRule, keyframes, hoisted);

	const scopedCss = scopeRule.cssText;
	const hoistedCss = emitHoistedAppRule(hoisted);
	const result = hoistedCss ? `${scopedCss}\n${hoistedCss}` : scopedCss;
	return { ok: true, css: result };
}

/** Exposed for tests that need the vocabulary without hand-copying it. */
export const hoistableMdTokensForTesting: ReadonlySet<string> = HOISTABLE_MD_TOKENS;
