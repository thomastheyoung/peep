// `ThemeColors` lives in `parse-theme-css.ts`, not here — that module is
// dependency-free so `scripts/extract-theme-colors.ts` can run it directly
// under Node with no build step (see its file header). Importing FROM it INTO
// this file is fine; the reverse would break that constraint. This is also
// the single declaration of the `{bg,text,accent}` shape — `theme-colors.ts`
// and `commands.ts` both reference this type rather than re-declaring it.
import type { ThemeColors } from "./parse-theme-css";
import type { SanitizeResult } from "./sanitize-theme-css";

/**
 * Shape shared by every theme, generic in its id type so a builtin tuple can
 * keep its literal ids while a user theme — discovered at runtime from an
 * arbitrary filename — is typed with plain `string`.
 *
 * What the literals actually buy, today: `registry.ts` derives
 * `BuiltinThemeId` from the tuple and indexes the generated `themeColors` with
 * it, so a registry entry with no generated swatch is a compile error. They do
 * NOT flow to consumers — `themes` is annotated `readonly BuiltinTheme[]`,
 * which erases them at the module boundary — so nothing downstream switches
 * exhaustively over a theme id, and no such switch would type-check if it did.
 *
 * `load` returns `Promise<SanitizeResult>`, not `Promise<string>`, for EVERY
 * theme, builtin included. A `load()` typed `Promise<string>` that returns
 * `""` on refusal is LYING about success — and `""` is not a spare value here,
 * it already means "no theme loaded yet" at `+page.svelte`'s theme-CSS
 * injection effect. Collapsing "sanitizer rejected this theme" into that same
 * empty string would make a rejected theme indistinguishable from a fresh,
 * themeless start, and would let `setTheme` commit `activeId` for a theme
 * that renders nothing — persisting a broken choice forever, since nothing
 * downstream would ever see a reason to revert it. A discriminated result
 * forces every caller to look at `ok` before touching the CSS. Builtins
 * satisfy this trivially (`{ ok: true, css }`, see `registry.ts`) — they
 * carry no untrusted input and cannot fail sanitization, but they still go
 * through the same shape so `theme.svelte.ts` has exactly one code path for
 * "apply a theme," not two.
 */
export interface ThemeMetaBase<Id extends string> {
	readonly id: Id;
	readonly name: string;
	readonly colors: ThemeColors;
	readonly load: () => Promise<SanitizeResult>;
}

/** A theme bundled with the app. `id` is one of the fixed literal ids in `registry.ts`. */
export interface BuiltinTheme<Id extends string = string> extends ThemeMetaBase<Id> {
	readonly source: "builtin";
}

/**
 * A theme imported by the user from disk (peep-bnw/e9b). Forward
 * looking — nothing constructs one of these yet.
 *
 * - `path` is the source file on disk, for a "Reveal in Finder" action.
 * - `revision` is the file's mtime, used as the `ThemePreview` cache-bust key
 *   so editing a user theme's CSS and re-importing it invalidates the
 *   preview's per-theme-id cache instead of showing stale content.
 */
export interface UserTheme extends ThemeMetaBase<string> {
	readonly source: "user";
	readonly path: string;
	readonly revision: number;
}

/** Every theme the app can show, builtin or user-imported. */
export type ThemeMeta = BuiltinTheme | UserTheme;
