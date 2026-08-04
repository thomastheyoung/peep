import { describe, it, expect } from "vitest";
import { buildUserThemes } from "./user-theme";
import type { UserThemeFile } from "../ipc";

const VALID_CSS = `/*! @name Ink & Brush
    @description Sumi-e brushwork headings on rice-paper texture.
    @author peep */
.app { --md-bg: #fffff8; --md-text: #1a1a1a; --md-accent: #445; }`;

function file(overrides: Partial<UserThemeFile>): UserThemeFile {
	return { id: "theme", path: "/themes/theme.css", revision: 1, css: VALID_CSS, ...overrides };
}

describe("buildUserThemes", () => {
	it("returns an empty array for no files", () => {
		expect(buildUserThemes([], ["github-dark"])).toEqual([]);
	});

	it("builds a theme from valid frontmatter + swatch", () => {
		const [theme] = buildUserThemes([file({ id: "ink-brush" })], []);
		expect(theme).toMatchObject({
			id: "ink-brush",
			name: "Ink & Brush",
			source: "user",
			path: "/themes/theme.css",
			revision: 1,
			colors: { bg: "#fffff8", text: "#1a1a1a", accent: "#445" },
		});
	});

	describe("id resolution", () => {
		it("slugifies the raw id", () => {
			const [theme] = buildUserThemes([file({ id: "My Theme!!" })], []);
			expect(theme!.id).toBe("my-theme");
		});

		it("suffixes a colliding id against a builtin", () => {
			const [theme] = buildUserThemes([file({ id: "github-dark" })], ["github-dark", "github-light"]);
			expect(theme!.id).toBe("github-dark-2");
		});

		// PURE resolveThemeId does not mutate `taken` itself — buildUserThemes
		// must insert each resolved id before resolving the next one, or two
		// colliding files both get handed the same suffix.
		it("resolves two colliding user files to distinct suffixed ids, not the same one", () => {
			const files = [file({ id: "dup", path: "/a.css" }), file({ id: "dup", path: "/b.css" })];
			const themes = buildUserThemes(files, []);
			const ids = themes.map((t) => t.id);
			expect(new Set(ids).size).toBe(2);
			expect(ids).toEqual(["dup", "dup-2"]);
		});

		// Sorting by id before resolving is what makes output order (and
		// therefore suffix assignment for any future collision) deterministic
		// across launches — the backend's directory scan order is not
		// guaranteed, so the array order here should not leak into the result.
		it("orders output by id regardless of input array order", () => {
			const files = [file({ id: "zebra", path: "/z.css" }), file({ id: "apple", path: "/a.css" })];
			const themes = buildUserThemes(files, []);
			expect(themes.map((t) => t.id)).toEqual(["apple", "zebra"]);
		});
	});

	describe("fallback swatch and name", () => {
		it("falls back to a neutral gray swatch when the CSS has no .app rule", () => {
			const [theme] = buildUserThemes([file({ id: "broken", css: "body { color: red; }" })], []);
			expect(theme!.colors).toEqual({ bg: "#808080", text: "#ffffff", accent: "#a0a0a0" });
		});

		it("falls back to a title-cased id when frontmatter is missing", () => {
			const [theme] = buildUserThemes(
				[file({ id: "my-cool-theme", css: ".app { --md-bg: #fff; --md-text: #000; --md-accent: #00f; }" })],
				[],
			);
			expect(theme!.name).toBe("My Cool Theme");
		});
	});

	describe("load()", () => {
		it("sanitizes the captured CSS and resolves a SanitizeResult", async () => {
			const [theme] = buildUserThemes([file({ id: "ink-brush" })], []);
			const result = await theme!.load();
			expect(result.ok).toBe(true);
		});

		it("reports failure via the result rather than throwing, for oversized CSS", async () => {
			const huge = ".app{}" + "/* x */".repeat(50_000);
			const [theme] = buildUserThemes([file({ id: "huge", css: huge })], []);
			const result = await theme!.load();
			expect(result.ok).toBe(false);
		});
	});
});
