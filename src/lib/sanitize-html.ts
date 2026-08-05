/**
 * The sanitization choke point for rendered markdown.
 *
 * A `.md` file is untrusted input — it arrives by email, by clone, by drag and
 * drop — and its rendered HTML is injected into a live Tauri webview that has
 * `invoke` in scope. Before this module existed, the CSP's `script-src 'self'`
 * was the SINGLE control standing between a hostile document and script
 * execution. That is not defence in depth: one future CSP relaxation, made for
 * an unrelated reason, would silently turn a latent bug into RCE.
 *
 * ## Why DOMPurify rather than the hand-rolled approach `sanitize-theme-css.ts` took
 *
 * The theme-CSS sanitizer is dependency-free because CSSOM handed it a
 * complete, native, spec-correct parser whose output it could rebuild from.
 * HTML has no equivalent. `DOMParser` yields a tree, but the tree is only half
 * the problem — the other half is knowing which of ~120 HTML, ~30 SVG and ~50
 * MathML elements and their attribute sets are safe, plus the namespace
 * integration-point rules that let a parser re-interpret nodes on
 * reserialization (mXSS). That is browser-parser-quirk knowledge which this
 * codebase cannot generate or keep current, and cure53 maintains it against a
 * continuously updated corpus. Reasoning by analogy from the CSS sanitizer to
 * "therefore hand-roll this too" would have been a mistake.
 *
 * ## Why the choke point is here and not at the `{@html}` site
 *
 * `renderMarkdown()` is already the single funnel — `files.ts` (`openFile`,
 * `handleFileChanged`) is the only producer of `Tab.rendered`. Sanitizing at
 * the producer makes "this string is sanitized" an INVARIANT of the value
 * rather than an obligation on every consumer to remember. There are three
 * consumers today (`+page.svelte`'s `{@html}`, `ThemePreview.svelte`'s shadow
 * root, and the Storybook seed), and per-consumer obligation is precisely the
 * shape that produced the original bug.
 *
 * The `SanitizedHtml` brand turns that invariant into a compile-time check, so
 * a fourth sink cannot be added with raw input without `pnpm check` failing.
 *
 * ## What this module does NOT cover
 *
 * Mermaid's generated SVG (`mermaid.ts`) does not pass through here — it is
 * produced asynchronously in the DOM long after `renderMarkdown` returned.
 * That boundary is delegated to mermaid's own `securityLevel: "strict"`, made
 * explicit at its `initialize()` call. See the comment there; the two must be
 * read together.
 */
import createDOMPurify, { type Config } from "dompurify";

/**
 * HTML that has passed through `sanitizeHtml`.
 *
 * A branded string: assignable TO `string`, but a plain `string` is NOT
 * assignable to it. That asymmetry is the whole point — it makes the sink
 * signatures (`{@html}` consumers, `Tab.rendered`, `ThemePreview`) reject
 * unsanitized input at compile time rather than at review time.
 *
 * The brand is phantom; nothing exists at runtime and the value is an ordinary
 * string. `sanitizeHtml` below is the ONLY place it may be minted.
 */
export type SanitizedHtml = string & { readonly __sanitized: unique symbol };

/**
 * The allow-list, derived by measuring what this repo's pipeline actually
 * emits — not from documentation.
 *
 * Exported so `scripts/sanitizer-attack.mjs` runs the SAME object the app
 * ships. A config hand-copied into the harness is a second source of truth
 * that drifts, and a drifted harness reports green on a config nobody runs.
 */
export const SANITIZE_CONFIG = {
	// `mathMl` is required for KaTeX; `svg`/`svgFilters` for KaTeX's stretchy
	// delimiters, which are drawn as inline `<svg><path>` rather than glyphs.
	USE_PROFILES: { html: true, svg: true, svgFilters: true, mathMl: true },

	// MEASURED, and the highest-ranked risk in this change: DOMPurify strips
	// `<semantics>` and `<annotation>` under its default config AND under the
	// explicit MathML profile — both report `removed.length === 2`. Those two
	// carry KaTeX's `annotation encoding="application/x-tex"` payload: the
	// machine-readable LaTeX source that assistive tech and copy-paste use.
	//
	// The failure is invisible without this line. `<math>`, `<mrow>`, `<mfrac>`
	// and the `.katex-html` spans all survive, so the equation still renders
	// pixel-perfectly — only the semantics are gone. No visual test can catch
	// it, which is why `sanitize-html.test.ts` asserts on these tag names
	// directly and the tier-2 harness re-asserts it in a real engine.
	ADD_TAGS: ["semantics", "annotation"],

	// Markdown never legitimately produces a form. A rendered document that can
	// present a credential prompt is a phishing surface, and it looks exactly as
	// trustworthy as the rest of the file.
	//
	// `input` is deliberately ABSENT from this list: GFM task lists (`- [x]`)
	// render as `<input type="checkbox" disabled checked>`, which is a real
	// feature. Measured — with `form` forbidden, a hostile form collapses to a
	// bare inert `<input>`: no submission target, no scriptable attribute, and
	// `form-action 'none'` in the CSP neuters any residue.
	FORBID_TAGS: [
		"form",
		"button",
		"textarea",
		"select",
		"option",
		"fieldset",
		"legend",
		"label",
	],

	// `formaction`/`form` can re-associate a control with a form elsewhere in
	// the document; `name` is what makes a control submit a value at all.
	//
	// `autofocus` is here because it is the one thing a surviving bare `<input>`
	// could still do: measured, an injected `<input autofocus>` really does take
	// focus on open (`document.activeElement === "INPUT"`), which is the polish
	// a `<input type="password" placeholder="Enter your password">` phishing
	// document wants. GFM task lists never emit it, so forbidding it is free.
	FORBID_ATTR: ["formaction", "form", "name", "autofocus"],
	// `satisfies`, not a type annotation: it proves the object is a valid
	// `Config` while keeping the inferred literal types. Annotating it `Config`
	// would widen `RETURN_DOM` to `boolean | undefined` and lose the proof that
	// `sanitize()` returns a string here — see the note in `sanitizeHtml`.
} satisfies Config;

/**
 * jsdom and the Tauri webview both provide a real `window`, so the default
 * export is already bound to one. Held at module level because constructing a
 * DOMPurify instance builds its allow-list tables — that is per-instance work,
 * not per-call, and this runs on every keystroke-triggered live reload.
 */
const purify = createDOMPurify;

/**
 * Sanitize rendered-markdown HTML for injection into the document.
 *
 * Never throws: a render that produced HTML must still display something, and
 * a sanitizer that can throw would turn a malformed document into a blank tab.
 * DOMPurify returns `""` for input it cannot parse at all, which is the
 * correct fail-closed outcome.
 *
 * COST, measured in the real engines: 3.9ms (Chromium) / 6.1ms (WebKit) for
 * rendered `test.md` (~57KB), against a 150ms live-reload debounce. Noise.
 * Do NOT profile this under vitest and act on the result — jsdom's parser
 * reports ~24ms for the same input, a 4-6x environment artifact that would
 * invite an optimization the shipping engines do not need.
 *
 * This is the ONE place `SanitizedHtml` is minted. The cast below is the
 * boundary between "some string" and "checked"; do not add another.
 */
export function sanitizeHtml(html: string): SanitizedHtml {
	// `sanitize()`'s return type is overloaded on the config: `RETURN_DOM` gives
	// a `Node`, `RETURN_TRUSTED_TYPE` a `TrustedHTML`, otherwise a `string`.
	// `SANITIZE_CONFIG` keeps its literal types (via `satisfies` rather than an
	// annotation) precisely so TypeScript can still pick the string overload
	// here. Adding either flag to the config would break this line rather than
	// silently handing a DOM node, typed as a string, to every injection site.
	return purify.sanitize(html, SANITIZE_CONFIG) as SanitizedHtml;
}

/**
 * Assert that a string produced OUTSIDE the markdown pipeline is safe to
 * inject, without re-sanitizing it.
 *
 * Callers are frozen author-written literals in this repo, never user input:
 * `sample-markdown.ts`'s `sampleMarkdownHtml` (the Storybook design
 * explorations' fixture) and `ThemePreview.svelte`'s `SAMPLE_HTML` (shown when
 * no document is open). Running either through `sanitizeHtml` would be theatre
 * — they are trusted because of where they come from, not because of a check.
 *
 * Naming it `trustedConstant` rather than `asSanitized` is deliberate: a
 * future caller reaching for this has to type the word "constant" and justify
 * it. If the argument is not a literal in this repo, this is the wrong
 * function and `sanitizeHtml` is the right one.
 */
export function trustedConstant(html: string): SanitizedHtml {
	return html as SanitizedHtml;
}
