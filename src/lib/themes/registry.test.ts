import { describe, it, expect } from "vitest";
import { themes } from "./registry";

describe("theme registry", () => {
	it("has 22 themes", () => {
		expect(themes).toHaveLength(22);
	});

	it("every theme has required fields", () => {
		for (const theme of themes) {
			expect(theme.id, `${theme.id} missing id`).toBeTruthy();
			expect(theme.name, `${theme.id} missing name`).toBeTruthy();
			expect(theme.colors.bg, `${theme.id} missing bg color`).toBeTruthy();
			expect(theme.colors.text, `${theme.id} missing text color`).toBeTruthy();
			expect(theme.colors.accent, `${theme.id} missing accent color`).toBeTruthy();
			expect(theme.load, `${theme.id} missing load fn`).toBeTypeOf("function");
		}
	});

	it("all theme IDs are unique", () => {
		const ids = themes.map((t) => t.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it("all theme names are unique", () => {
		const names = themes.map((t) => t.name);
		expect(new Set(names).size).toBe(names.length);
	});

	it("all colors are valid hex values", () => {
		const hexRegex = /^#[0-9a-fA-F]{3,8}$/;
		for (const theme of themes) {
			expect(theme.colors.bg, `${theme.id} bg`).toMatch(hexRegex);
			expect(theme.colors.text, `${theme.id} text`).toMatch(hexRegex);
			expect(theme.colors.accent, `${theme.id} accent`).toMatch(hexRegex);
		}
	});

	it("includes expected themes", () => {
		const ids = themes.map((t) => t.id);
		expect(ids).toContain("github-dark");
		expect(ids).toContain("github-light");
		expect(ids).toContain("retro-terminal");
		expect(ids).toContain("neon-cyberpunk");
	});

	it("first theme is github-dark (default)", () => {
		expect(themes[0]!.id).toBe("github-dark");
	});
});
