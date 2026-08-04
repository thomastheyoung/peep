import { invoke } from "@tauri-apps/api/core";

/**
 * Typed IPC seam for the on-disk preferences commands ONLY. The app has ~12
 * other ad-hoc `invoke`/`listen` call sites (files.ts, commands.ts, etc.) and
 * they are deliberately NOT migrated here — this file exists so that
 * `preferences.svelte.ts` can be unit-tested with a single `vi.mock("$lib/ipc")`
 * line, not to kick off an infrastructure rewrite of every IPC call in the app.
 */

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
