import { describe, it, expect } from "vitest";
import { themes } from "./registry";
import { themeColors } from "./theme-colors";

describe("theme registry", () => {
	// Exact set, in order: this single assertion subsumes the count, the
	// membership check ("includes expected themes"), and default-is-first
	// (index 0 is `github-dark`) all at once.
	it("has exactly the 7 curated builtin themes, in order", () => {
		expect(themes.map((t) => t.id)).toEqual([
			"github-dark",
			"github-light",
			"neo-brutalist",
			"pastel-dream",
			"swiss-design",
			"candy-pop",
			"minimal-mono",
		]);
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

	// The reason theme-colors.ts is generated: a hand-authored swatch could
	// disagree with the CSS it previews. This asserts the generated file is in
	// sync with the registry; `pnpm gen:theme-colors` regenerates it.
	describe("generated palette", () => {
		it("covers exactly the registered themes", () => {
			expect(Object.keys(themeColors).sort()).toEqual(themes.map((t) => t.id).sort());
		});

		it("supplies each theme's swatch from the generated file", () => {
			for (const theme of themes) {
				expect(theme.colors, `${theme.id}`).toEqual(themeColors[theme.id as keyof typeof themeColors]);
			}
		});
	});
});
