import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@tauri-apps/api/core", () => ({
	invoke: vi.fn(),
}));

import { invoke } from "@tauri-apps/api/core";
import { loadPreferencesFile, savePreferencesFile } from "./ipc";

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
