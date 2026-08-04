import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount, unmount, flushSync } from "svelte";

/**
 * `.svelte.test.ts`, not `.test.ts`: this file uses `$state` directly (see
 * `themeIdProp` below) to drive the component's `themeId` prop reactively
 * across a single mounted instance — Svelte 5's `mount()` has no `$set`
 * (that's a Svelte 4 API; calling it throws `component_api_changed`), so a
 * prop change means either re-mounting or passing a reactive prop getter.
 * The Svelte docs' own component-testing example only covers static props;
 * this file follows the documented "runes inside test files" pattern for the
 * cases that need to change a prop after mount.
 *
 * `theme.svelte.ts` is mocked rather than exercised for real: this suite's
 * job is to pin ThemePreview's OWN logic (resolution against the live list,
 * cache keying, the SanitizeResult unwrap) against a controllable `all` +
 * `load()`, not to re-prove the real registry or the real sanitizer — those
 * have their own suites (`registry.test.ts`, `sanitize-theme-css.test.ts`).
 */
const mockAll = vi.hoisted(() => ({ value: [] as unknown[] }));
vi.mock("$lib/themes/theme.svelte", () => ({
	get themeState() {
		return { all: mockAll.value };
	},
}));

import ThemePreview from "./ThemePreview.svelte";

interface MockTheme {
	id: string;
	name: string;
	source: "builtin" | "user";
	revision?: number;
	colors: { bg: string; text: string; accent: string };
	load: () => Promise<{ ok: true; css: string } | { ok: false; issue: { kind: string } }>;
}

function setThemes(themes: MockTheme[]) {
	mockAll.value = themes;
}

function mockBuiltin(id: string, css: string): MockTheme {
	return {
		id,
		name: id,
		source: "builtin",
		colors: { bg: "#000", text: "#fff", accent: "#f00" },
		load: () => Promise.resolve({ ok: true, css }),
	};
}

function mockUser(id: string, css: string, revision: number, load?: MockTheme["load"]): MockTheme {
	return {
		id,
		name: id,
		source: "user",
		revision,
		colors: { bg: "#000", text: "#fff", accent: "#f00" },
		load: load ?? (() => Promise.resolve({ ok: true, css })),
	};
}

function mockRejected(id: string): MockTheme {
	return {
		id,
		name: id,
		source: "user",
		revision: 1,
		colors: { bg: "#000", text: "#fff", accent: "#f00" },
		load: () => Promise.resolve({ ok: false, issue: { kind: "too-large" } }),
	};
}

/** Read the style element's CSS out of the component's shadow root. */
function shadowStyleText(host: HTMLElement): string | null {
	const preview = host.querySelector(".theme-preview-host");
	const shadow = preview?.shadowRoot;
	const style = shadow?.querySelector("style");
	return style?.textContent ?? null;
}

let host: HTMLDivElement;
let instance: Record<string, unknown> | undefined;

beforeEach(() => {
	host = document.createElement("div");
	document.body.appendChild(host);
});

afterEach(() => {
	if (instance) {
		unmount(instance);
		instance = undefined;
	}
	host.remove();
});

describe("ThemePreview", () => {
	// THE regression this whole suite exists to pin: SanitizeResult's shape
	// changed what meta.load() resolves to, and `baseCss + "\n" + themeCss`
	// string concatenation against an OBJECT type-checks (TS allows `string +
	// object`, coercing via toString()) — so this was invisible to `pnpm
	// check` and there was no test file at all to catch it at runtime. This is
	// the single assertion the coordinator asked to have pinned.
	it("never renders the literal string '[object Object]' into the injected CSS", async () => {
		setThemes([mockBuiltin("pin-test-theme", ".app { --md-bg: #111; }")]);
		instance = mount(ThemePreview, { target: host, props: { themeId: "pin-test-theme" } });
		await vi.waitFor(() => expect(shadowStyleText(host)).toContain("--md-bg"));

		expect(shadowStyleText(host)).not.toContain("[object Object]");
	});

	it("injects the resolved theme's actual CSS rules", async () => {
		setThemes([mockBuiltin("rules-test-theme", ".app { --md-accent: #ff00ff; }")]);
		instance = mount(ThemePreview, { target: host, props: { themeId: "rules-test-theme" } });
		await vi.waitFor(() => expect(shadowStyleText(host)).toContain("#ff00ff"));
	});

	// Resolving against the live merged list (not a static builtin-only import)
	// is what makes a user theme id resolvable at all — see the comment on the
	// $effect in ThemePreview.svelte.
	it("resolves a user-sourced theme id from the live list", async () => {
		setThemes([mockUser("my-user-theme", ".app { --md-bg: #abc123; }", 1)]);
		instance = mount(ThemePreview, { target: host, props: { themeId: "my-user-theme" } });
		await vi.waitFor(() => expect(shadowStyleText(host)).toContain("#abc123"));
	});

	// Regression: the old code looked up a STATIC registry import and, on a
	// miss, simply `return`ed — leaving whatever the previous themeId's CSS
	// was still sitting in the style element. An unknown id must show nothing,
	// not stale content from whatever was active before.
	it("clears the style element for an unknown theme id rather than leaving stale CSS", async () => {
		let themeId = $state("known-then-unknown");
		setThemes([mockBuiltin("known-then-unknown", ".app { --md-bg: #111; }")]);
		instance = mount(ThemePreview, {
			target: host,
			props: {
				get themeId() {
					return themeId;
				},
			},
		});
		await vi.waitFor(() => expect(shadowStyleText(host)).toContain("#111"));

		themeId = "totally-unknown-id";
		flushSync();
		expect(shadowStyleText(host)).toBe("");
	});

	// A rejected theme must render as BLANK, never as the previous theme's
	// leftover CSS (which would look like the rejected theme quietly
	// succeeded) and never as string-concatenated garbage.
	it("clears the style element when load() reports !ok, rather than concatenating the failure", async () => {
		let themeId = $state("known-then-rejected");
		setThemes([
			mockBuiltin("known-then-rejected", ".app { --md-bg: #111; }"),
			mockRejected("rejected-theme"),
		]);
		instance = mount(ThemePreview, {
			target: host,
			props: {
				get themeId() {
					return themeId;
				},
			},
		});
		await vi.waitFor(() => expect(shadowStyleText(host)).toContain("#111"));

		themeId = "rejected-theme";
		flushSync();
		await vi.waitFor(() => expect(shadowStyleText(host)).toBe(""));
		expect(shadowStyleText(host)).not.toContain("[object Object]");
	});

	describe("cache keying", () => {
		it("keys the cache by id@revision, so a re-imported theme at a new revision refetches", async () => {
			const loadV1 = vi.fn().mockResolvedValue({ ok: true, css: ".app { --md-bg: #v1; }" });
			setThemes([mockUser("editable-theme", "", 1, loadV1)]);

			instance = mount(ThemePreview, { target: host, props: { themeId: "editable-theme" } });
			await vi.waitFor(() => expect(shadowStyleText(host)).toContain("#v1"));
			expect(loadV1).toHaveBeenCalledTimes(1);

			// Bump the revision (simulating a re-import after editing the file on
			// disk) for the SAME id — must be treated as a cache MISS, not reuse
			// the v1 entry. Re-mount to force ThemePreview's effect to re-read
			// `themeState.all`, since the component only reacts to its own
			// `themeId` prop, not to the mocked module's contents changing —
			// `themeState.all` isn't a reactive dependency the way the real
			// `$derived` registry is, only the mock's plain array here.
			unmount(instance);
			const loadV2 = vi.fn().mockResolvedValue({ ok: true, css: ".app { --md-bg: #v2; }" });
			setThemes([mockUser("editable-theme", "", 2, loadV2)]);
			instance = mount(ThemePreview, { target: host, props: { themeId: "editable-theme" } });
			await vi.waitFor(() => expect(shadowStyleText(host)).toContain("#v2"));
			expect(loadV2).toHaveBeenCalledTimes(1);
		});

		it("does not cache a rejected load, so a later attempt for the same id retries", async () => {
			let attempt = 0;
			const load = vi.fn(() => {
				attempt += 1;
				return attempt === 1
					? Promise.resolve({ ok: false as const, issue: { kind: "too-large" } })
					: Promise.resolve({ ok: true as const, css: ".app { --md-bg: #recovered; }" });
			});
			setThemes([mockUser("flaky-theme", "", 1, load)]);

			instance = mount(ThemePreview, { target: host, props: { themeId: "flaky-theme" } });
			await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(1));
			expect(shadowStyleText(host)).toBe("");

			// Re-mount for the same id — a cached failure would mean load() is
			// never called again for "flaky-theme@1".
			unmount(instance);
			instance = mount(ThemePreview, { target: host, props: { themeId: "flaky-theme" } });
			await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(2));
			expect(shadowStyleText(host)).toContain("#recovered");
		});

		// The reachable half of the `.has()` vs truthy distinction: a SUCCESSFUL
		// load for a given id@revision must not be re-fetched on a later
		// lookup. (The other half — a cached entry that is itself the empty
		// string — is not reachable through this component today, since
		// `combined` is always prefixed with real base CSS; see the comment in
		// ThemePreview.svelte. `.has()` is still correct because a cache
		// implementation should not depend on its stored values happening to
		// be truthy.)
		it("does not call load() again for an id@revision that already resolved successfully", async () => {
			const load = vi.fn().mockResolvedValue({ ok: true, css: ".app { --md-bg: #cached; }" });
			setThemes([mockUser("stable-theme", "", 1, load)]);

			instance = mount(ThemePreview, { target: host, props: { themeId: "stable-theme" } });
			await vi.waitFor(() => expect(shadowStyleText(host)).toContain("#cached"));
			expect(load).toHaveBeenCalledTimes(1);

			// Re-mount for the SAME id and revision — the module-level cssCache
			// is shared across instances, so this should be served from cache.
			unmount(instance);
			instance = mount(ThemePreview, { target: host, props: { themeId: "stable-theme" } });
			await vi.waitFor(() => expect(shadowStyleText(host)).toContain("#cached"));
			expect(load).toHaveBeenCalledTimes(1);
		});
	});

	/**
	 * JSDOM CAPABILITY NOTE, read before extending this suite:
	 *
	 * jsdom's `attachShadow` DOES create a real functioning ShadowRoot with a
	 * real `shadowRoot` property and real child nodes (verified directly
	 * against this repo's jsdom install — every test above reads through
	 * `shadowRoot.querySelector('style')` successfully) — enough to assert
	 * exactly what this suite asserts: which CSS TEXT lands in the shadow
	 * `<style>` element, and when.
	 *
	 * What it CANNOT do — and what NOTHING in this file claims to cover — is
	 * prove that Shadow DOM encapsulation actually isolates the preview's CSS
	 * from the outer document's cascade, or that `@scope`/`@layer` inside the
	 * injected theme CSS resolve correctly once parsed. jsdom does not
	 * implement CSSOM cascade resolution at all (`getComputedStyle` reports
	 * close to the literal declaration, not resolved cascade output — see the
	 * repo-wide note in `base.css` and `sanitize-theme-css.test.ts`'s own
	 * capability section). That property is NOT tested here. It is proven by
	 * `pnpm test:sanitizer` (scripts/sanitizer-attack.mjs), which drives real
	 * Chromium/WebKit via Playwright and asserts the sanitized CSS cannot
	 * escape its `@scope` boundary in a real cascade.
	 */
	it("jsdom capability note (see block comment above) — no assertion, documentation only", () => {
		expect(true).toBe(true);
	});
});
