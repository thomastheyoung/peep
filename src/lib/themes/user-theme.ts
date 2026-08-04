/**
 * Pure builder: turn the Rust backend's `UserThemeFile[]` (raw discovered
 * files) into theme metadata the rest of the app can treat like any built-in
 * theme. Kept dependency-free of Svelte/`$state` so it is trivially unit
 * testable and so `theme.svelte.ts` (the only caller) stays a thin reactive
 * shell around this.
 */
import type { UserThemeFile } from "../ipc";
import { parseThemeCss, slugifyThemeId, resolveThemeId } from "./parse-theme-css";
import { sanitizeThemeCss, type SanitizeResult } from "./sanitize-theme-css";

/**
 * A discovered user theme, shaped to match `ThemeMetaBase<string>` (see
 * `types.ts`) once that interface's `load()` return type is widened in
 * markdown-viewer-s0r's follow-up commit. Declared locally rather than
 * importing `UserTheme` because that interface still types `load` as
 * `Promise<string>` until then — this type is what it becomes.
 */
export interface BuiltUserTheme {
	readonly id: string;
	readonly name: string;
	readonly source: "user";
	readonly path: string;
	readonly revision: number;
	readonly colors: import("./parse-theme-css").ThemeColors;
	readonly load: () => Promise<SanitizeResult>;
}

/** Shown when a theme's frontmatter has no (or a partial) `@name` field. */
function titleCaseFromId(id: string): string {
	return id
		.split("-")
		.filter(Boolean)
		.map((word) => word[0]!.toUpperCase() + word.slice(1))
		.join(" ");
}

/**
 * Fallback swatch for a theme whose CSS fails to parse a full `{bg, text,
 * accent}` triple. MUST exist for every theme, never be omitted: two
 * different consumers key their entire layout on `colors` being present —
 * `CommandPalette.svelte:21` gates the whole live-preview pane on
 * `filtered[0]?.swatches != null`, and `Preferences.svelte:98` conditionally
 * drops the swatch row per-card (`hasSwatches`), producing a ragged grid the
 * moment one card in the group has none. A neutral gray is the least
 * misleading placeholder — it doesn't imply real colors, and it doesn't
 * change grid shape.
 */
const FALLBACK_SWATCH = { bg: "#808080", text: "#ffffff", accent: "#a0a0a0" } as const;

/**
 * Build the merged set of user themes from what the backend discovered.
 *
 * Sorted by id BEFORE slug resolution so collision suffixes (`-2`, `-3`, …)
 * come out deterministic across launches — the Rust side scans a directory,
 * and directory listing order is not guaranteed, so without this sort the
 * same two colliding files could get swapped `-2`/`-3` assignments between
 * runs and silently orphan whichever one was persisted as the active theme.
 *
 * `builtinIds` seeds the `taken` set so a user theme named e.g. `github-dark`
 * resolves to `github-dark-2` instead of shadowing the built-in. `taken` is
 * mutated in this loop (inserting each resolved id before resolving the
 * next) because `resolveThemeId` is deliberately pure and does not do this
 * itself — skipping the insert would let two colliding files both resolve to
 * the same `-2` suffix.
 */
export function buildUserThemes(
	files: readonly UserThemeFile[],
	builtinIds: readonly string[],
): readonly BuiltUserTheme[] {
	const taken = new Set<string>(builtinIds);
	const sorted = [...files].sort((a, b) => a.id.localeCompare(b.id));

	return sorted.map((file): BuiltUserTheme => {
		const slug = slugifyThemeId(file.id);
		const id = resolveThemeId(slug, taken);
		taken.add(id);

		const parsed = parseThemeCss(file.css);
		const name = parsed.ok ? parsed.frontmatter.name : titleCaseFromId(id);
		const colors = parsed.ok ? parsed.swatch : FALLBACK_SWATCH;

		return {
			id,
			name,
			source: "user",
			path: file.path,
			revision: file.revision,
			colors,
			// Sanitized at CALL time, not memoized here — see sanitize-theme-css.ts's
			// file header. The raw CSS is captured in this closure over `file.css`
			// (a snapshot from this `discover()` call), so a sanitizer bugfix that
			// ships later still protects an already-installed theme the next time
			// it is applied, without requiring re-import.
			load: () => Promise.resolve(sanitizeThemeCss(file.css, id)),
		};
	});
}
