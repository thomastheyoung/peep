import { themes, type ThemeId } from "./registry";

/**
 * Membership check against the live registry.
 *
 * Returns `boolean`, deliberately not a `value is ThemeId` type predicate:
 * `ThemeId` includes `(string & {})` and so accepts any string, which would
 * make the predicate narrow `string` to `string` — an assertion that reads
 * like a guarantee while providing none. This check is the ONLY real
 * validation of a theme id, so it must not be dressed up as a type-level one.
 */
export function isThemeId(value: string): boolean {
	return themes.some((t) => t.id === value);
}

// Derived from `themes[0]` rather than hardcoded, so the fact that index 0 is
// the default (see the ordering comment in `registry.ts`) is only asserted in
// one place. A registry with no entries would make this `undefined` at
// runtime, but `registry.ts`'s `definitions` tuple is never empty in practice
// — it is a compile-time literal, not data that can arrive empty.
const DEFAULT_THEME_ID: ThemeId = themes[0]!.id;

export interface ThemeStateAPI {
	readonly id: ThemeId;
	readonly css: string;
	readonly all: typeof themes;
	setTheme(id: ThemeId): Promise<void>;
	init(): Promise<void>;
}

let activeId: ThemeId = $state(DEFAULT_THEME_ID);
let activeCss = $state("");

export const themeState: ThemeStateAPI = {
	get id() {
		return activeId;
	},
	get css() {
		return activeCss;
	},
	get all() {
		return themes;
	},
	async setTheme(id: ThemeId) {
		const meta = themes.find((t) => t.id === id);
		if (!meta) return;
		const css = await meta.load();
		activeId = id;
		activeCss = css;
	},
	async init() {
		await themeState.setTheme(DEFAULT_THEME_ID);
	},
};
