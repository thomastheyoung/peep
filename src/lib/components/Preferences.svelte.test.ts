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
 * clipboard paste, added in peep-bnw's final commit). The rest of
 * Preferences.svelte's behavior (settings registry rendering, panel
 * open/close) has no dedicated test file yet and is out of scope here —
 * `$lib/preferences.svelte` is mocked down to exactly the surface this
 * component touches, matching the isolation pattern in
 * `theme.test.ts`/`preferences.test.ts`.
 */
const mockRedetect = vi.hoisted(() => vi.fn());
const mockNameThemeFlow = vi.hoisted(() => vi.fn());
vi.mock("$lib/preferences.svelte", () => ({
	preferences: {
		showPanel: false,
		activeSection: "appearance",
		settings: [
			{
				type: "theme",
				id: "theme",
				label: "Theme",
				section: "appearance",
				keywords: [],
				options: [
					{
						value: "github-dark",
						label: "GitHub Dark",
						swatches: { bg: "#000", text: "#fff", accent: "#f00" },
						source: "builtin",
						actions: ["duplicate"],
					},
					// A USER theme is required in this mock, not optional detail:
					// without one, nothing renders a delete button or the "Your
					// themes" group, so every a11y property of the card markup
					// would be unpinned and the suite would stay green if
					// `aria-pressed` became `aria-selected` or the action buttons
					// gained `display: none`.
					{
						value: "my-theme",
						label: "My Theme",
						swatches: { bg: "#fff", text: "#000", accent: "#00f" },
						source: "user",
						path: "/cfg/themes/my-theme.css",
						revision: 1,
						actions: ["duplicate", "delete"],
					},
				],
				value: "github-dark",
				select: vi.fn(),
				remove: vi.fn(),
				duplicate: vi.fn(),
			},
		],
		redetectThemes: mockRedetect,
	},
	settingsSections: [{ id: "appearance", label: "Appearance" }],
	nameThemeFlow: mockNameThemeFlow,
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
import { prompt } from "$lib/prompt.svelte";

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
	mockNameThemeFlow.mockReset();
	mockNameThemeFlow.mockResolvedValue(undefined);
	for (const t of [...toast.toasts]) toast.dismiss(t.id);
	if (prompt.current) prompt.cancel();
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
			mockImport.mockResolvedValue({
				ok: true,
				file: { id: "my-cool-theme", path: "/x/my-cool-theme.css", revision: 1, css: VALID_THEME_CSS },
			});
			Object.assign(navigator, { clipboard: { readText: vi.fn().mockResolvedValue(VALID_THEME_CSS) } });

			instance = mount(Preferences, { target: host });
			getButton("Paste theme CSS").click();

			await vi.waitFor(() =>
				expect(mockImport).toHaveBeenCalledWith("my-cool-theme", VALID_THEME_CSS, "create-new"),
			);
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
		it("surfaces the backend's failure message via a toast, not a silent no-op", async () => {
			mockImport.mockResolvedValue({ ok: false, reason: "failed", message: "theme CSS exceeds 256KB" });
			Object.assign(navigator, { clipboard: { readText: vi.fn().mockResolvedValue(VALID_THEME_CSS) } });

			instance = mount(Preferences, { target: host });
			getButton("Paste theme CSS").click();

			await vi.waitFor(() => expect(toast.toasts).toHaveLength(1));
			expect(toast.toasts[0]).toMatchObject({ kind: "error", message: "theme CSS exceeds 256KB" });
			// redetectThemes must NOT run for a failed import — nothing new to reconcile.
			expect(mockRedetect).not.toHaveBeenCalled();
		});
	});

	describe("import collision (reason: 'exists')", () => {
		beforeEach(() => {
			Object.assign(navigator, { clipboard: { readText: vi.fn().mockResolvedValue(VALID_THEME_CSS) } });
		});

		async function waitForPrompt() {
			await vi.waitFor(() => expect(prompt.current).toBeDefined());
		}

		it("Cancel performs no write and shows no toast — cancelling is not an error", async () => {
			mockImport.mockResolvedValue({ ok: false, reason: "exists" });

			instance = mount(Preferences, { target: host });
			getButton("Paste theme CSS").click();
			await waitForPrompt();

			prompt.resolve("cancel");
			await vi.waitFor(() => expect(prompt.current).toBeUndefined());

			expect(mockImport).toHaveBeenCalledTimes(1); // only the original attempt
			expect(mockNameThemeFlow).not.toHaveBeenCalled();
			expect(toast.toasts).toHaveLength(0);
		});

		it("Replace re-imports under the same id with mode: 'replace'", async () => {
			mockImport
				.mockResolvedValueOnce({ ok: false, reason: "exists" })
				.mockResolvedValueOnce({
					ok: true,
					file: { id: "my-cool-theme", path: "/x/my-cool-theme.css", revision: 2, css: VALID_THEME_CSS },
				});

			instance = mount(Preferences, { target: host });
			getButton("Paste theme CSS").click();
			await waitForPrompt();

			prompt.resolve("replace");

			await vi.waitFor(() =>
				expect(mockImport).toHaveBeenNthCalledWith(2, "my-cool-theme", VALID_THEME_CSS, "replace"),
			);
			await vi.waitFor(() => expect(mockRedetect).toHaveBeenCalledOnce());
		});

		it("Keep both routes into the shared nameThemeFlow rather than writing directly", async () => {
			mockImport.mockResolvedValue({ ok: false, reason: "exists" });

			instance = mount(Preferences, { target: host });
			getButton("Paste theme CSS").click();
			await waitForPrompt();

			prompt.resolve("keep-both");

			await vi.waitFor(() =>
				expect(mockNameThemeFlow).toHaveBeenCalledWith("My Cool Theme", VALID_THEME_CSS),
			);
			// The collision handler itself must not perform a second create-new
			// write — that responsibility now belongs entirely to nameThemeFlow.
			expect(mockImport).toHaveBeenCalledTimes(1);
		});
	});

	describe("file picker", () => {
		it("reads the selected file's text and imports it, falling back to the filename when frontmatter has no @name", async () => {
			mockImport.mockResolvedValue({
				ok: true,
				file: { id: "plain-theme", path: "/x/plain-theme.css", revision: 1, css: ".app { --md-bg: #000; }" },
			});

			instance = mount(Preferences, { target: host });
			const fileInput = host.querySelector('input[type="file"]') as HTMLInputElement;

			const file = new File([".app { --md-bg: #000; }"], "plain-theme.css", { type: "text/css" });
			Object.defineProperty(fileInput, "files", { value: [file], configurable: true });
			fileInput.dispatchEvent(new Event("change", { bubbles: true }));

			await vi.waitFor(() =>
				expect(mockImport).toHaveBeenCalledWith("plain-theme", ".app { --md-bg: #000; }", "create-new"),
			);
		});

		it("clears the input value after reading, so re-selecting the same file still fires change", async () => {
			mockImport.mockResolvedValue({ ok: true, file: { id: "x", path: "/x.css", revision: 1, css: ".app{}" } });
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
	/**
	 * Card markup and a11y.
	 *
	 * These pin the structural properties the card rewrite exists to deliver.
	 * The card used to BE a `<button>`; a nested action button inside it was
	 * invalid HTML and an a11y failure, so it became a `<div>` wrapper with
	 * sibling buttons (the shape `TabBar.svelte` already uses). Every assertion
	 * below is something that could silently regress to a WCAG failure while
	 * still looking correct on screen.
	 */
	describe("theme card markup", () => {
		beforeEach(() => {
			instance = mount(Preferences, { target: host });
		});

		it("uses aria-pressed on the select button, not aria-selected", () => {
			// `aria-selected` is invalid on `button` and is IGNORED by assistive
			// tech — it would look right in the markup and announce nothing.
			const selected = document.querySelector('.theme-select[aria-pressed="true"]');
			expect(selected).not.toBeNull();
			expect(selected?.textContent).toContain("GitHub Dark");
			expect(document.querySelector("[aria-selected]")).toBeNull();
		});

		it("names the theme in every action button's accessible label", () => {
			// 20+ buttons all labelled "Delete" are unnavigable by label
			// (WCAG 2.4.6 / 2.5.3).
			const del = document.querySelector('[aria-label="Delete theme My Theme"]');
			expect(del, "delete button missing or generically labelled").not.toBeNull();
			expect(
				document.querySelector('[aria-label="Duplicate theme My Theme"]'),
			).not.toBeNull();
		});

		it("offers delete only for user themes", () => {
			// Builtins are immutable; a delete affordance on one would be a lie.
			expect(document.querySelectorAll("[aria-label^='Delete theme']")).toHaveLength(1);
			expect(
				document.querySelector('[aria-label="Delete theme GitHub Dark"]'),
			).toBeNull();
		});

		it("keeps action buttons in the tab order", () => {
			// `.tab-close` in TabBar uses tabindex=-1 because Cmd+W is its
			// keyboard equivalent. Theme delete has NO shortcut, so removing it
			// from the tab order would make it keyboard-unreachable — WCAG 2.1.1.
			for (const sel of ["Delete theme My Theme", "Duplicate theme My Theme"]) {
				const btn = document.querySelector(`[aria-label="${sel}"]`);
				expect(btn?.getAttribute("tabindex"), `${sel} was removed from tab order`).toBeNull();
			}
		});

		/**
		 * JSDOM CAPABILITY LIMIT — the reveal mechanism is NOT covered here.
		 *
		 * The action buttons rest at `opacity: 0` and appear on `:hover` /
		 * `:focus-within`. Using `display: none` or `visibility: hidden`
		 * instead would make them unfocusable and reintroduce the exact WCAG
		 * 2.1.1 keyboard failure this markup exists to fix — the single most
		 * consequential way this CSS can regress.
		 *
		 * jsdom cannot detect it: it has no layout engine, so it reports no
		 * focusability and `focus()` succeeds on a `display: none` node.
		 * MEASURED — swapping `opacity: 0` for `display: none` leaves all 15
		 * tests in this file green. Asserting that the component's CSS TEXT
		 * contains "opacity" would pass for the wrong reason: it checks that a
		 * stylesheet contains a word, not that a button can be focused.
		 *
		 * This is a real-browser concern, and it is on the manual pre-merge
		 * keyboard walkthrough (Tab must reach every card's delete button and
		 * the button must become visible on focus).
		 */
		it("does not nest interactive content inside interactive content", () => {
			// The whole reason for the div-wrapper rewrite.
			for (const card of document.querySelectorAll(".theme-card")) {
				expect(card.tagName).toBe("DIV");
				for (const btn of card.querySelectorAll("button")) {
					expect(btn.closest("button")).toBe(btn);
				}
			}
		});

		it("associates each group heading with its group for assistive tech", () => {
			// The grouping is what explains WHY one card has a delete button and
			// another doesn't. Without role/aria-labelledby that explanation is
			// visual-only — unavailable to exactly the users who can't see it.
			const groups = [...document.querySelectorAll('.theme-group[role="group"]')];
			expect(groups).toHaveLength(2);
			for (const g of groups) {
				const id = g.getAttribute("aria-labelledby");
				expect(id, "group has no aria-labelledby").toBeTruthy();
				expect(document.getElementById(id!)?.textContent).toMatch(
					/Built in|Your themes/,
				);
			}
		});
	});
});
