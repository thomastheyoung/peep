import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the theme module to isolate preferences testing.
//
// `discover` defaults to an immediately-resolved `{scanned: true, themes: []}`
// so every pre-existing test in this file (none of which cares about
// discovery) is unaffected. Tests that DO care replace it with
// `mockDiscover.mockResolvedValue(...)` or a deferred promise per-case.
// `allThemes` is `let`, not `const`, so a test can register a theme id that
// only "discovery" would have found (e.g. "my-theme") without it being a
// registry member from the start — matching how a real discover() call
// would grow the live list.
vi.mock("./themes/theme.svelte", () => {
	const BASELINE_THEMES = [
		{ id: "github-dark", name: "GitHub Dark", colors: { bg: "#0d1117", text: "#e6edf3", accent: "#58a6ff" }, load: () => Promise.resolve("") },
		{ id: "github-light", name: "GitHub Light", colors: { bg: "#fff", text: "#1f2328", accent: "#0969da" }, load: () => Promise.resolve("") },
	];
	let id = "github-dark";
	let allThemes = [...BASELINE_THEMES];
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
		discover: vi.fn(() => Promise.resolve({ scanned: true, themes: allThemes })),
		// Test-only escape hatch: lets a test add a theme id to the mocked
		// registry as if discover() had found it, without hand-maintaining a
		// second copy of `allThemes` in the test file.
		__addMockTheme(themeId: string) {
			allThemes = [...allThemes, { id: themeId, name: themeId, colors: { bg: "#000", text: "#fff", accent: "#f00" }, load: () => Promise.resolve("") }];
		},
		// The mirror image, for reconciliation tests: simulates a theme file
		// that existed at one discovery and is gone by the next (deleted,
		// renamed) without touching whatever `id` is currently "active" — a
		// real discover() doesn't know or care what's active either.
		__removeMockTheme(themeId: string) {
			allThemes = allThemes.filter((t) => t.id !== themeId);
		},
		// This mock's `id`/`allThemes` are module-factory-scoped closure state,
		// which — unlike the module-level `$state` this file mocks around — has
		// no natural per-test reset. Without calling this in `beforeEach`, a
		// `__removeMockTheme` in one test permanently shrinks `allThemes` for
		// every test that runs after it in the same file.
		__resetMockThemes() {
			id = "github-dark";
			allThemes = [...BASELINE_THEMES];
		},
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
import { discover } from "./themes/theme.svelte";

const mockLoad = vi.mocked(loadPreferencesFile);
const mockSave = vi.mocked(savePreferencesFile);
const mockDiscover = vi.mocked(discover);

// The mocked module's test-only escape hatches (see the vi.mock factory
// above) aren't part of theme.svelte.ts's real public API, so they aren't in
// the static import's type — cast once, here, rather than re-deriving this
// shape at every call site.
const mockThemeModule = (await import("./themes/theme.svelte")) as unknown as {
	__addMockTheme(themeId: string): void;
	__removeMockTheme(themeId: string): void;
	__resetMockThemes(): void;
};

describe("preferences", () => {
	const prefs = preferences;

	beforeEach(() => {
		localStorage.clear();
		mockLoad.mockReset();
		mockSave.mockReset();
		mockDiscover.mockReset();
		mockThemeModule.__resetMockThemes();
		// Default: no on-disk file, so existing non-migration tests that don't
		// call init() are unaffected, and tests that DO call init() get "absent
		// file" behavior unless they override this.
		mockLoad.mockResolvedValue(null);
		mockSave.mockResolvedValue(undefined);
		// Default: scan ran and found nothing beyond the two mocked builtins —
		// matches the `scanned: true` shape every pre-existing (pre-discovery)
		// test implicitly assumed. Tests exercising the ordering race or the
		// scanned:false branch override this per-case.
		mockDiscover.mockResolvedValue({ scanned: true, themes: [] });
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

	// markdown-viewer-bnw / zm6: theme discovery must complete before init()
	// decides whether a stored theme id is valid, and the persistence
	// consequence of a FAILED scan must differ from a scan that legitimately
	// found nothing.
	describe("init: theme discovery ordering and the scanned discriminant", () => {
		// THE ordering regression, as an acceptance test. `isThemeId` is a
		// point-in-time snapshot of theme.svelte.ts's live registry — if init()
		// checks it before discovery has resolved, a valid user-theme id looks
		// unknown and falls through to the default on every single launch.
		//
		// Deferred promise: discover() is left unresolved until AFTER the
		// assertion on stored.theme's parse would have already run, so this
		// only passes if init() actually AWAITS discover() before checking
		// isThemeId — not merely calls it and moves on.
		it("awaits discover() before validating the stored theme id, so a late-discovered id still applies", async () => {
			let resolveDiscover!: (result: { scanned: true; themes: unknown[] }) => void;
			mockDiscover.mockReturnValue(
				new Promise((resolve) => {
					resolveDiscover = resolve;
				}),
			);
			mockLoad.mockResolvedValue(JSON.stringify({ theme: "my-theme" }));

			const initPromise = prefs.init();

			// Register "my-theme" as something discover() would have found, but
			// don't resolve discover() itself yet — if init() raced ahead of it,
			// the isThemeId check below would already have run and failed.
			mockThemeModule.__addMockTheme("my-theme");
			resolveDiscover({ scanned: true, themes: [] });

			await initPromise;
			expect(prefs.theme.id).toBe("my-theme");
		});

		// scanned: false — the scan itself could not run (broken IPC, unreadable
		// directory). This must NOT be treated as evidence the stored theme is
		// gone: applying (and persisting) a fallback here would permanently
		// overwrite a perfectly valid stored id with "github-dark" the moment a
		// transient IPC hiccup coincides with app launch.
		it("scanned:false: preserves the stored theme id verbatim when a later setter fires", async () => {
			mockDiscover.mockResolvedValue({ scanned: false });
			mockLoad.mockResolvedValue(JSON.stringify({ theme: "unresolvable-theme" }));

			await prefs.init();

			// A later, unrelated setter call (zoom) must not smuggle the visual
			// fallback onto disk as a side effect of writing zoomLevel.
			vi.useFakeTimers();
			prefs.zoomIn();
			await vi.advanceTimersByTimeAsync(200);
			vi.useRealTimers();

			expect(mockSave).toHaveBeenCalledTimes(1);
			const written = JSON.parse(mockSave.mock.calls[0]![0]);
			// The ORIGINAL id, not the default the UI fell back to, and not an
			// absent key. Omitting the field would be just as destructive as
			// writing the fallback: `savePreferencesFile` replaces the whole
			// file rather than merging into it (`write_atomic` renames a freshly
			// written temp over it), so a payload with no `theme` key deletes
			// the user's choice on the first zoom step after a failed scan.
			// This assertion is the difference between the two, and it fails
			// against an omit-the-key implementation.
			expect(written.theme).toBe("unresolvable-theme");
			expect(written.zoomLevel).toBeCloseTo(1.1, 5);
		});

		// scanned: true and the stored id is absent from the (successfully
		// discovered) list — the theme really is gone (deleted, renamed). This
		// is zm6's explicit requirement: fall back to default AND WRITE IT, so
		// the broken reference doesn't linger in the file forever waiting for a
		// scan that will never find it.
		it("scanned:true, id absent: falls back to the default theme and PERSISTS the fallback", async () => {
			mockDiscover.mockResolvedValue({ scanned: true, themes: [] });
			mockLoad.mockResolvedValue(JSON.stringify({ theme: "deleted-theme" }));

			await prefs.init();
			expect(prefs.theme.id).toBe("github-dark"); // DEFAULT_THEME_ID in the mock

			vi.useFakeTimers();
			prefs.zoomIn();
			await vi.advanceTimersByTimeAsync(200);
			vi.useRealTimers();

			expect(mockSave).toHaveBeenCalledTimes(1);
			const written = JSON.parse(mockSave.mock.calls[0]![0]);
			expect(written.theme).toBe("github-dark");
		});

		it("scanned:true, id present: applies and persists the stored id normally", async () => {
			mockDiscover.mockResolvedValue({ scanned: true, themes: [] });
			mockLoad.mockResolvedValue(JSON.stringify({ theme: "github-light" }));

			await prefs.init();
			expect(prefs.theme.id).toBe("github-light");

			vi.useFakeTimers();
			prefs.zoomIn();
			await vi.advanceTimersByTimeAsync(200);
			vi.useRealTimers();

			const written = JSON.parse(mockSave.mock.calls[0]![0]);
			expect(written.theme).toBe("github-light");
		});
	});

	// markdown-viewer-e9b/y0z: a theme file can be deleted, renamed, or edited
	// on disk at any point mid-session, not only at launch — the
	// `user-themes-changed` watcher calls this after every debounced
	// re-discovery. Uses the SAME fallback-and-persist rule as init()'s
	// scanned:true-absent branch (see applyResolvedTheme's doc comment).
	describe("redetectThemes: mid-session reconciliation", () => {
		it("falls back to default and persists when the active theme is no longer discoverable", async () => {
			mockDiscover.mockResolvedValue({ scanned: true, themes: [] });
			mockLoad.mockResolvedValue(JSON.stringify({ theme: "github-light" }));
			await prefs.init();
			expect(prefs.theme.id).toBe("github-light");
			mockSave.mockClear();

			mockThemeModule.__removeMockTheme("github-light");
			mockDiscover.mockResolvedValue({ scanned: true, themes: [] });

			vi.useFakeTimers();
			await preferences.redetectThemes();
			// applyResolvedTheme's fallback branch calls persist(), which is
			// itself debounced — advance past that debounce to observe the write.
			await vi.advanceTimersByTimeAsync(200);
			vi.useRealTimers();

			expect(prefs.theme.id).toBe("github-dark"); // DEFAULT_THEME_ID in the mock
			expect(mockSave).toHaveBeenCalledTimes(1);
			const written = JSON.parse(mockSave.mock.calls[0]![0]);
			expect(written.theme).toBe("github-dark");
		});

		it("does nothing when the active theme still resolves", async () => {
			mockDiscover.mockResolvedValue({ scanned: true, themes: [] });
			mockLoad.mockResolvedValue(JSON.stringify({ theme: "github-light" }));
			await prefs.init();
			mockSave.mockClear();
			mockDiscover.mockClear();

			mockDiscover.mockResolvedValue({ scanned: true, themes: [] });
			vi.useFakeTimers();
			await preferences.redetectThemes();
			await vi.advanceTimersByTimeAsync(200);
			vi.useRealTimers();

			// Still the same theme, and no unnecessary re-apply/persist.
			expect(prefs.theme.id).toBe("github-light");
			expect(mockSave).not.toHaveBeenCalled();
		});

		it("does nothing when the re-scan itself fails (scanned:false) — an already-applied theme is left alone", async () => {
			mockDiscover.mockResolvedValue({ scanned: true, themes: [] });
			mockLoad.mockResolvedValue(JSON.stringify({ theme: "github-light" }));
			await prefs.init();
			mockSave.mockClear();

			mockDiscover.mockResolvedValue({ scanned: false });
			vi.useFakeTimers();
			await preferences.redetectThemes();
			await vi.advanceTimersByTimeAsync(200);
			vi.useRealTimers();

			expect(prefs.theme.id).toBe("github-light"); // unchanged
			expect(mockSave).not.toHaveBeenCalled();
		});

		// A launch-time scan failure leaves `themeState.id` on the visual
		// fallback while `unverifiedThemeId` holds the user's REAL choice. A
		// later successful redetect must retry that original id — not just
		// check whether the visual fallback (a builtin, always resolvable)
		// still works, which would never recover the user's actual theme.
		it("a successful redetect retries and recovers the id held from a failed launch-time scan", async () => {
			mockDiscover.mockResolvedValue({ scanned: false });
			mockLoad.mockResolvedValue(JSON.stringify({ theme: "was-unresolvable" }));
			await prefs.init();
			expect(prefs.theme.id).toBe("github-dark"); // visual fallback only

			// A later, successful redetect: the registry now contains the theme
			// that couldn't be checked at launch (the scan was merely transient).
			mockThemeModule.__addMockTheme("was-unresolvable");
			mockDiscover.mockResolvedValue({ scanned: true, themes: [] });

			vi.useFakeTimers();
			await preferences.redetectThemes();
			await vi.advanceTimersByTimeAsync(200);
			vi.useRealTimers();

			// The user's real theme is recovered, not left on the fallback.
			expect(prefs.theme.id).toBe("was-unresolvable");
		});

		// The other outcome of the same retry: the originally-held id is
		// genuinely gone even once a scan can finally run. This is the
		// fallback-and-persist branch, reached via the held id instead of a
		// freshly-parsed one — the held id must still be released afterward, so
		// a later unrelated setter call persists the (now-committed) fallback,
		// not the dead id forever.
		it("a successful redetect that still can't resolve the held id commits and persists the fallback", async () => {
			mockDiscover.mockResolvedValue({ scanned: false });
			mockLoad.mockResolvedValue(JSON.stringify({ theme: "permanently-gone" }));
			await prefs.init();
			expect(prefs.theme.id).toBe("github-dark");

			// Redetect succeeds this time, but "permanently-gone" was never added
			// — it really doesn't exist.
			mockDiscover.mockResolvedValue({ scanned: true, themes: [] });
			vi.useFakeTimers();
			await preferences.redetectThemes();
			await vi.advanceTimersByTimeAsync(200);
			vi.useRealTimers();

			expect(prefs.theme.id).toBe("github-dark");
			expect(mockSave).toHaveBeenCalledTimes(1);
			expect(JSON.parse(mockSave.mock.calls[0]![0]).theme).toBe("github-dark");

			// The held id is now released — a later write must not resurrect it.
			mockSave.mockClear();
			vi.useFakeTimers();
			prefs.zoomIn();
			await vi.advanceTimersByTimeAsync(200);
			vi.useRealTimers();

			expect(mockSave).toHaveBeenCalledTimes(1);
			expect(JSON.parse(mockSave.mock.calls[0]![0]).theme).toBe("github-dark");
		});
	});

	// `parseStoredPreferences` proves stored numerics are finite, not that they
	// are in range. Nothing validates the file's contents before this, so an
	// out-of-range value read from disk must be brought into the setters' output
	// domain on load — everything downstream (the range inputs, the `format`
	// functions) was written against that domain.
	describe("init: numeric normalization on load", () => {
		it("clamps values above the maximum", async () => {
			mockLoad.mockResolvedValue(
				JSON.stringify({ zoomLevel: 1e6, fontWeight: 9999, letterSpacing: 99, lineHeight: 1e9 }),
			);

			await prefs.init();

			expect(prefs.zoomLevel).toBe(3);
			expect(prefs.fontWeightCss).toBe("700");
			expect(prefs.letterSpacingCss).toBe("0.15em");
			expect(prefs.lineHeightCss).toBe("2.4");
		});

		it("clamps values below the minimum", async () => {
			mockLoad.mockResolvedValue(
				JSON.stringify({ zoomLevel: -100, fontWeight: 1, letterSpacing: -5, lineHeight: 0 }),
			);

			await prefs.init();

			expect(prefs.zoomLevel).toBe(0.5);
			expect(prefs.fontWeightCss).toBe("300");
			expect(prefs.letterSpacingCss).toBe("-0.05em");
			expect(prefs.lineHeightCss).toBe("1.2");
		});

		// Pins the quantization decision: the load path must produce a value the
		// setters could have produced, otherwise the panel's range inputs and the
		// `format` functions (which use toFixed) display a value that disagrees
		// with the CSS actually applied.
		it("quantizes fractional values to each setting's precision", async () => {
			mockLoad.mockResolvedValue(
				JSON.stringify({ zoomLevel: 0.6666, letterSpacing: 0.03333, lineHeight: 1.6666 }),
			);

			await prefs.init();

			// `toBe`, not `toBeCloseTo`: the multiply-then-divide form produces
			// exact quanta, and asserting that is what makes this test reject a
			// regression to `Math.round(v / q) * q` (which yields 1.2000000000000002
			// for some inputs — close to, but not, the quantum).
			expect(prefs.zoomLevel).toBe(0.7);
			expect(prefs.letterSpacingCss).toBe("0.03em");
			expect(prefs.lineHeightCss).toBe("1.7");
		});

		// fontWeight deliberately has no `precision` in NUMERIC_SPECS: the slider
		// steps by 100, but CSS accepts any integer weight and variable fonts
		// honor them, so a hand-written intermediate weight is kept rather than
		// snapped to the nearest 100.
		it("clamps but does not quantize fontWeight", async () => {
			mockLoad.mockResolvedValue(JSON.stringify({ fontWeight: 437 }));

			await prefs.init();

			expect(prefs.fontWeightCss).toBe("437");
		});

		// REGRESSION: normalization must not go through the setters. Each setter
		// calls persist(), so routing the load path through them would write on
		// every launch AND interleave those writes with the migration write
		// queued earlier in init() — the exact ordering hazard queueSave exists
		// to prevent. This is what pins "clamp without persisting" for the
		// NUMERIC fields specifically.
		//
		// This payload has no `theme` key, so — as of markdown-viewer-zm6 (see
		// the "theme discovery ordering" describe block above) — init() DOES
		// write once, via applyResolvedTheme's fallback-and-persist branch. That
		// write is correct and intended, not a normalization leak: it is
		// pinned by its own tests. What THIS test still guards is that the
		// numeric fields land in that one write already normalized, rather than
		// via their own separate setter-driven persist() calls layered on top.
		it("does not additionally write via the numeric setters while normalizing on load", async () => {
			vi.useFakeTimers();
			mockLoad.mockResolvedValue(
				JSON.stringify({ zoomLevel: 1e6, fontWeight: 9999, letterSpacing: -5, lineHeight: 0 }),
			);

			await prefs.init();
			// Well past the 150ms save debounce — an extra setter-driven persist
			// would have landed by now.
			await vi.advanceTimersByTimeAsync(300);

			// Exactly the one write from the theme fallback, not one-per-setter.
			expect(mockSave).toHaveBeenCalledTimes(1);
			const written = JSON.parse(mockSave.mock.calls[0]![0]);
			expect(written.zoomLevel).toBe(3);
			expect(written.fontWeight).toBe(700);
			expect(written.letterSpacing).toBe(-0.05);
			expect(written.lineHeight).toBe(1.2);
			vi.useRealTimers();
		});
	});
});
