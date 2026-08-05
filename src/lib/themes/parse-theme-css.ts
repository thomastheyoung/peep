/**
 * Shared CSS-parsing core for theme preview swatches.
 *
 * `scripts/extract-theme-colors.ts` (build time, bundled themes) and the
 * user-theme importer (runtime, `.css` files dropped in by a user — see
 * peep-bnw/e9b) both need to turn a theme's `.app` rule into a
 * `{ bg, text, accent }` swatch. Duplicating this logic between a build
 * script and app code would recreate exactly the drift `theme-colors.ts`
 * exists to prevent: two copies of "how do we read a theme's color" that can
 * silently disagree.
 *
 * Dependency-free on purpose: no `$lib` alias, no Svelte, no runes. That is
 * what lets `node scripts/extract-theme-colors.ts` run this file directly
 * (Node 24's `process.features.typescript === "strip"` erases the types with
 * no build step) while the exact same module also bundles into the app via
 * Vite for the runtime importer.
 */

// ---------------------------------------------------------------------------
// Swatch extraction — ported CHARACTER-FOR-CHARACTER (logic, not syntax) from
// the original `scripts/extract-theme-colors.js` (now `.ts`). Only types were
// added; do not "clean up" the control flow without re-running the build and
// diffing `theme-colors.ts`, since these functions are what keeps every
// existing preview swatch pixel-identical.
// ---------------------------------------------------------------------------

/** Grab the body of the first `.app { ... }` rule, whatever layer wraps it. */
export function appRuleBody(css: string): string {
	const match = css.match(/\.app\s*\{([^}]*)\}/);
	return match ? (match[1] ?? "") : "";
}

/** Read a single declaration's value out of a rule body. */
export function declaration(body: string, prop: string): string | null {
	// Escape `--` custom props for use in a regex; prop names are literal here.
	const re = new RegExp(`(?:^|;)\\s*${prop.replace(/[-]/g, "\\-")}\\s*:\\s*([^;]+)`, "i");
	const match = body.match(re);
	return match ? (match[1] ?? "").trim() : null;
}

/**
 * A swatch is a single solid color, but several themes paint `.app` with
 * gradients (some spanning multiple lines and multiple layers). Reduce such a
 * value to the one color that best represents the theme's page.
 *
 * Two CSS facts drive this, and getting either wrong produces a swatch that
 * misrepresents the theme:
 *
 *  1. Comma-separated background layers paint front-to-back, so the LAST layer
 *     is the bottom-most — the page color. handwritten.css draws
 *     `repeating-linear-gradient(… #e8e0d4 …), #fffff8`: the rules are on top
 *     and #fffff8 is the paper. Taking the first stop would report the rule
 *     color as the background.
 *  2. A solid final layer is the answer outright; when the last layer is itself
 *     a gradient (glassmorphism, tropical-sunset), its first stop is the
 *     representative color — matching what the registry listed by hand.
 *
 * Near-transparent stops are skipped throughout: vaporwave layers
 * `rgba(255,255,255,0.03)` scanlines, which would otherwise read as white.
 */
export function toSolidColor(value: string | null): string | null {
	if (!value) return null;
	const flat = value.replace(/\s+/g, " ").trim();
	if (!/gradient\(/i.test(flat)) return flat;

	const COLOR = /#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/gi;
	const visible = (c: string): boolean => {
		const alpha = c.match(/^(?:rgba|hsla)\([^)]*?,\s*([\d.]+)\s*\)$/i);
		return !alpha || Number(alpha[1]) >= 0.5;
	};

	// Split top-level layers on commas that are not inside gradient parens.
	const layers: string[] = [];
	let depth = 0;
	let start = 0;
	for (let i = 0; i < flat.length; i++) {
		const ch = flat[i];
		if (ch === "(") depth++;
		else if (ch === ")") depth--;
		else if (ch === "," && depth === 0) {
			layers.push(flat.slice(start, i));
			start = i + 1;
		}
	}
	layers.push(flat.slice(start));

	// Bottom-most layer first, then upward if it yields no usable color.
	for (const layer of layers.reverse()) {
		const stops = (layer.match(COLOR) ?? []).filter(visible);
		const first = stops[0];
		if (first) return first;
	}
	return null;
}

/**
 * Resolve one swatch channel: prefer the token, fall back to the legacy
 * property. Returns null when neither is present so the caller can report
 * exactly which theme and channel failed rather than emitting a bad color.
 */
export function channel(body: string, tokenProp: string, legacyProp: string | null): string | null {
	const raw = declaration(body, tokenProp) ?? (legacyProp ? declaration(body, legacyProp) : null);
	return toSolidColor(raw);
}

// ---------------------------------------------------------------------------
// Public swatch/frontmatter types
// ---------------------------------------------------------------------------

export interface ThemeColors {
	readonly bg: string;
	readonly text: string;
	readonly accent: string;
}

export interface ThemeFrontmatter {
	readonly name: string;
	readonly description: string;
	readonly author: string;
}

export interface ParsedTheme {
	readonly frontmatter: ThemeFrontmatter;
	readonly swatch: ThemeColors;
}

export type ParseIssue =
	| { readonly kind: "no-app-rule" }
	| { readonly kind: "unresolved-channel"; readonly channel: keyof ThemeColors }
	| { readonly kind: "missing-frontmatter" }
	| { readonly kind: "partial-frontmatter"; readonly missing: readonly (keyof ThemeFrontmatter)[] };

export type ParseResult =
	| { readonly ok: true; readonly frontmatter: ThemeFrontmatter; readonly swatch: ThemeColors }
	| { readonly ok: false; readonly issues: readonly ParseIssue[] };

// ---------------------------------------------------------------------------
// Frontmatter
//
// A theme file may open with a `/*! @name … @description … @author … */`
// block, e.g.:
//
//   /*! @name Ink & Brush
//       @description Sumi-e brushwork headings on rice-paper texture.
//       @author peep */
//
// `/*!` (not `/*`) is deliberate: minifiers that strip comments by default
// leave `/*! … */` alone (the convention license banners use), so frontmatter
// surviving a build pipeline is not an accident to preserve — don't "clean
// up" the bang.
//
// The grammar is deliberately narrow because this parses untrusted input
// (imported user themes, peep-bnw/e9b): only the first block
// within the first 4KB is considered, and only three fields are recognized.
// Field values are trimmed, stripped of control characters, and length-capped
// — Svelte escapes on render so this is not an XSS boundary, but an
// unbounded name would blow out the `.theme-grid` layout.
// ---------------------------------------------------------------------------

const FRONTMATTER_SCAN_WINDOW = 4096;
const MAX_NAME_LENGTH = 64;
const MAX_DESCRIPTION_LENGTH = 200;
const MAX_AUTHOR_LENGTH = 64;

/** Strip C0/C1 control characters (everything but the trim-worthy whitespace already handled by `.trim()`). */
function stripControlChars(value: string): string {
	// The control-character class is deliberate, not a stray paste: these values
	// are rendered as text in the theme picker, and a stray \x00 or \x1b would
	// travel through unnoticed.
	return value.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]/g, "");
}

function sanitizeField(raw: string, maxLength: number): string {
	return stripControlChars(raw).trim().slice(0, maxLength);
}

/**
 * Extract the `/*! … *\/` frontmatter block, if any, from a theme file.
 * Returns `null` when no such block STARTS within the first 4KB — a block
 * beginning later is treated as no block at all, since a legitimate
 * frontmatter comment belongs at the top of the file.
 *
 * The window bounds where the block may START, not where it must END. Slicing
 * the string first and matching the slice would also drop a block that opens
 * at byte 4090 and closes at 4200 — it would be cut in half and silently read
 * as absent, which is a different rule than the one documented above. Matching
 * the full string and then checking `index` keeps the two in agreement.
 */
function frontmatterBlock(css: string): string | null {
	const match = css.match(/\/\*!([\s\S]*?)\*\//);
	if (!match || match.index === undefined || match.index >= FRONTMATTER_SCAN_WINDOW) return null;
	return match[1] ?? "";
}

/**
 * Parse `@name` / `@description` / `@author` lines out of a frontmatter block
 * body. Each field is matched independently, so field order doesn't matter and
 * an unrecognized `@foo` line is silently ignored rather than failing the whole
 * block.
 *
 * Every tag MUST be anchored to the start of its own line (`^…$` with the `m`
 * flag). Without the anchor each regex scans the whole block and takes its
 * first hit anywhere — including inside another field's VALUE. A theme whose
 * description legitimately mentions one of these tags then has its name or
 * author scraped out of the middle of that sentence:
 *
 *   @description Uses @name Foo internally
 *   @name Real
 *
 * unanchored yields name "Foo internally", not "Real". This matters because
 * this parser's whole reason to exist is reading imported user themes, and the
 * failure is silent: all three fields resolve, so `parseThemeCss` returns
 * `ok: true` and neither caller's failure policy ever fires. Wrong data that
 * looks valid is worse than a parse error.
 *
 * `[\s*]*` allows the leading indentation and `*`-prefixed comment style real
 * blocks use. The separator is `[ \t]+` rather than `\s+` so it cannot itself
 * swallow a newline and re-open the same hole.
 *
 * Values are single-line by construction (`.` does not match newlines): a
 * wrapped `@description` silently keeps only its first line. Nothing shipped
 * comes close to the 200-char cap, but continuation is not supported.
 */
function parseFrontmatterFields(block: string): Partial<ThemeFrontmatter> {
	const fields: { name?: string; description?: string; author?: string } = {};

	const nameMatch = block.match(/^[\s*]*@name[ \t]+(.+)$/m);
	if (nameMatch?.[1]) fields.name = sanitizeField(nameMatch[1], MAX_NAME_LENGTH);

	const descriptionMatch = block.match(/^[\s*]*@description[ \t]+(.+)$/m);
	if (descriptionMatch?.[1]) fields.description = sanitizeField(descriptionMatch[1], MAX_DESCRIPTION_LENGTH);

	const authorMatch = block.match(/^[\s*]*@author[ \t]+(.+)$/m);
	if (authorMatch?.[1]) fields.author = sanitizeField(authorMatch[1], MAX_AUTHOR_LENGTH);

	return fields;
}

/**
 * Rewrite (or introduce) a theme CSS file's frontmatter `@name` field.
 *
 * Exists because duplicating a theme without rewriting its frontmatter
 * produces two identically-labelled cards in the theme picker — `id`s are
 * disambiguated by `resolveThemeId`, but the *display name* users actually
 * read comes from `@name`, which `deriveImportId`/`user-theme.ts` both read
 * straight off the copied file. `nameThemeFlow` (preferences.svelte.ts)
 * applies this to the source CSS before writing the copy, so the new card is
 * labelled with whatever the user typed rather than the original's name.
 *
 * Three shapes, each handled without disturbing anything else in the file:
 *  - Frontmatter present WITH `@name`: only that line's value is replaced,
 *    using the SAME anchored `^[\s*]*@name[ \t]+(.+)$` / `m` pattern
 *    `parseFrontmatterFields` reads with — see its doc comment for why an
 *    unanchored match is a correctness bug, not a style preference. Matching
 *    with the identical pattern (rather than something merely "close enough")
 *    is what guarantees this function rewrites the exact line that function
 *    would have read, including under the adversarial input each guards
 *    against (a `@name`-looking string inside `@description`'s value).
 *  - Frontmatter present WITHOUT `@name`: a new `@name` line is inserted at
 *    the top of the existing block, leaving `@description`/`@author`/unknown
 *    fields untouched.
 *  - No frontmatter block at all (per `frontmatterBlock`'s own 4KB-window,
 *    first-block-only rules): a new minimal block is prepended.
 *
 * `name` is user-typed text embedded inside a `/*! … *\/` CSS comment, and it
 * gets TWO escapes beyond `parseFrontmatterFields`'s control-char strip and
 * length cap. Both were found by review after an earlier version of this
 * comment argued, wrongly, that neither was needed:
 *
 *  1. **`*\/` is removed.** The earlier reasoning was that `*` and `/` "cannot
 *     close a block comment without the other adjacent" — true, and irrelevant,
 *     because the user can simply TYPE the two characters adjacent. Measured:
 *     a name of `Evil *\/ .app{display:none} /*` ended the comment early and
 *     left a live CSS rule in the file, swallowing `@description`/`@author`
 *     into a reopened comment. `parseThemeCss` then rejects the user's own
 *     theme file. Not XSS — `sanitizeThemeCss` still wraps everything at load
 *     — but it silently corrupts a file the user hand-authored.
 *  2. **The rewrite goes through a replacer FUNCTION, not a string.**
 *     `String.replace` interprets `$1`, `$&`, `` $` `` and `$'` in the
 *     REPLACEMENT, so a name of `$&` resurrected the previous name and
 *     `A$1B$&C` duplicated the whole block. Only the rewrite branch was
 *     affected; the insert branch below uses plain interpolation, which is why
 *     a test over frontmatter-less CSS would not have caught it.
 *
 * Length-capping matters independently: an unbounded name would blow out both
 * this block and the `.theme-grid` layout.
 */
export function withFrontmatterName(css: string, name: string): string {
	// Strip BOTH comment delimiters after the control-char/length pass. `*/`
	// is the escape itself (rule 1 above). `/*` has to go too: a lone opener
	// left inside the block does not escape it — CSS comments do not nest, so
	// the browser still ends the comment at the first `*/` — but it desyncs
	// this file's own frontmatter scanner, and a theme named
	// `Evil */ .app{display:none} /*` came back `ok: false` with
	// `unresolved-channel: bg` even after the closer was removed. A theme NAME
	// has no legitimate use for either sequence, so removing both is free.
	const safeName =
		sanitizeField(name, MAX_NAME_LENGTH).replace(/\*\/|\/\*/g, "") || "Untitled";

	const match = css.match(/\/\*!([\s\S]*?)\*\//);
	const hasBlock = match && match.index !== undefined && match.index < FRONTMATTER_SCAN_WINDOW;

	if (!hasBlock) {
		return `/*! @name ${safeName} */\n${css}`;
	}

	// `match.index`/`match[0]` are guaranteed by `hasBlock` above (both parts
	// of the `&&` reference the same `match`), but TS can't see that guarantee
	// survive past the `if`, so re-derive locally rather than asserting past it.
	const blockStart = match.index as number;
	const blockBody = match[1] ?? "";
	const blockFullMatch = match[0];
	const bodyOffset = blockStart + "/*!".length;

	const nameLineRe = /^([\s*]*@name[ \t]+).+$/m;
	const nameLineMatch = blockBody.match(nameLineRe);

	let newBody: string;
	if (nameLineMatch) {
		// Replacer FUNCTION, not a replacement string — see rule 2 above. A
		// string here would interpret `$1`/`$&`/`` $` ``/`$'` inside safeName.
		newBody = blockBody.replace(nameLineRe, (_full, prefix: string) => `${prefix}${safeName}`);
	} else {
		// No @name line to rewrite — insert one at the top of the block body,
		// ahead of whatever fields (or prose) are already there.
		newBody = ` @name ${safeName}\n${blockBody}`;
	}

	const before = css.slice(0, bodyOffset);
	const after = css.slice(blockStart + blockFullMatch.length);
	return `${before}${newBody}*/${after}`;
}

const FRONTMATTER_KEYS: readonly (keyof ThemeFrontmatter)[] = ["name", "description", "author"];

/**
 * Parse a theme's frontmatter, reporting which of the three fields (if any)
 * are missing. A block with all three fields present resolves; anything else
 * — no block, or a block missing one or more fields — is reported as an
 * issue so the two callers can apply their own policy (build: hard error;
 * runtime: fall back to a title-cased slug, see NOTES on `slugifyThemeId`).
 */
function parseFrontmatter(css: string): { readonly frontmatter: ThemeFrontmatter } | { readonly issue: ParseIssue } {
	const block = frontmatterBlock(css);
	if (block === null) return { issue: { kind: "missing-frontmatter" } };

	const fields = parseFrontmatterFields(block);
	const missing = FRONTMATTER_KEYS.filter((key) => !fields[key]);
	if (missing.length > 0) return { issue: { kind: "partial-frontmatter", missing } };

	const { name, description, author } = fields;
	// `missing.length === 0` guarantees all three were present, but that fact
	// lives in a runtime filter TS cannot see through — narrow explicitly
	// rather than assert past it.
	if (!name || !description || !author) return { issue: { kind: "partial-frontmatter", missing: FRONTMATTER_KEYS } };
	return { frontmatter: { name, description, author } };
}

// ---------------------------------------------------------------------------
// Swatch resolution (build on the ported primitives above)
// ---------------------------------------------------------------------------

function parseSwatch(css: string): { readonly swatch: ThemeColors } | { readonly issue: ParseIssue } {
	const body = appRuleBody(css);
	if (!body) return { issue: { kind: "no-app-rule" } };

	const bg = channel(body, "--md-bg", "background");
	if (!bg) return { issue: { kind: "unresolved-channel", channel: "bg" } };

	const text = channel(body, "--md-text", "color");
	if (!text) return { issue: { kind: "unresolved-channel", channel: "text" } };

	const accent = channel(body, "--md-accent", null);
	if (!accent) return { issue: { kind: "unresolved-channel", channel: "accent" } };

	return { swatch: { bg, text, accent } };
}

/**
 * Parse a theme CSS file into frontmatter + swatch. Never throws — the build
 * script and the runtime user-theme importer need opposite failure policy
 * (fail-hard vs. degrade-with-a-warning), and a `Result` can be turned into a
 * throw in three lines (`assertParsed`, below) but not the reverse. Callers
 * that need every possible issue (e.g. to render several warnings) get the
 * full list; callers that just need a yes/no get `result.ok`.
 */
export function parseThemeCss(css: string): ParseResult {
	const issues: ParseIssue[] = [];

	const swatchResult = parseSwatch(css);
	if ("issue" in swatchResult) issues.push(swatchResult.issue);

	const frontmatterResult = parseFrontmatter(css);
	if ("issue" in frontmatterResult) issues.push(frontmatterResult.issue);

	if ("issue" in swatchResult || "issue" in frontmatterResult) {
		return { ok: false, issues };
	}
	return { ok: true, frontmatter: frontmatterResult.frontmatter, swatch: swatchResult.swatch };
}

function describeIssue(issue: ParseIssue): string {
	switch (issue.kind) {
		case "no-app-rule":
			return "no .app rule found";
		case "unresolved-channel":
			return `could not resolve '${issue.channel}' from the .app rule`;
		case "missing-frontmatter":
			return "no /*! @name … */ frontmatter block found in the first 4KB";
		case "partial-frontmatter":
			return `frontmatter is missing: ${issue.missing.join(", ")}`;
	}
}

/**
 * The throwing adapter the build script uses: a missing swatch or
 * frontmatter field for a *bundled* theme is a bug that must fail the build,
 * not ship a blank preview or an unlabeled theme.
 */
export function assertParsed(css: string, file: string): ParsedTheme {
	const result = parseThemeCss(css);
	if (!result.ok) {
		const reasons = result.issues.map(describeIssue).join("; ");
		throw new Error(`${file}: ${reasons}`);
	}
	return { frontmatter: result.frontmatter, swatch: result.swatch };
}

// ---------------------------------------------------------------------------
// Theme ids
// ---------------------------------------------------------------------------

const MAX_SLUG_LENGTH = 64;

/**
 * Turn an arbitrary string (a filename stem, a frontmatter `@name`) into a
 * safe theme id: lowercase, runs of non-`[a-z0-9]` collapsed to a single `-`,
 * leading/trailing `-` trimmed, capped at 64 chars.
 *
 * MUST NEVER return `""`. A file named `___.css` slugifies its stem to
 * nothing; if that empty string became the id, the command palette would
 * build the command id `theme:` (see `CommandPalette.svelte`, which splits
 * ids on `:` and requires exactly two parts) — `"theme:".split(":")` is
 * `["theme", ""]`, a *valid* two-part split, so nothing throws. The palette
 * would resolve a theme id of `""`, look it up, find nothing, and render a
 * blank preview with no error anywhere. Falling back to the literal string
 * `"theme"` keeps the id non-empty and keeps that failure loud instead of
 * silent (a `"theme"` id colliding with something is at least visible;
 * `resolveThemeId` also disambiguates it like any other collision).
 *
 * MUST NEVER emit a colon, for the same reason `CommandPalette.svelte`'s
 * split needs exactly two parts — collapsing non-`[a-z0-9]` runs (which
 * includes `:`) to `-` already guarantees this.
 */
export function slugifyThemeId(raw: string): string {
	const slug = raw
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, MAX_SLUG_LENGTH)
		// Slicing a fixed length can leave a trailing `-` mid-run; trim once more.
		.replace(/-+$/g, "");
	return slug || "theme";
}

/**
 * Resolve `candidate` against a set of already-taken ids by suffixing
 * `-2`, `-3`, … until free. Collisions are expected: two files with
 * different casing or punctuation can slugify to the same id, and imported
 * user themes can collide with a built-in id.
 *
 * `-2` rather than `-1`: the unsuffixed id is not "1 of n", so `-2` reads as
 * "the second one", matching Finder and browser download naming.
 *
 * PURE — it does NOT add the result to `taken`. A caller resolving several ids
 * in a loop must insert each result itself, or it will hand out the same id
 * twice and nothing will catch it.
 */
export function resolveThemeId(candidate: string, taken: ReadonlySet<string>): string {
	if (!taken.has(candidate)) return candidate;

	let attempt = 2;
	let next = `${candidate}-${attempt}`;
	while (taken.has(next)) {
		attempt += 1;
		next = `${candidate}-${attempt}`;
	}
	return next;
}
