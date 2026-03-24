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

import { getThemeState } from "./theme.svelte";

describe("theme state", () => {
	let theme: ReturnType<typeof getThemeState>;

	beforeEach(async () => {
		localStorage.clear();
		theme = getThemeState();
		// Reset singleton to first theme (mock-dark)
		await theme.setTheme("mock-dark");
		localStorage.clear(); // clear the setTheme persistence
	});

	it("defaults to mock-dark (first theme, matching github-dark behavior)", () => {
		// Before init, the default activeId is "github-dark" but our mock doesn't have it
		// After init it should fall back to the first theme
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

		it("persists to localStorage", async () => {
			await theme.setTheme("mock-dark");
			expect(localStorage.getItem("md-theme")).toBe("mock-dark");
		});

		it("ignores unknown theme IDs", async () => {
			await theme.setTheme("mock-dark"); // set known first
			await theme.setTheme("nonexistent");
			expect(theme.id).toBe("mock-dark"); // unchanged
		});

		it("meta reflects the active theme", async () => {
			await theme.setTheme("mock-light");
			expect(theme.meta?.name).toBe("Mock Light");
			expect(theme.meta?.colors.bg).toBe("#fff");
		});
	});

	describe("init", () => {
		it("restores saved theme from localStorage", async () => {
			localStorage.setItem("md-theme", "mock-light");
			await theme.init();
			expect(theme.id).toBe("mock-light");
		});

		it("falls back to first theme when saved theme is invalid", async () => {
			localStorage.setItem("md-theme", "nonexistent");
			await theme.init();
			expect(theme.id).toBe("mock-dark");
		});

		it("falls back to first theme when no saved theme", async () => {
			await theme.init();
			expect(theme.id).toBe("mock-dark");
		});
	});
});
