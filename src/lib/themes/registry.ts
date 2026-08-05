import type { BuiltinTheme } from "./types";
import type { SanitizeResult } from "./sanitize-theme-css";
import { themeColors } from "./theme-colors";

/**
 * Wraps a builtin's raw CSS import in the same `SanitizeResult` shape user
 * themes resolve (see the WHY comment on `ThemeMetaBase.load` in `types.ts`).
 * Always `ok: true`: builtin CSS is checked in, not untrusted input from a
 * user's filesystem, so it cannot fail sanitization — but it still goes
 * through the shared shape so `theme.svelte.ts` has exactly one code path
 * for "apply a theme," not a builtin-only fast lane plus a user-theme path.
 */
function builtinLoad(css: Promise<string>): Promise<SanitizeResult> {
	return css.then((css) => ({ ok: true, css }) as const);
}

/**
 * Theme definitions. Preview swatches are NOT authored here — they are read
 * out of each theme's own CSS by `scripts/extract-theme-colors.ts` (run via
 * `pnpm gen:theme-colors`) and merged in below, so a swatch cannot disagree
 * with what the theme actually paints.
 *
 * Adding a theme: add the .css file, add an entry here, run the generator.
 * The generator throws if a theme's `.app` rule has no resolvable color, so a
 * missing palette fails the build rather than shipping a blank swatch.
 *
 * Deliberately curated, not exhaustive: every additional theme is a permanent
 * tax on every future `base.css` token change, paid via the real-Chromium
 * diff harness (`pnpm diff:themes`). The other themes shipped here previously
 * were moved to `/themes` at the repo root, not deleted — peep-rgm
 * turns that into a browsable gallery.
 *
 * Order matters: index 0 is the default theme (see `theme.svelte.ts`).
 */
const definitions = [
	{
		id: "github-dark",
		name: "GitHub Dark",
		source: "builtin",
		load: () => builtinLoad(import("./themes/github-dark.css?raw").then((m) => m.default)),
	},
	{
		id: "github-light",
		name: "GitHub Light",
		source: "builtin",
		load: () => builtinLoad(import("./themes/github-light.css?raw").then((m) => m.default)),
	},
	{
		id: "neo-brutalist",
		name: "Neo Brutalist",
		source: "builtin",
		load: () => builtinLoad(import("./themes/neo-brutalist.css?raw").then((m) => m.default)),
	},
	{
		id: "pastel-dream",
		name: "Pastel Dream",
		source: "builtin",
		load: () => builtinLoad(import("./themes/pastel-dream.css?raw").then((m) => m.default)),
	},
	{
		id: "swiss-design",
		name: "Swiss Design",
		source: "builtin",
		load: () => builtinLoad(import("./themes/swiss-design.css?raw").then((m) => m.default)),
	},
	{
		id: "candy-pop",
		name: "Candy Pop",
		source: "builtin",
		load: () => builtinLoad(import("./themes/candy-pop.css?raw").then((m) => m.default)),
	},
	{
		id: "minimal-mono",
		name: "Minimal Mono",
		source: "builtin",
		load: () => builtinLoad(import("./themes/minimal-mono.css?raw").then((m) => m.default)),
	},
] as const satisfies readonly Omit<BuiltinTheme, "colors">[];

/**
 * `BuiltinThemeId` is derived from `definitions` rather than from `themes` so
 * it stays a union of the 7 string literals. The `as const` above is what
 * keeps each `id` narrow; `satisfies` shape-checks without widening it back
 * to `string`.
 */
export type BuiltinThemeId = (typeof definitions)[number]["id"];

/**
 * The union consumers reach for. `(string & {})` rather than plain `string`:
 * plain `string` in a union absorbs the literals and IDE autocomplete for the
 * 7 builtin ids is lost. This is NOT a safety mechanism — TypeScript will
 * happily accept any string here. Runtime safety is `isThemeId` in
 * `theme.svelte.ts`, which checks membership against the live registry
 * (builtins today, builtins + discovered user themes once peep-s0r
 * lands).
 */
export type ThemeId = BuiltinThemeId | (string & {});

/**
 * Indexing `themeColors` by `BuiltinThemeId` is HALF the drift check: adding a
 * theme here without regenerating fails to compile rather than rendering an
 * undefined swatch at runtime.
 *
 * It is blind in the other direction. Indexing a larger generated record with
 * a smaller id union is legal TypeScript, so REMOVING a theme here without
 * regenerating leaves `theme-colors.ts` carrying orphaned entries and compiles
 * clean. The set-equality assertion in `registry.test.ts` is what catches that
 * — do not delete it as redundant with this line, because it is not.
 */
export const themes: readonly BuiltinTheme[] = definitions.map((def) => ({
	...def,
	colors: themeColors[def.id satisfies BuiltinThemeId],
}));
