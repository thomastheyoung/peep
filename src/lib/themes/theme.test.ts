import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the registry to avoid importing real CSS files
vi.mock("./registry", () => ({
	themes: [
		{
			id: "mock-dark",
			name: "Mock Dark",
			colors: { bg: "#000", text: "#fff", accent: "#0ff" },
			load: () => Promise.resolve("body { color: white; }"),
		},
		{
			id: "mock-light",
			name: "Mock Light",
			colors: { bg: "#fff", text: "#000", accent: "#00f" },
			load: () => Promise.resolve("body { color: black; }"),
		},
	],
}));

import { themeState, isThemeId } from "./theme.svelte";
import { themes } from "./registry";

describe("theme state", () => {
	const theme = themeState;

	beforeEach(async () => {
		localStorage.clear();
		// Reset singleton to first theme (mock-dark)
		await theme.setTheme("mock-dark");
	});

	it("lists all themes", () => {
		expect(theme.all).toHaveLength(2);
	});

	describe("setTheme", () => {
		it("loads and activates a theme", async () => {
			await theme.setTheme("mock-light");
			expect(theme.id).toBe("mock-light");
			expect(theme.css).toBe("body { color: black; }");
		});

		it("does not persist to localStorage", async () => {
			await theme.setTheme("mock-dark");
			expect(localStorage.getItem("md-theme")).toBeNull();
		});

		it("ignores unknown theme IDs", async () => {
			await theme.setTheme("mock-dark"); // set known first
			await theme.setTheme("nonexistent");
			expect(theme.id).toBe("mock-dark"); // unchanged
		});

		it("active theme can be looked up in the registry", async () => {
			await theme.setTheme("mock-light");
			const meta = themes.find((t) => t.id === theme.id);
			expect(meta?.name).toBe("Mock Light");
			expect(meta?.colors.bg).toBe("#fff");
		});
	});

	describe("init", () => {
		it("loads the default theme", async () => {
			await theme.init();
			expect(theme.id).toBe("mock-dark");
		});
	});

	describe("isThemeId", () => {
		it("returns true for valid theme IDs", () => {
			expect(isThemeId("mock-dark")).toBe(true);
			expect(isThemeId("mock-light")).toBe(true);
		});

		it("returns false for invalid theme IDs", () => {
			expect(isThemeId("nonexistent")).toBe(false);
			expect(isThemeId("")).toBe(false);
		});
	});
});
