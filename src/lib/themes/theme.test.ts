import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the registry to avoid importing real CSS files. `load` resolves the
// same `SanitizeResult` shape every theme now returns (see the WHY comment
// on `ThemeMetaBase.load` in types.ts) — a bare string here would make every
// `setTheme` call look refused, since `result.ok` would be `undefined`.
vi.mock("./registry", () => ({
	themes: [
		{
			id: "mock-dark",
			name: "Mock Dark",
			colors: { bg: "#000", text: "#fff", accent: "#0ff" },
			load: () => Promise.resolve({ ok: true, css: "body { color: white; }" }),
		},
		{
			id: "mock-light",
			name: "Mock Light",
			colors: { bg: "#fff", text: "#000", accent: "#00f" },
			load: () => Promise.resolve({ ok: true, css: "body { color: black; }" }),
		},
	],
}));

// theme.svelte.ts talks to disk exclusively through loadUserThemes (the ipc.ts
// seam) — mocking it here is what keeps discover() tests hermetic and lets
// each test control exactly what "the backend found on disk" means.
vi.mock("../ipc", () => ({
	loadUserThemes: vi.fn(),
}));

// toast is a real module-level singleton (see toast.svelte.ts) — not mocked,
// so refusal-path tests assert against its actual queue rather than a spy,
// the same way theme.svelte.ts's own consumers would observe it.

import { themeState, isThemeId, discover } from "./theme.svelte";
import { themes } from "./registry";
import { loadUserThemes } from "../ipc";
import { toast } from "../toast.svelte";

const mockLoadUserThemes = vi.mocked(loadUserThemes);

// Frontmatter block real enough for parseThemeCss to resolve `ok: true`, so
// buildUserThemes doesn't fall back to a title-cased id / gray swatch —
// tests that care about the real name/swatch use this; tests that want the
// fallback path use deliberately broken CSS instead.
const VALID_USER_CSS = `/*! @name Ink & Brush
    @description Sumi-e brushwork on rice paper.
    @author peep */
.app { --md-bg: #fffff8; --md-text: #1a1a1a; --md-accent: #445; }`;

describe("theme state", () => {
	const theme = themeState;

	beforeEach(async () => {
		localStorage.clear();
		mockLoadUserThemes.mockReset();
		mockLoadUserThemes.mockResolvedValue([]);
		for (const t of [...toast.toasts]) toast.dismiss(t.id);
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

		// The whole reason load() returns a discriminated result instead of a
		// bare string: a refused theme must never become the active id, or the
		// next persist() call in preferences.svelte.ts would write a broken
		// choice to disk forever.
		// The mocked ./registry array can only ever resolve ok:true, so exercising
		// the refusal path means going through the real sanitizer via discover()
		// + buildUserThemes with a UserThemeFile it will actually reject
		// (oversized, past sanitizeThemeCss's 256KB cap).
		it("does not commit activeId when load() reports !ok", async () => {
			await theme.setTheme("mock-dark");
			const huge = ".app{}" + "/* x */".repeat(50_000);
			mockLoadUserThemes.mockResolvedValue([
				{ id: "huge", path: "/themes/huge.css", revision: 1, css: huge },
			]);
			const result = await discover();
			expect(result.scanned).toBe(true);

			await theme.setTheme("huge");
			expect(theme.id).toBe("mock-dark"); // unchanged — refusal must not commit
		});

		it("surfaces a toast when load() reports !ok", async () => {
			const huge = ".app{}" + "/* x */".repeat(50_000);
			mockLoadUserThemes.mockResolvedValue([
				{ id: "huge", path: "/themes/huge.css", revision: 1, css: huge },
			]);
			await discover();

			await theme.setTheme("huge");
			expect(toast.toasts).toHaveLength(1);
			expect(toast.toasts[0]?.kind).toBe("error");
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

	describe("discover", () => {
		it("returns scanned: true with an empty list when the backend finds no user themes", async () => {
			mockLoadUserThemes.mockResolvedValue([]);
			const result = await discover();
			expect(result).toEqual({ scanned: true, themes: expect.any(Array) });
		});

		it("merges discovered user themes into `all`, after the builtins", async () => {
			mockLoadUserThemes.mockResolvedValue([
				{ id: "ink-brush", path: "/themes/ink.css", revision: 1, css: VALID_USER_CSS },
			]);
			await discover();
			const ids = theme.all.map((t) => t.id);
			expect(ids).toEqual(["mock-dark", "mock-light", "ink-brush"]);
		});

		it("newly discovered user themes become valid setTheme targets", async () => {
			mockLoadUserThemes.mockResolvedValue([
				{ id: "ink-brush", path: "/themes/ink.css", revision: 1, css: VALID_USER_CSS },
			]);
			await discover();
			expect(isThemeId("ink-brush")).toBe(true);

			await theme.setTheme("ink-brush");
			expect(theme.id).toBe("ink-brush");
		});

		// loadUserThemes() (ipc.ts) already never rejects — a broken IPC channel
		// resolves to `[]`, which discover() cannot distinguish from "the
		// directory is genuinely empty." Both are scanned: true. Only a throw
		// from the synchronous merge step would reach scanned: false; this test
		// exists to pin that discover() itself still never rejects even in that
		// case, matching its documented contract.
		it("never rejects, even if the underlying call throws synchronously", async () => {
			mockLoadUserThemes.mockRejectedValue(new Error("should not happen, ipc.ts swallows this"));
			await expect(discover()).resolves.toBeDefined();
		});

		// In-flight dedup: two concurrent callers during the same round trip must
		// share one loadUserThemes() call, not each fire their own.
		it("dedupes concurrent calls into a single loadUserThemes round trip", async () => {
			let resolveLoad!: (files: never[]) => void;
			mockLoadUserThemes.mockReturnValue(
				new Promise((resolve) => {
					resolveLoad = resolve;
				}),
			);

			const first = discover();
			const second = discover();
			expect(mockLoadUserThemes).toHaveBeenCalledTimes(1);

			resolveLoad([]);
			await Promise.all([first, second]);
			expect(mockLoadUserThemes).toHaveBeenCalledTimes(1);
		});

		it("resets the in-flight guard on settle, so a later call issues a fresh round trip", async () => {
			mockLoadUserThemes.mockResolvedValue([]);
			await discover();
			await discover();
			expect(mockLoadUserThemes).toHaveBeenCalledTimes(2);
		});
	});
});
