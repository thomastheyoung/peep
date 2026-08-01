import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

/**
 * Lifecycle of a single update, start to finish.
 *
 * `relaunching` is deliberately distinct from `ready` even though it lasts
 * milliseconds: it lets the palette action no-op so an impatient double-Enter
 * cannot fire two `relaunch()` calls.
 */
export type UpdaterStatus =
	| "idle"
	| "checking"
	| "up-to-date"
	| "available"
	| "downloading"
	| "ready"
	| "relaunching"
	| "error";

let status = $state<UpdaterStatus>("idle");
let version = $state<string | null>(null);
let notes = $state<string | null>(null);
let errorMessage = $state<string | null>(null);
let downloaded = $state(0);
let contentLength = $state(0);

/**
 * The pending update handle.
 *
 * Deliberately not `$state`: this is a plugin class instance with methods, not
 * data to render. Svelte's proxy skips non-plain prototypes anyway, so wrapping
 * it would be a silent no-op — keeping it a plain local makes that explicit.
 */
let pending: Update | null = null;

/** Deduplicates concurrent checks (native menu and palette firing at once). */
let inFlight: Promise<void> | null = null;

/**
 * One-way latch so the launch check runs at most once per session.
 *
 * Separate from `inFlight` on purpose: the single `$effect` in `+page.svelte`
 * re-runs on every HMR update, and `inFlight` has cleared itself by then, so it
 * alone would let a check fire on every save.
 */
let autoChecked = false;

function fail(err: unknown, context: string): void {
	status = "error";
	errorMessage = `${context}: ${err instanceof Error ? err.message : String(err)}`;
	console.error(`Updater: ${errorMessage}`);
}

async function runCheck(): Promise<void> {
	status = "checking";
	errorMessage = null;
	try {
		const update = await check();
		if (update) {
			pending = update;
			version = update.version;
			notes = update.body ?? null;
			status = "available";
		} else {
			pending = null;
			version = null;
			status = "up-to-date";
		}
	} catch (err) {
		fail(err, "Update check failed");
	}
}

export interface UpdaterAPI {
	readonly status: UpdaterStatus;
	readonly version: string | null;
	readonly notes: string | null;
	readonly errorMessage: string | null;
	/** 0..1 while downloading; null when not downloading or size is unknown. */
	readonly progress: number | null;
	readonly busy: boolean;
	check(): Promise<void>;
	checkOnce(): Promise<void>;
	install(): Promise<void>;
	restart(): Promise<void>;
	/**
	 * Advance whatever the current state implies: check, download, or restart.
	 *
	 * Both the titlebar badge and the palette entry call this so the two cannot
	 * drift on what a click means at a given status.
	 */
	activate(): Promise<void>;
	dismiss(): void;
}

export const updater: UpdaterAPI = {
	get status() {
		return status;
	},
	get version() {
		return version;
	},
	get notes() {
		return notes;
	},
	get errorMessage() {
		return errorMessage;
	},
	get progress() {
		// A missing Content-Length (possible through redirects) means
		// indeterminate, not zero — return null rather than NaN/Infinity.
		if (status !== "downloading" || contentLength === 0) return null;
		return Math.min(1, downloaded / contentLength);
	},
	get busy() {
		return status === "checking" || status === "downloading" || status === "relaunching";
	},

	check() {
		inFlight ??= runCheck().finally(() => {
			inFlight = null;
		});
		return inFlight;
	},

	/** Silent launch check. Runs at most once, even across HMR re-runs. */
	async checkOnce() {
		if (autoChecked) return;
		autoChecked = true;
		await updater.check();
	},

	async install() {
		const update = pending;
		if (!update || status !== "available") return;
		status = "downloading";
		downloaded = 0;
		contentLength = 0;
		try {
			await update.downloadAndInstall((event) => {
				switch (event.event) {
					case "Started":
						contentLength = event.data.contentLength ?? 0;
						break;
					case "Progress":
						// `chunkLength` is a per-chunk delta, not a running
						// total — accumulate it ourselves.
						downloaded += event.data.chunkLength;
						break;
					case "Finished":
						break;
					default: {
						const _exhaustive: never = event;
						console.warn(`Updater: unknown download event`, _exhaustive);
					}
				}
			});
			status = "ready";
		} catch (err) {
			fail(err, "Update download failed");
		}
	},

	async restart() {
		if (status !== "ready") return;
		status = "relaunching";
		try {
			await relaunch();
		} catch (err) {
			fail(err, "Relaunch failed");
		}
	},

	async activate() {
		switch (status) {
			case "available":
				await updater.install();
				break;
			case "ready":
				await updater.restart();
				break;
			case "checking":
			case "downloading":
			case "relaunching":
				break; // already busy
			// `error` retries, `up-to-date` and `idle` check again.
			default:
				await updater.check();
		}
	},

	dismiss() {
		if (status === "available" || status === "up-to-date" || status === "error") {
			status = "idle";
			errorMessage = null;
		}
	},
};
