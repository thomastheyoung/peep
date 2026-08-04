import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount, unmount } from "svelte";

// jsdom (this repo's test environment) does not implement
// `HTMLDialogElement.showModal()`/`.close()` at all — confirmed directly
// against this repo's jsdom install, both are `undefined` on a real
// `<dialog>` node. Preferences.svelte calls both unconditionally in its
// panel-visibility $effect, so mounting it under jsdom throws before any
// assertion runs without this. A minimal polyfill (just enough to not throw;
// this suite does not assert modal semantics) scoped to this file only —
// not test-setup.ts — since no other current suite mounts a <dialog>-based
// component.
if (typeof HTMLDialogElement !== "undefined") {
	if (!HTMLDialogElement.prototype.showModal) {
		HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
			this.setAttribute("open", "");
		};
	}
	if (!HTMLDialogElement.prototype.close) {
		HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
			this.removeAttribute("open");
		};
	}
}

/**
 * `.svelte.test.ts`: needs `mount`/`unmount` (Svelte 5's component-test API,
 * not available under the default Vitest resolve conditions — see the
 * `resolve.conditions: ["browser"]` addition in vitest.config.ts, added for
 * ThemePreview.svelte.test.ts and reused here).
 *
 * This suite isolates the theme-IMPORT UI specifically (file picker +
 * clipboard paste, added in markdown-viewer-bnw's final commit). The rest of
 * Preferences.svelte's behavior (settings registry rendering, panel
 * open/close) has no dedicated test file yet and is out of scope here —
 * `$lib/preferences.svelte` is mocked down to exactly the surface this
 * component touches, matching the isolation pattern in
 * `theme.test.ts`/`preferences.test.ts`.
 */
const mockRedetect = vi.hoisted(() => vi.fn());
vi.mock("$lib/preferences.svelte", () => ({
	preferences: {
		showPanel: false,
		activeSection: "appearance",
		settings: [
			{
				type: "choice",
				id: "theme",
				label: "Theme",
				section: "appearance",
				keywords: [],
				options: [
					{ value: "github-dark", label: "GitHub Dark", swatches: { bg: "#000", text: "#fff", accent: "#f00" } },
				],
				value: "github-dark",
				select: vi.fn(),
			},
		],
		redetectThemes: mockRedetect,
	},
	settingsSections: [{ id: "appearance", label: "Appearance" }],
}));

vi.mock("$lib/ipc", () => ({
	importThemeCss: vi.fn(),
}));

vi.mock("@tauri-apps/api/core", () => ({
	invoke: vi.fn().mockResolvedValue(false),
}));

import Preferences from "./Preferences.svelte";
import { importThemeCss } from "$lib/ipc";
import { toast } from "$lib/toast.svelte";

const mockImport = vi.mocked(importThemeCss);

const VALID_THEME_CSS = `/*! @name My Cool Theme
    @description A test theme.
    @author test */
.app { --md-bg: #111; --md-text: #eee; --md-accent: #0af; }`;

let host: HTMLDivElement;
let instance: Record<string, unknown> | undefined;

function getButton(text: string): HTMLButtonElement {
	const btn = [...host.querySelectorAll("button")].find((b) => b.textContent?.includes(text));
	if (!btn) throw new Error(`No button found containing "${text}"`);
	return btn as HTMLButtonElement;
}

beforeEach(() => {
	host = document.createElement("div");
	document.body.appendChild(host);
	mockImport.mockReset();
	mockRedetect.mockReset();
	mockRedetect.mockResolvedValue(undefined);
	for (const t of [...toast.toasts]) toast.dismiss(t.id);
});

afterEach(() => {
	if (instance) {
		unmount(instance);
		instance = undefined;
	}
	host.remove();
});

describe("Preferences: theme import", () => {
	describe("clipboard paste", () => {
		it("imports the clipboard's CSS, deriving the id from its frontmatter @name", async () => {
			mockImport.mockResolvedValue({ id: "my-cool-theme", path: "/x/my-cool-theme.css", revision: 1, css: VALID_THEME_CSS });
			Object.assign(navigator, { clipboard: { readText: vi.fn().mockResolvedValue(VALID_THEME_CSS) } });

			instance = mount(Preferences, { target: host });
			getButton("Paste theme CSS").click();

			await vi.waitFor(() => expect(mockImport).toHaveBeenCalledWith("my-cool-theme", VALID_THEME_CSS));
			await vi.waitFor(() => expect(mockRedetect).toHaveBeenCalledOnce());
		});

		it("surfaces a toast and does not call importThemeCss when the clipboard is empty", async () => {
			Object.assign(navigator, { clipboard: { readText: vi.fn().mockResolvedValue("   ") } });

			instance = mount(Preferences, { target: host });
			getButton("Paste theme CSS").click();

			await vi.waitFor(() => expect(toast.toasts).toHaveLength(1));
			expect(toast.toasts[0]?.kind).toBe("error");
			expect(mockImport).not.toHaveBeenCalled();
		});

		it("surfaces a toast when reading the clipboard itself fails", async () => {
			const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
			Object.assign(navigator, { clipboard: { readText: vi.fn().mockRejectedValue(new Error("denied")) } });

			instance = mount(Preferences, { target: host });
			getButton("Paste theme CSS").click();

			await vi.waitFor(() => expect(toast.toasts).toHaveLength(1));
			expect(toast.toasts[0]?.kind).toBe("error");
			consoleError.mockRestore();
		});
	});

	describe("import failure (either source)", () => {
		it("surfaces the backend's rejection message via a toast, not a silent no-op", async () => {
			const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
			mockImport.mockRejectedValue(new Error("theme CSS exceeds 256KB"));
			Object.assign(navigator, { clipboard: { readText: vi.fn().mockResolvedValue(VALID_THEME_CSS) } });

			instance = mount(Preferences, { target: host });
			getButton("Paste theme CSS").click();

			await vi.waitFor(() => expect(toast.toasts).toHaveLength(1));
			expect(toast.toasts[0]).toMatchObject({ kind: "error", message: "theme CSS exceeds 256KB" });
			// redetectThemes must NOT run for a failed import — nothing new to reconcile.
			expect(mockRedetect).not.toHaveBeenCalled();
			consoleError.mockRestore();
		});
	});

	describe("file picker", () => {
		it("reads the selected file's text and imports it, falling back to the filename when frontmatter has no @name", async () => {
			mockImport.mockResolvedValue({ id: "plain", path: "/x/plain.css", revision: 1, css: ".app{}" });

			instance = mount(Preferences, { target: host });
			const fileInput = host.querySelector('input[type="file"]') as HTMLInputElement;

			const file = new File([".app { --md-bg: #000; }"], "plain-theme.css", { type: "text/css" });
			Object.defineProperty(fileInput, "files", { value: [file], configurable: true });
			fileInput.dispatchEvent(new Event("change", { bubbles: true }));

			await vi.waitFor(() => expect(mockImport).toHaveBeenCalledWith("plain-theme", ".app { --md-bg: #000; }"));
		});

		it("clears the input value after reading, so re-selecting the same file still fires change", async () => {
			mockImport.mockResolvedValue({ id: "x", path: "/x.css", revision: 1, css: ".app{}" });
			instance = mount(Preferences, { target: host });
			const fileInput = host.querySelector('input[type="file"]') as HTMLInputElement;

			const file = new File([".app{}"], "x.css", { type: "text/css" });
			Object.defineProperty(fileInput, "files", { value: [file], configurable: true });
			fileInput.dispatchEvent(new Event("change", { bubbles: true }));

			await vi.waitFor(() => expect(mockImport).toHaveBeenCalledOnce());
			expect(fileInput.value).toBe("");
		});
	});

	/**
	 * JSDOM CAPABILITY NOTE: the `.theme-name` ellipsis fix (overflow: hidden +
	 * text-overflow: ellipsis + max-width: 100%) is a pure-CSS layout property.
	 * jsdom has no layout engine at all — it cannot report whether text
	 * visually truncates, only what was literally declared (and even that not
	 * reliably for shorthand/cascade interactions; see this repo's standing
	 * note on `base.css` and `sanitize-theme-css.test.ts`'s capability
	 * section). A jsdom assertion here would check that the CSS text CONTAINS
	 * certain properties, which is not the same claim as "long names visually
	 * truncate" and would be misleading coverage. This is a real-browser
	 * concern; nothing in this file asserts it.
	 */
	it("jsdom capability note (see block comment above) — no assertion, documentation only", () => {
		expect(true).toBe(true);
	});
});
