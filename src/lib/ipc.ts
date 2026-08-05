import { invoke } from "@tauri-apps/api/core";

/**
 * Typed IPC seam for commands whose callers need to be unit-testable behind a
 * single `vi.mock("$lib/ipc")` line — today that's on-disk preferences and
 * user theme discovery/import (`theme.svelte.ts`). The app has ~12 other
 * ad-hoc `invoke`/`listen` call sites (files.ts, commands.ts, etc.) and they
 * are deliberately NOT migrated here — this file is a seam for testability,
 * not an infrastructure rewrite of every IPC call in the app.
 */

/**
 * One theme file discovered on disk, as returned by the Rust backend.
 * `id` is already validated there against `^[a-z0-9-]{1,64}$` (plus Windows
 * reserved names), so it can never be empty or contain a colon — the frontend
 * still re-slugifies as defence in depth (`slugifyThemeId` is idempotent on
 * an already-valid slug), but does not need to treat this `id` as untrusted
 * for the invariants that field-validation on the Rust side already covers.
 */
export interface UserThemeFile {
	readonly id: string;
	readonly path: string;
	readonly revision: number;
	readonly css: string;
}

/**
 * Loads the raw preferences JSON from disk.
 *
 * Returns `null` for BOTH "file absent" (a fresh install, or one that hasn't
 * migrated off localStorage yet) AND "the IPC call itself failed". These are
 * deliberately conflated: callers can't act differently on a broken IPC
 * channel anyway, and treating it as "no file" means a broken-IPC session
 * degrades to defaults instead of crashing preference loading. The failure
 * case is still logged so it's visible in the console.
 */
export async function loadPreferencesFile(): Promise<string | null> {
	try {
		return await invoke<string | null>("get_preferences");
	} catch (err) {
		console.error("Failed to load preferences:", err);
		return null;
	}
}

/**
 * Writes the raw preferences JSON to disk. Rejects on failure — unlike
 * `loadPreferencesFile`, this does NOT swallow errors, because callers (the
 * debounced save in `preferences.svelte.ts`, the localStorage migration path)
 * need to know whether the write actually succeeded before treating the
 * on-disk file as the new source of truth.
 */
export async function savePreferencesFile(json: string): Promise<void> {
	await invoke<void>("set_preferences", { json });
}

/**
 * Loads every user theme discovered on disk. Never rejects: `theme.svelte.ts`
 * needs the "could I look at all" question answered separately (see its
 * `DiscoveryResult` discriminant), so a broken IPC channel resolves to `[]`
 * here rather than throwing — the caller decides what "empty" means.
 *
 * Coerces a non-array response to `[]` rather than trusting the declared
 * return type: Storybook's mock resolves unknown commands to `null` (see
 * `.storybook/tauri-mock.ts`), and a `.map`/`.find` over `null` would throw
 * before any story rendered.
 */
export async function loadUserThemes(): Promise<UserThemeFile[]> {
	try {
		const result = await invoke<UserThemeFile[]>("get_user_themes");
		return Array.isArray(result) ? result : [];
	} catch (err) {
		console.error("Failed to load user themes:", err);
		return [];
	}
}

/**
 * Discriminated outcome of an import attempt. `reason: "exists"` is not a
 * failure in the same sense as `reason: "failed"` — it is an EXPECTED,
 * plan-for-it outcome under `mode: "create-new"` (the user picked a name that
 * collides with an id already on disk) that the caller must branch on to
 * offer a "Replace?" prompt, not a fault to log and swallow. Modeling it as a
 * value rather than a rejection is what makes that branch a `switch` at the
 * call site instead of a `try/catch` plus a string-match on the error
 * message — the exact anti-pattern `THEME_EXISTS` in `themes.rs` exists to
 * prevent callers from falling into.
 */
export type ImportOutcome =
	| { readonly ok: true; readonly file: UserThemeFile }
	| { readonly ok: false; readonly reason: "exists" }
	| { readonly ok: false; readonly reason: "failed"; readonly message: string };

/**
 * Imports a theme's CSS under `id`.
 *
 * This is the one write path in this file that does NOT reject on failure —
 * every other write here (`savePreferencesFile`, `deleteUserTheme`,
 * `watchUserThemes`) rejects specifically so its caller can tell "the write
 * failed" apart from "succeeded," per this file's header. Here, one of the
 * failure modes (an id collision under `mode: "create-new"`, surfaced by the
 * backend as the `"theme-exists"` sentinel) is not a fault at all — it's an
 * expected outcome the caller MUST branch on to offer a "Replace?" prompt.
 * Forcing that through a rejection would push every caller back toward
 * string-matching `err.message === "theme-exists"`, which is precisely what
 * `THEME_EXISTS` in `themes.rs` was made a machine-readable sentinel to
 * avoid. A discriminated `ImportOutcome` return makes the collision a normal
 * value the type system forces every caller to look at, while any OTHER
 * failure (disk full, invalid id, IPC channel down) still lands in the
 * result as `reason: "failed"` rather than being swallowed to `[]`/`null`
 * the way `loadUserThemes`/`loadPreferencesFile` degrade — there is no safe
 * default to degrade to for "did the write happen," so the message is
 * preserved for the caller to show.
 */
export async function importThemeCss(
	id: string,
	css: string,
	mode: "create-new" | "replace",
): Promise<ImportOutcome> {
	try {
		const file = await invoke<UserThemeFile>("import_theme", { id, css, mode });
		return { ok: true, file };
	} catch (err) {
		if (err === "theme-exists") {
			return { ok: false, reason: "exists" };
		}
		const message = err instanceof Error ? err.message : String(err);
		return { ok: false, reason: "failed", message };
	}
}

/** Deletes a user theme by id. Rejects on failure, for the same reason as `importThemeCss`. */
export async function deleteUserTheme(id: string): Promise<void> {
	await invoke<void>("delete_user_theme", { id });
}

/**
 * Starts watching the user themes directory for changes (idempotent on the
 * Rust side — safe to call more than once). Rejects on failure so the
 * one-time startup call site can log it rather than silently running without
 * live-reload for the rest of the session.
 */
export async function watchUserThemes(): Promise<void> {
	await invoke<void>("watch_user_themes");
}
