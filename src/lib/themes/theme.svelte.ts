import { themes as builtinThemes, type ThemeId } from "./registry";
import type { ThemeMeta } from "./types";
import { buildUserThemes } from "./user-theme";
import { loadUserThemes } from "../ipc";
import { toast } from "../toast.svelte";

/**
 * Membership check against the live registry — builtins plus whatever user
 * themes the last successful `discover()` found.
 *
 * Returns `boolean`, deliberately not a `value is ThemeId` type predicate:
 * `ThemeId` includes `(string & {})` and so accepts any string, which would
 * make the predicate narrow `string` to `string` — an assertion that reads
 * like a guarantee while providing none. This check is the ONLY real
 * validation of a theme id, so it must not be dressed up as a type-level one.
 */
export function isThemeId(value: string): boolean {
	return allThemes.some((t) => t.id === value);
}

// Derived from `builtinThemes[0]` rather than hardcoded, so the fact that
// index 0 is the default (see the ordering comment in `registry.ts`) is only
// asserted in one place. Deliberately NOT derived from the merged list: the
// default must be stable across a session regardless of what discovery finds
// or when it settles, and a registry with no entries would make this
// `undefined` at runtime, but `registry.ts`'s `definitions` tuple is never
// empty in practice — it is a compile-time literal, not data that can arrive
// empty.
const DEFAULT_THEME_ID: ThemeId = builtinThemes[0]!.id;

let userThemes = $state<readonly ThemeMeta[]>([]);

// Builtins first, user themes after — so the default-is-index-0 invariant
// above and any UI that lists "themes" with builtins-first ordering (the
// Preferences theme grid, the palette's theme submenu) doesn't need its own
// sort. `$derived.by` because this recomputes from two separate `$state`
// sources (`builtinThemes` doesn't change, but reads should still track
// `userThemes`).
const allThemes = $derived.by<readonly ThemeMeta[]>(() => [...builtinThemes, ...userThemes]);

const BUILTIN_IDS: readonly string[] = builtinThemes.map((t) => t.id);

/**
 * Result of a discovery attempt. NOT `{scanned: true, themes} | never` and
 * NOT a bare `themes: ThemeMeta[]` that resolves empty on failure — those two
 * shapes both conflate "the themes directory is empty" with "the scan itself
 * could not run" (IPC failure, unreadable directory), and callers need to
 * tell those apart: `preferences.init()` (peep-zm6) must PERSIST a
 * fallback-to-default when a scan genuinely ran and found no match for the
 * stored id, but must NOT persist anything when the scan itself failed,
 * because a failed scan is not evidence the theme is gone — the file may
 * still be sitting on disk, just unreachable this launch. Resolving an empty
 * array either way would erase that distinction at the one place session
 * code can still ask "did we actually look."
 */
export type DiscoveryResult = { readonly scanned: true; readonly themes: readonly ThemeMeta[] } | { readonly scanned: false };

// In-flight dedup: `discover()` is called at startup and again on every
// debounced `user-themes-changed` event (peep-e9b/y0z). Without
// this, two overlapping calls would each run their own `loadUserThemes()`
// round trip and race to assign `userThemes` — the loser's response can
// arrive after the winner's and silently revert a newer discovery. Reset in
// a `finally` (not inline in the `.then`) so it clears whether the inner
// promise resolves or the (never-supposed-to-happen) rejects, and so a
// caller awaiting THIS call's return sees the reset happen only after its
// own promise has already settled — swapping the order would let a
// call issued the instant this one settles start a redundant fetch instead
// of reusing the just-finished result.
let inFlight: Promise<DiscoveryResult> | undefined;

export function discover(): Promise<DiscoveryResult> {
	if (inFlight) return inFlight;

	const attempt = loadUserThemes()
		.then((files): DiscoveryResult => {
			// loadUserThemes() itself never rejects (see ipc.ts) — an IPC failure
			// already resolves to `[]`, which is indistinguishable here from "the
			// directory legitimately has zero files in it." Both are `scanned:
			// true` with an empty user-theme list: the scan DID run, it just found
			// nothing, and that is a real, persistable fact rather than a failure
			// to look. Only a THROW from the synchronous parts of this chain
			// (buildUserThemes) reaches the `.catch` below and reports
			// `scanned: false`.
			const built = buildUserThemes(files, BUILTIN_IDS);
			userThemes = built;
			return { scanned: true, themes: allThemes };
		})
		.catch((err): DiscoveryResult => {
			console.error("Theme discovery failed:", err);
			return { scanned: false };
		})
		.finally(() => {
			inFlight = undefined;
		});

	inFlight = attempt;
	return attempt;
}

export interface ThemeStateAPI {
	readonly id: ThemeId;
	readonly css: string;
	readonly all: readonly ThemeMeta[];
	/**
	 * The default theme id — `builtinThemes[0]`'s id, per the ordering
	 * invariant documented on `DEFAULT_THEME_ID` above. Exposed here rather
	 * than re-derived at call sites (e.g. `preferences.svelte.ts`'s
	 * delete-a-user-theme flow, which must switch to the default BEFORE
	 * deleting) so the "index 0 is the default" fact is asserted in exactly
	 * one place, matching this file's own comment on `DEFAULT_THEME_ID`.
	 */
	readonly defaultId: ThemeId;
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
		return allThemes;
	},
	get defaultId() {
		return DEFAULT_THEME_ID;
	},
	async setTheme(id: ThemeId) {
		const meta = allThemes.find((t) => t.id === id);
		if (!meta) return;
		const result = await meta.load();
		// MUST NOT commit `activeId` on refusal. Applying an id whose CSS didn't
		// load would (a) leave the PREVIOUS theme's CSS on screen while claiming
		// the new id is active — see the `""` collision documented on
		// `ThemeMetaBase.load` in types.ts — and (b) get persisted by the next
		// `persist()` call in preferences.svelte.ts, so a transient sanitizer
		// rejection would survive as the user's permanent (broken) choice.
		if (!result.ok) {
			toast.error(`Couldn't apply theme "${meta.name}" — it was rejected for safety.`);
			return;
		}
		activeId = id;
		activeCss = result.css;
	},
	async init() {
		await themeState.setTheme(DEFAULT_THEME_ID);
	},
};
