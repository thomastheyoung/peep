import { describe, it, expect, vi, beforeEach } from "vitest";

const check = vi.fn();
const relaunch = vi.fn();

// The factories are hoisted above the `const`s above, so they must not close
// over them directly — the arrow defers the read until call time.
vi.mock("@tauri-apps/plugin-updater", () => ({
	check: (...args: unknown[]) => check(...args),
}));
vi.mock("@tauri-apps/plugin-process", () => ({
	relaunch: (...args: unknown[]) => relaunch(...args),
}));

type DownloadEvent =
	| { event: "Started"; data: { contentLength?: number } }
	| { event: "Progress"; data: { chunkLength: number } }
	| { event: "Finished" };

/**
 * The updater is a module singleton with no reset method, so each test imports
 * a fresh copy rather than inheriting the previous test's status.
 */
async function freshUpdater() {
	const mod = await import("./updater.svelte");
	return mod.updater;
}

function mockUpdate(
	events: DownloadEvent[] = [
		{ event: "Started", data: { contentLength: 100 } },
		{ event: "Progress", data: { chunkLength: 40 } },
		{ event: "Progress", data: { chunkLength: 60 } },
		{ event: "Finished" },
	],
	overrides: Record<string, unknown> = {}
) {
	return {
		version: "1.2.3",
		body: "Release notes",
		downloadAndInstall: vi.fn(async (onEvent?: (e: DownloadEvent) => void) => {
			for (const e of events) onEvent?.(e);
		}),
		...overrides,
	};
}

beforeEach(() => {
	vi.clearAllMocks();
	vi.resetModules();
});

describe("updater", () => {
	it("starts idle", async () => {
		const updater = await freshUpdater();
		expect(updater.status).toBe("idle");
		expect(updater.progress).toBeNull();
		expect(updater.busy).toBe(false);
	});

	describe("check", () => {
		it("reports up-to-date when there is no update", async () => {
			check.mockResolvedValue(null);
			const updater = await freshUpdater();

			await updater.check();

			expect(updater.status).toBe("up-to-date");
			expect(updater.version).toBeNull();
		});

		it("captures version and notes when an update exists", async () => {
			check.mockResolvedValue(mockUpdate());
			const updater = await freshUpdater();

			await updater.check();

			expect(updater.status).toBe("available");
			expect(updater.version).toBe("1.2.3");
			expect(updater.notes).toBe("Release notes");
		});

		it("records the message on failure", async () => {
			check.mockRejectedValue(new Error("network down"));
			const updater = await freshUpdater();

			await updater.check();

			expect(updater.status).toBe("error");
			expect(updater.errorMessage).toContain("network down");
		});

		// The native menu and the palette can both fire a check; only one
		// request should go out.
		it("shares one in-flight promise across concurrent calls", async () => {
			check.mockResolvedValue(null);
			const updater = await freshUpdater();

			await Promise.all([updater.check(), updater.check(), updater.check()]);

			expect(check).toHaveBeenCalledOnce();
		});

		it("allows a fresh check after the previous one settles", async () => {
			check.mockResolvedValue(null);
			const updater = await freshUpdater();

			await updater.check();
			await updater.check();

			expect(check).toHaveBeenCalledTimes(2);
		});
	});

	describe("checkOnce", () => {
		// Guards against the single $effect in +page.svelte re-running on HMR.
		it("only checks once regardless of how often it is called", async () => {
			check.mockResolvedValue(null);
			const updater = await freshUpdater();

			await updater.checkOnce();
			await updater.checkOnce();
			await updater.checkOnce();

			expect(check).toHaveBeenCalledOnce();
		});
	});

	describe("install", () => {
		it("accumulates chunk deltas into progress and ends ready", async () => {
			const update = mockUpdate();
			check.mockResolvedValue(update);
			const updater = await freshUpdater();
			await updater.check();

			await updater.install();

			expect(update.downloadAndInstall).toHaveBeenCalledOnce();
			expect(updater.status).toBe("ready");
		});

		it("reports progress from accumulated deltas mid-download", async () => {
			const seen: (number | null)[] = [];
			const update = mockUpdate();
			// Sample `progress` while status is still "downloading"; the getter
			// returns null once it leaves that state.
			update.downloadAndInstall = vi.fn(async (onEvent?: (e: DownloadEvent) => void) => {
				onEvent?.({ event: "Started", data: { contentLength: 100 } });
				onEvent?.({ event: "Progress", data: { chunkLength: 40 } });
				seen.push(updaterRef!.progress);
				onEvent?.({ event: "Progress", data: { chunkLength: 60 } });
				seen.push(updaterRef!.progress);
			});
			check.mockResolvedValue(update);
			const updater = await freshUpdater();
			const updaterRef = updater;
			await updater.check();

			await updater.install();

			expect(seen).toEqual([0.4, 1]);
		});

		// A missing Content-Length must read as indeterminate, not NaN.
		it("returns null progress when the size is unknown", async () => {
			const seen: (number | null)[] = [];
			const update = mockUpdate();
			update.downloadAndInstall = vi.fn(async (onEvent?: (e: DownloadEvent) => void) => {
				onEvent?.({ event: "Started", data: { contentLength: undefined } });
				onEvent?.({ event: "Progress", data: { chunkLength: 40 } });
				seen.push(updaterRef!.progress);
			});
			check.mockResolvedValue(update);
			const updater = await freshUpdater();
			const updaterRef = updater;
			await updater.check();

			await updater.install();

			expect(seen).toEqual([null]);
		});

		it("does nothing when no update is pending", async () => {
			const updater = await freshUpdater();

			await updater.install();

			expect(updater.status).toBe("idle");
		});

		it("records the message when the download fails", async () => {
			const update = mockUpdate();
			update.downloadAndInstall = vi.fn(async () => {
				throw new Error("disk full");
			});
			check.mockResolvedValue(update);
			const updater = await freshUpdater();
			await updater.check();

			await updater.install();

			expect(updater.status).toBe("error");
			expect(updater.errorMessage).toContain("disk full");
		});
	});

	describe("restart", () => {
		it("relaunches when ready", async () => {
			check.mockResolvedValue(mockUpdate());
			relaunch.mockResolvedValue(undefined);
			const updater = await freshUpdater();
			await updater.check();
			await updater.install();

			await updater.restart();

			expect(relaunch).toHaveBeenCalledOnce();
			expect(updater.status).toBe("relaunching");
		});

		// `relaunching` exists so a double-Enter cannot fire two relaunches.
		it("ignores a second call once relaunching", async () => {
			check.mockResolvedValue(mockUpdate());
			relaunch.mockResolvedValue(undefined);
			const updater = await freshUpdater();
			await updater.check();
			await updater.install();

			await updater.restart();
			await updater.restart();

			expect(relaunch).toHaveBeenCalledOnce();
		});

		it("does nothing when not ready", async () => {
			const updater = await freshUpdater();

			await updater.restart();

			expect(relaunch).not.toHaveBeenCalled();
		});
	});

	// Shared by the titlebar badge and the palette entry, so this is the single
	// definition of what a click means at any given status.
	describe("activate", () => {
		it("checks when idle", async () => {
			check.mockResolvedValue(null);
			const updater = await freshUpdater();

			await updater.activate();

			expect(check).toHaveBeenCalledOnce();
			expect(updater.status).toBe("up-to-date");
		});

		it("downloads when an update is available", async () => {
			const update = mockUpdate();
			check.mockResolvedValue(update);
			const updater = await freshUpdater();
			await updater.check();

			await updater.activate();

			expect(update.downloadAndInstall).toHaveBeenCalledOnce();
			expect(updater.status).toBe("ready");
		});

		it("restarts when the download is ready", async () => {
			check.mockResolvedValue(mockUpdate());
			relaunch.mockResolvedValue(undefined);
			const updater = await freshUpdater();
			await updater.check();
			await updater.install();

			await updater.activate();

			expect(relaunch).toHaveBeenCalledOnce();
		});

		it("retries after a failed check", async () => {
			check.mockRejectedValueOnce(new Error("offline"));
			const updater = await freshUpdater();
			await updater.check();
			expect(updater.status).toBe("error");

			check.mockResolvedValue(null);
			await updater.activate();

			expect(updater.status).toBe("up-to-date");
			expect(check).toHaveBeenCalledTimes(2);
		});

		it("does nothing while a download is in flight", async () => {
			const update = mockUpdate();
			// Re-entering activate() mid-download must not start a second one.
			update.downloadAndInstall = vi.fn(async (onEvent?: (e: DownloadEvent) => void) => {
				onEvent?.({ event: "Started", data: { contentLength: 100 } });
				await updaterRef!.activate();
			});
			check.mockResolvedValue(update);
			const updater = await freshUpdater();
			const updaterRef = updater;
			await updater.check();

			await updater.activate();

			expect(update.downloadAndInstall).toHaveBeenCalledOnce();
			expect(relaunch).not.toHaveBeenCalled();
		});
	});

	describe("dismiss", () => {
		it("clears an available update back to idle", async () => {
			check.mockResolvedValue(mockUpdate());
			const updater = await freshUpdater();
			await updater.check();

			updater.dismiss();

			expect(updater.status).toBe("idle");
		});

		it("leaves an in-progress download alone", async () => {
			const update = mockUpdate();
			update.downloadAndInstall = vi.fn(async (onEvent?: (e: DownloadEvent) => void) => {
				onEvent?.({ event: "Started", data: { contentLength: 100 } });
				updaterRef!.dismiss();
				expect(updaterRef!.status).toBe("downloading");
			});
			check.mockResolvedValue(update);
			const updater = await freshUpdater();
			const updaterRef = updater;
			await updater.check();

			await updater.install();

			expect(updater.status).toBe("ready");
		});
	});
});
