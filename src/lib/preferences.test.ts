import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the theme module to isolate preferences testing
vi.mock("./themes/theme.svelte", () => {
	let id = "github-dark";
	return {
		getThemeState: () => ({
			get id() {
				return id;
			},
			get css() {
				return "";
			},
			get meta() {
				return { id, name: "GitHub Dark", colors: { bg: "#0d1117", text: "#e6edf3", accent: "#58a6ff" } };
			},
			get all() {
				return [
					{ id: "github-dark", name: "GitHub Dark", colors: { bg: "#0d1117", text: "#e6edf3", accent: "#58a6ff" }, load: () => Promise.resolve("") },
					{ id: "github-light", name: "GitHub Light", colors: { bg: "#fff", text: "#1f2328", accent: "#0969da" }, load: () => Promise.resolve("") },
				];
			},
			async setTheme(newId: string) {
				id = newId;
			},
			async init() {
				id = "github-dark";
			},
		}),
	};
});

import { getPreferences, type SettingDef, type RangeSetting, type ChoiceSetting } from "./preferences.svelte";

describe("preferences", () => {
	let prefs: ReturnType<typeof getPreferences>;

	beforeEach(() => {
		localStorage.clear();
		prefs = getPreferences();
		// Reset singleton state since preferences uses module-level $state
		prefs.resetZoom();
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

	describe("localStorage persistence", () => {
		it("saves preferences when zoom changes", () => {
			prefs.zoomIn();
			const stored = JSON.parse(localStorage.getItem("md-preferences")!);
			expect(stored.zoomLevel).toBeCloseTo(1.1, 1);
		});

		it("init restores stored values", async () => {
			localStorage.setItem(
				"md-preferences",
				JSON.stringify({
					theme: "github-light",
					contentWidth: "wide",
					zoomLevel: 1.5,
					fontWeight: 600,
					letterSpacing: 0.02,
					lineHeight: 2.0,
				}),
			);

			const fresh = getPreferences();
			await fresh.init();

			expect(fresh.zoomLevel).toBe(1.5);
			expect(fresh.contentWidthCss).toBe("1200px"); // wide
			expect(fresh.fontWeightCss).toBe("600");
			expect(fresh.letterSpacingCss).toBe("0.02em");
			expect(fresh.lineHeightCss).toBe("2");
		});

		it("init works with empty localStorage", async () => {
			const fresh = getPreferences();
			await fresh.init();
			expect(fresh.zoomLevel).toBe(1);
		});

		it("init handles corrupted localStorage gracefully", async () => {
			localStorage.setItem("md-preferences", "not json");
			const fresh = getPreferences();
			await fresh.init();
			// Should not throw, defaults apply
			expect(fresh.zoomLevel).toBe(1);
		});
	});
});
