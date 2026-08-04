import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@tauri-apps/api/core", () => ({
	invoke: vi.fn(),
}));

import { invoke } from "@tauri-apps/api/core";
import {
	loadPreferencesFile,
	savePreferencesFile,
	loadUserThemes,
	importThemeCss,
	deleteUserTheme,
	watchUserThemes,
} from "./ipc";

const mockInvoke = vi.mocked(invoke);

describe("ipc: preferences file commands", () => {
	beforeEach(() => {
		mockInvoke.mockReset();
	});

	describe("loadPreferencesFile", () => {
		it("returns the raw JSON string on success", async () => {
			mockInvoke.mockResolvedValue('{"zoomLevel":1.5}');
			await expect(loadPreferencesFile()).resolves.toBe('{"zoomLevel":1.5}');
			expect(mockInvoke).toHaveBeenCalledWith("get_preferences");
		});

		it("returns null when the backend reports no file", async () => {
			mockInvoke.mockResolvedValue(null);
			await expect(loadPreferencesFile()).resolves.toBeNull();
		});

		// The doc comment on loadPreferencesFile is explicit that "file absent"
		// and "IPC call failed" are deliberately conflated into the same `null`
		// return so callers degrade to defaults either way. Pin that here: a
		// rejected invoke() must resolve to null, not propagate.
		it("swallows IPC failures and resolves to null instead of throwing", async () => {
			const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
			mockInvoke.mockRejectedValue(new Error("channel closed"));

			await expect(loadPreferencesFile()).resolves.toBeNull();
			expect(consoleError).toHaveBeenCalledWith("Failed to load preferences:", expect.any(Error));

			consoleError.mockRestore();
		});
	});

	describe("savePreferencesFile", () => {
		it("invokes set_preferences with the JSON payload", async () => {
			mockInvoke.mockResolvedValue(undefined);
			await savePreferencesFile('{"zoomLevel":2}');
			expect(mockInvoke).toHaveBeenCalledWith("set_preferences", { json: '{"zoomLevel":2}' });
		});

		// Unlike loadPreferencesFile, this must NOT swallow errors — callers
		// (the debounced save, the localStorage migration path) need the
		// rejection to decide whether the on-disk file is now the source of
		// truth (see preferences.svelte.ts's migration comment block).
		it("propagates rejection instead of swallowing it", async () => {
			mockInvoke.mockRejectedValue(new Error("disk full"));
			await expect(savePreferencesFile("{}")).rejects.toThrow("disk full");
		});
	});
});

describe("ipc: user theme commands", () => {
	beforeEach(() => {
		mockInvoke.mockReset();
	});

	describe("loadUserThemes", () => {
		it("returns the discovered theme list on success", async () => {
			const files = [{ id: "ink", path: "/themes/ink.css", revision: 1, css: ".app{}" }];
			mockInvoke.mockResolvedValue(files);

			await expect(loadUserThemes()).resolves.toEqual(files);
			expect(mockInvoke).toHaveBeenCalledWith("get_user_themes");
		});

		// Like loadPreferencesFile, callers cannot act differently on a broken
		// IPC channel — degrade to an empty list rather than throwing.
		it("swallows IPC failures and resolves to an empty array", async () => {
			const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
			mockInvoke.mockRejectedValue(new Error("channel closed"));

			await expect(loadUserThemes()).resolves.toEqual([]);
			expect(consoleError).toHaveBeenCalledWith("Failed to load user themes:", expect.any(Error));

			consoleError.mockRestore();
		});

		// Storybook's tauri-mock resolves unmocked commands to `null` (see
		// .storybook/tauri-mock.ts) — a `.map` over that would throw before any
		// story renders, so a non-array response must coerce to `[]` rather than
		// being trusted at face value.
		it("coerces a non-array response to an empty array", async () => {
			mockInvoke.mockResolvedValue(null);
			await expect(loadUserThemes()).resolves.toEqual([]);
		});
	});

	describe("importThemeCss", () => {
		it("invokes import_theme with id and css, returning the stored file", async () => {
			const stored = { id: "ink", path: "/themes/ink.css", revision: 1, css: ".app{}" };
			mockInvoke.mockResolvedValue(stored);

			await expect(importThemeCss("ink", ".app{}")).resolves.toEqual(stored);
			expect(mockInvoke).toHaveBeenCalledWith("import_theme", { id: "ink", css: ".app{}" });
		});

		// The import UI needs to know a write failed so it can show a toast
		// rather than silently pretending the theme was installed.
		it("propagates rejection instead of swallowing it", async () => {
			mockInvoke.mockRejectedValue(new Error("invalid id"));
			await expect(importThemeCss("bad id", ".app{}")).rejects.toThrow("invalid id");
		});
	});

	describe("deleteUserTheme", () => {
		it("invokes delete_user_theme with the id", async () => {
			mockInvoke.mockResolvedValue(undefined);
			await deleteUserTheme("ink");
			expect(mockInvoke).toHaveBeenCalledWith("delete_user_theme", { id: "ink" });
		});

		it("propagates rejection instead of swallowing it", async () => {
			mockInvoke.mockRejectedValue(new Error("not found"));
			await expect(deleteUserTheme("ink")).rejects.toThrow("not found");
		});
	});

	describe("watchUserThemes", () => {
		it("invokes watch_user_themes", async () => {
			mockInvoke.mockResolvedValue(undefined);
			await watchUserThemes();
			expect(mockInvoke).toHaveBeenCalledWith("watch_user_themes");
		});

		it("propagates rejection instead of swallowing it", async () => {
			mockInvoke.mockRejectedValue(new Error("fs watcher failed"));
			await expect(watchUserThemes()).rejects.toThrow("fs watcher failed");
		});
	});
});
