import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the theme module to isolate preferences testing
vi.mock("./themes/theme.svelte", () => {
	let id = "github-dark";
	const allThemes = [
		{ id: "github-dark", name: "GitHub Dark", colors: { bg: "#0d1117", text: "#e6edf3", accent: "#58a6ff" }, load: () => Promise.resolve("") },
		{ id: "github-light", name: "GitHub Light", colors: { bg: "#fff", text: "#1f2328", accent: "#0969da" }, load: () => Promise.resolve("") },
	];
	return {
		themeState: {
			get id() {
				return id;
			},
			get css() {
				return "";
			},
			get all() {
				return allThemes;
			},
			async setTheme(newId: string) {
				id = newId;
			},
			async init() {
				id = "github-dark";
			},
		},
		isThemeId: (value: string) => allThemes.some((t) => t.id === value),
	};
});

// The whole reason `ipc.ts` exists as a seam: preferences.svelte.ts talks to
// disk exclusively through these two functions, so mocking this one module
// is enough to unit-test persistence/migration without a real Tauri backend.
vi.mock("./ipc", () => ({
	loadPreferencesFile: vi.fn(),
	savePreferencesFile: vi.fn(),
}));

import { preferences, type RangeSetting, type ChoiceSetting } from "./preferences.svelte";
import { loadPreferencesFile, savePreferencesFile } from "./ipc";

const mockLoad = vi.mocked(loadPreferencesFile);
const mockSave = vi.mocked(savePreferencesFile);

describe("preferences", () => {
	const prefs = preferences;

	beforeEach(() => {
		localStorage.clear();
		mockLoad.mockReset();
		mockSave.mockReset();
		// Default: no on-disk file, so existing non-migration tests that don't
		// call init() are unaffected, and tests that DO call init() get "absent
		// file" behavior unless they override this.
		mockLoad.mockResolvedValue(null);
		mockSave.mockResolvedValue(undefined);
		// Reset singleton state since preferences uses module-level $state.
		// contentWidth/fontWeight/letterSpacing/lineHeight have no dedicated
		// reset* methods, so drive them back to defaults through the same
		// settings-registry entries the Preferences panel and command palette
		// use — the public surface, not module internals.
		prefs.resetZoom();
		prefs.closePanel();
		prefs.setActiveSection("appearance");
		const cw = prefs.settings.find((s) => s.id === "content-width") as ChoiceSetting;
		cw.select("auto");
		const fw = prefs.settings.find((s) => s.id === "font-weight") as RangeSetting;
		fw.set(fw.defaultValue);
		const ls = prefs.settings.find((s) => s.id === "letter-spacing") as RangeSetting;
		ls.set(ls.defaultValue);
		const lh = prefs.settings.find((s) => s.id === "line-height") as RangeSetting;
		lh.set(lh.defaultValue);
	});

	describe("settings registry", () => {
		it("returns all expected settings", () => {
			const ids = prefs.settings.map((s) => s.id);
			expect(ids).toContain("theme");
			expect(ids).toContain("content-width");
			expect(ids).toContain("zoom");
			expect(ids).toContain("font-weight");
			expect(ids).toContain("letter-spacing");
			expect(ids).toContain("line-height");
		});

		it("every setting has required fields", () => {
			for (const s of prefs.settings) {
				expect(s.id).toBeTruthy();
				expect(s.label).toBeTruthy();
				expect(s.section).toBeTruthy();
				expect(s.keywords.length).toBeGreaterThan(0);

				if (s.type === "choice") {
					expect(s.options.length).toBeGreaterThan(0);
					expect(s.select).toBeTypeOf("function");
				} else {
					expect(s.min).toBeLessThan(s.max);
					expect(s.step).toBeGreaterThan(0);
					expect(s.set).toBeTypeOf("function");
					expect(s.format).toBeTypeOf("function");
				}
			}
		});

		it("theme setting lists all themes from registry", () => {
			const theme = prefs.settings.find((s) => s.id === "theme") as ChoiceSetting;
			expect(theme.options.length).toBe(2); // mocked 2 themes
		});

		it("content-width has auto/wide/full options", () => {
			const cw = prefs.settings.find((s) => s.id === "content-width") as ChoiceSetting;
			const values = cw.options.map((o) => o.value);
			expect(values).toEqual(["auto", "wide", "full"]);
		});
	});

	describe("CSS value getters", () => {
		it("default content width is 780px (auto)", () => {
			expect(prefs.contentWidthCss).toBe("780px");
		});

		it("default font weight is 400", () => {
			expect(prefs.fontWeightCss).toBe("400");
		});

		it("default letter spacing is 0em", () => {
			expect(prefs.letterSpacingCss).toBe("0em");
		});

		it("default line height is 1.7", () => {
			expect(prefs.lineHeightCss).toBe("1.7");
		});

		it("default zoom is 1", () => {
			expect(prefs.zoomLevel).toBe(1);
		});
	});

	describe("zoom", () => {
		it("zoomIn increments by step", () => {
			prefs.zoomIn();
			expect(prefs.zoomLevel).toBeCloseTo(1.1, 1);
		});

		it("zoomOut decrements by step", () => {
			prefs.zoomOut();
			expect(prefs.zoomLevel).toBeCloseTo(0.9, 1);
		});

		it("resetZoom returns to 1", () => {
			prefs.zoomIn();
			prefs.zoomIn();
			prefs.resetZoom();
			expect(prefs.zoomLevel).toBe(1);
		});

		it("zoom is clamped to min 0.5", () => {
			for (let i = 0; i < 20; i++) prefs.zoomOut();
			expect(prefs.zoomLevel).toBe(0.5);
		});

		it("zoom is clamped to max 3", () => {
			for (let i = 0; i < 30; i++) prefs.zoomIn();
			expect(prefs.zoomLevel).toBe(3);
		});
	});

	describe("range setting format functions", () => {
		it("zoom formats as percentage", () => {
			const zoom = prefs.settings.find((s) => s.id === "zoom") as RangeSetting;
			expect(zoom.format(1)).toBe("100%");
			expect(zoom.format(1.5)).toBe("150%");
			expect(zoom.format(0.5)).toBe("50%");
		});

		it("font-weight formats with labels", () => {
			const fw = prefs.settings.find((s) => s.id === "font-weight") as RangeSetting;
			expect(fw.format(300)).toBe("Light");
			expect(fw.format(400)).toBe("Regular");
			expect(fw.format(500)).toBe("Medium");
			expect(fw.format(600)).toBe("Semibold");
			expect(fw.format(700)).toBe("Bold");
		});

		it("letter-spacing formats with sign and em", () => {
			const ls = prefs.settings.find((s) => s.id === "letter-spacing") as RangeSetting;
			expect(ls.format(0)).toBe("0 em");
			expect(ls.format(0.05)).toBe("+0.05 em");
			expect(ls.format(-0.03)).toBe("-0.03 em");
		});

		it("line-height formats to one decimal", () => {
			const lh = prefs.settings.find((s) => s.id === "line-height") as RangeSetting;
			expect(lh.format(1.7)).toBe("1.7");
			expect(lh.format(2.0)).toBe("2.0");
		});
	});

	describe("panel state", () => {
		it("starts closed", () => {
			expect(prefs.showPanel).toBe(false);
		});

		it("openPanel sets showPanel true", () => {
			prefs.openPanel();
			expect(prefs.showPanel).toBe(true);
		});

		it("closePanel sets showPanel false", () => {
			prefs.openPanel();
			prefs.closePanel();
			expect(prefs.showPanel).toBe(false);
		});

		it("togglePanel flips state", () => {
			prefs.togglePanel();
			expect(prefs.showPanel).toBe(true);
			prefs.togglePanel();
			expect(prefs.showPanel).toBe(false);
		});
	});

	describe("active section", () => {
		it("defaults to appearance", () => {
			expect(prefs.activeSection).toBe("appearance");
		});

		it("setActiveSection changes it", () => {
			prefs.setActiveSection("font");
			expect(prefs.activeSection).toBe("font");
		});
	});

	describe("debounced persistence", () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		// The debounce exists specifically because a range slider fires `set` on
		// every drag step (see preferences.svelte.ts:90-95) — without coalescing,
		// that would be one IPC write + disk fsync per animation frame.
		it("does not write before the debounce elapses", () => {
			prefs.zoomIn();
			vi.advanceTimersByTime(149);
			expect(mockSave).not.toHaveBeenCalled();
		});

		// Async advance because saves go through the ordering chain in
		// preferences.svelte.ts, so the write lands a microtask after the timer.
		it("coalesces rapid setter calls into a single write of the final state", async () => {
			prefs.zoomIn(); // 1.1
			prefs.zoomIn(); // 1.2
			prefs.zoomIn(); // 1.3

			await vi.advanceTimersByTimeAsync(150);

			expect(mockSave).toHaveBeenCalledOnce();
			const written = JSON.parse(mockSave.mock.calls[0]![0]);
			expect(written.zoomLevel).toBeCloseTo(1.3, 5);
		});

		it("logs rather than throws when the debounced save rejects", async () => {
			const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
			mockSave.mockRejectedValueOnce(new Error("disk full"));

			prefs.zoomIn();
			vi.advanceTimersByTime(150);
			// Let the rejected promise's .catch() microtask run under fake timers.
			await vi.runAllTimersAsync();

			expect(consoleError).toHaveBeenCalledWith("Failed to save preferences:", expect.any(Error));
			consoleError.mockRestore();
		});
	});

	describe("init: migration from localStorage to on-disk file", () => {
		const legacyStored = {
			theme: "github-light",
			contentWidth: "wide",
			zoomLevel: 1.5,
			fontWeight: 600,
			letterSpacing: 0.02,
			lineHeight: 2.0,
		};

		// Row 1: file present -> file wins; localStorage is ignored AND left in
		// place. No migration should be attempted when the file already exists.
		it("file present: uses file contents and leaves localStorage untouched", async () => {
			mockLoad.mockResolvedValue(
				JSON.stringify({ theme: "github-light", contentWidth: "full", zoomLevel: 2, fontWeight: 700, letterSpacing: 0.05, lineHeight: 1.2 }),
			);
			localStorage.setItem("md-preferences", JSON.stringify(legacyStored));

			await prefs.init();

			expect(prefs.zoomLevel).toBe(2);
			expect(prefs.contentWidthCss).toBe("100%"); // full, from file — not "wide" from LS
			expect(mockSave).not.toHaveBeenCalled();
			// The localStorage key must still be present — migration never runs
			// when a file already exists.
			expect(localStorage.getItem("md-preferences")).not.toBeNull();
		});

		// Row 2: file absent + valid localStorage -> values applied from LS,
		// migration write fired, LS key removed only once that write resolves.
		it("file absent + valid localStorage: migrates and removes the LS key only after the save resolves", async () => {
			mockLoad.mockResolvedValue(null);
			localStorage.setItem("md-preferences", JSON.stringify(legacyStored));

			let resolveSave!: () => void;
			mockSave.mockReturnValue(
				new Promise<void>((resolve) => {
					resolveSave = () => resolve();
				}),
			);

			await prefs.init();

			// Values were applied from the legacy blob.
			expect(prefs.zoomLevel).toBe(1.5);
			expect(prefs.contentWidthCss).toBe("1200px"); // wide
			expect(prefs.fontWeightCss).toBe("600");
			expect(prefs.letterSpacingCss).toBe("0.02em");
			expect(prefs.lineHeightCss).toBe("2");

			// The migration write was fired with the legacy JSON verbatim.
			expect(mockSave).toHaveBeenCalledWith(JSON.stringify(legacyStored));

			// init() does not await the save (by design, per preferences.svelte.ts),
			// so the LS key must still be there immediately after init() resolves.
			expect(localStorage.getItem("md-preferences")).not.toBeNull();

			// Only after the save promise itself settles does the key get removed.
			resolveSave();
			await Promise.resolve();
			await Promise.resolve();

			expect(localStorage.getItem("md-preferences")).toBeNull();
		});

		// Row 3: file absent + no localStorage -> defaults, no migration attempt.
		it("file absent + no localStorage: applies defaults and never calls savePreferencesFile", async () => {
			mockLoad.mockResolvedValue(null);

			await prefs.init();

			expect(prefs.zoomLevel).toBe(1);
			expect(prefs.contentWidthCss).toBe("780px");
			expect(mockSave).not.toHaveBeenCalled();
		});

		// Row 4: corrupt file -> defaults, and — the deliberate part — must NOT
		// fall back to localStorage even though a valid legacy blob exists. A
		// corrupt file proves migration already ran once; resurrecting the LS
		// snapshot would time-travel settings backwards. This is the "self-heal
		// over archaeology" comment in preferences.svelte.ts:379-383, pinned.
		it("file corrupt: applies defaults and does NOT fall back to localStorage", async () => {
			mockLoad.mockResolvedValue("not json");
			localStorage.setItem("md-preferences", JSON.stringify(legacyStored));

			await prefs.init();

			// Defaults, not the LS values (which would show zoom 1.5, wide, etc).
			expect(prefs.zoomLevel).toBe(1);
			expect(prefs.contentWidthCss).toBe("780px");
			expect(prefs.fontWeightCss).toBe("400");

			// No migration attempt should be made off a corrupt-but-present file.
			expect(mockSave).not.toHaveBeenCalled();
			// The (unused) LS key is left alone either way.
			expect(localStorage.getItem("md-preferences")).not.toBeNull();
		});

		// Migration failure: the write rejects, so the LS key must be RETAINED
		// so the next launch can retry. This also must not surface as an
		// unhandled promise rejection, since init()'s migration call is
		// deliberately fire-and-forget.
		it("migration failure: retains the localStorage key so migration can retry next launch", async () => {
			const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
			mockLoad.mockResolvedValue(null);
			localStorage.setItem("md-preferences", JSON.stringify(legacyStored));
			mockSave.mockRejectedValue(new Error("disk full"));

			await prefs.init();
			// Flush the fire-and-forget savePreferencesFile(...).then(...).catch(...) chain.
			await Promise.resolve();
			await Promise.resolve();
			await Promise.resolve();

			// Values were still applied from the legacy blob this session...
			expect(prefs.zoomLevel).toBe(1.5);
			// ...but the LS key survives because the write never resolved.
			expect(localStorage.getItem("md-preferences")).not.toBeNull();
			expect(consoleError).toHaveBeenCalledWith("Preferences migration failed:", expect.any(Error));

			consoleError.mockRestore();
		});

		// IPC failure on load is indistinguishable from "file absent" by design
		// (see ipc.ts loadPreferencesFile doc comment) — verify that degraded
		// path still produces safe defaults rather than throwing.
		it("IPC load failure (loadPreferencesFile resolves null): applies defaults without throwing", async () => {
			mockLoad.mockResolvedValue(null);

			await expect(prefs.init()).resolves.toBeUndefined();
			expect(prefs.zoomLevel).toBe(1);
			expect(prefs.contentWidthCss).toBe("780px");
		});

		// REGRESSION: the migration write must never land after a newer user
		// change and revert it. Tauri dispatches each `invoke` onto its async
		// runtime (tauri/src/ipc/mod.rs:329) and the JS `invoke` returns
		// independent promises, so completion order is NOT issue order — the
		// backend's prefs_lock gives mutual exclusion, not sequencing. Without
		// the save chain in preferences.svelte.ts, the slow first-run migration
		// write (it creates the config dir) could overwrite a newer blob and
		// then delete the only other copy: the localStorage key.
		it("migration write cannot clobber a newer user change", async () => {
			vi.useFakeTimers();
			mockLoad.mockResolvedValue(null);
			localStorage.setItem("md-preferences", JSON.stringify(legacyStored));

			// Migration write hangs, mimicking the slow cold-start case.
			let resolveMigration!: () => void;
			mockSave.mockReturnValueOnce(
				new Promise<void>((resolve) => {
					resolveMigration = () => resolve();
				}),
			);

			await prefs.init();
			expect(prefs.zoomLevel).toBe(1.5); // from the legacy blob

			// User changes zoom while the migration write is still in flight.
			prefs.zoomIn();
			await vi.advanceTimersByTimeAsync(200);

			// The chain must hold the newer write until the migration resolves.
			expect(mockSave).toHaveBeenCalledTimes(1);

			resolveMigration();
			await vi.advanceTimersByTimeAsync(0);

			// The LAST write to reach disk carries the newer value, never 1.5.
			const lastJson = mockSave.mock.calls.at(-1)?.[0] as string;
			expect(JSON.parse(lastJson).zoomLevel).toBeCloseTo(1.6, 5);

			vi.useRealTimers();
		});

		it("flush() writes a pending debounced change immediately", async () => {
			vi.useFakeTimers();
			mockLoad.mockResolvedValue(null);
			await prefs.init();
			mockSave.mockClear();

			// A change made and then immediately "quit" on — without flush this
			// is lost, which localStorage's synchronous write never was.
			prefs.zoomIn();
			expect(mockSave).not.toHaveBeenCalled();

			await prefs.flush();
			expect(mockSave).toHaveBeenCalledTimes(1);
			const json = mockSave.mock.calls[0]?.[0] as string;
			expect(JSON.parse(json).zoomLevel).toBeCloseTo(1.1, 5);

			// The timer must be cleared, not left to double-write.
			await vi.advanceTimersByTimeAsync(300);
			expect(mockSave).toHaveBeenCalledTimes(1);

			vi.useRealTimers();
		});
	});
});
