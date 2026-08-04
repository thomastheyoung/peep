import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
	appRuleBody,
	declaration,
	toSolidColor,
	channel,
	parseThemeCss,
	assertParsed,
	slugifyThemeId,
	resolveThemeId,
} from "./parse-theme-css";
import { themeColors } from "./theme-colors";
import { themeMeta } from "./theme-meta";

// ---------------------------------------------------------------------------
// toSolidColor — the real cases the header comment names by theme. A
// regression here would misrepresent an actual shipped theme's swatch, not
// just fail an abstract test.
// ---------------------------------------------------------------------------

describe("toSolidColor", () => {
	it("returns a plain solid color unchanged", () => {
		expect(toSolidColor("#0d1117")).toBe("#0d1117");
	});

	it("returns null for a null input", () => {
		expect(toSolidColor(null)).toBeNull();
	});

	it("takes the LAST layer (#fffff8 paper) over the repeating-linear-gradient rule lines on top (formerly the handwritten gallery theme)", () => {
		const value =
			"repeating-linear-gradient(to bottom, transparent 0px, transparent 31px, #e8e0d4 31px, #e8e0d4 32px), #fffff8";
		expect(toSolidColor(value)).toBe("#fffff8");
	});

	it("skips near-transparent rgba() scanline stops, alpha < 0.5 (formerly the vaporwave gallery theme)", () => {
		const value =
			"repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.03) 0px, rgba(255, 255, 255, 0.03) 1px, transparent 1px, transparent 40px), " +
			"repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.03) 0px, rgba(255, 255, 255, 0.03) 1px, transparent 1px, transparent 40px), " +
			"linear-gradient(to bottom, #2d1b69, #1a0033)";
		// Last layer is itself a gradient; its first (visible) stop wins.
		expect(toSolidColor(value)).toBe("#2d1b69");
	});

	it("last layer is a gradient, so its first stop represents the theme (formerly the glassmorphism gallery theme)", () => {
		const value = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
		expect(toSolidColor(value)).toBe("#667eea");
	});

	it("last layer is a gradient, so its first stop represents the theme (formerly the tropical-sunset gallery theme)", () => {
		const value = "linear-gradient(180deg, #fff7ed 0%, #fff1e6 100%)";
		expect(toSolidColor(value)).toBe("#fff7ed");
	});

	it("falls through to an earlier layer when the last layer has no usable color", () => {
		const value = "linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.2)), #336699";
		expect(toSolidColor(value)).toBe("#336699");
	});

	it("returns null when no layer has a usable (visible) color", () => {
		const value = "linear-gradient(rgba(255,255,255,0.03), rgba(255,255,255,0.04))";
		expect(toSolidColor(value)).toBeNull();
	});
});

describe("appRuleBody", () => {
	it("extracts the body of the first .app rule", () => {
		const css = "@layer theme {\n.app {\nbackground: #fff;\ncolor: #000;\n}\n}";
		expect(appRuleBody(css)).toContain("background: #fff");
	});

	it("returns an empty string when there is no .app rule", () => {
		expect(appRuleBody(".markdown-body { color: red; }")).toBe("");
	});
});

describe("declaration", () => {
	it("reads a legacy property", () => {
		const body = "background: #123456; color: #abcdef;";
		expect(declaration(body, "background")).toBe("#123456");
	});

	it("reads a custom property", () => {
		const body = "--md-accent: #ff0000; color: #000;";
		expect(declaration(body, "--md-accent")).toBe("#ff0000");
	});

	it("returns null when the property is absent", () => {
		expect(declaration("color: #000;", "background")).toBeNull();
	});
});

describe("channel", () => {
	it("prefers the token over the legacy property", () => {
		const body = "--md-bg: #111111; background: #222222;";
		expect(channel(body, "--md-bg", "background")).toBe("#111111");
	});

	it("falls back to the legacy property when the token is absent", () => {
		const body = "background: #222222;";
		expect(channel(body, "--md-bg", "background")).toBe("#222222");
	});

	it("returns null when neither is present and there is no legacy fallback", () => {
		expect(channel("color: #000;", "--md-accent", null)).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// parseThemeCss / assertParsed — frontmatter present/absent/partial/malformed,
// multiple blocks, and beyond the 4KB scan window.
// ---------------------------------------------------------------------------

const VALID_APP_RULE = `
@layer theme {
	.app {
		background: #101010;
		color: #efefef;
		--md-accent: #ff8800;
	}
}
`;

function withFrontmatter(block: string, rest = VALID_APP_RULE): string {
	return `/*!${block}*/\n${rest}`;
}

describe("parseThemeCss", () => {
	it("parses a well-formed theme (frontmatter present, swatch resolvable)", () => {
		const css = withFrontmatter(" @name Test Theme\n@description A theme for testing.\n@author peep ");
		const result = parseThemeCss(css);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.frontmatter).toEqual({ name: "Test Theme", description: "A theme for testing.", author: "peep" });
		expect(result.swatch).toEqual({ bg: "#101010", text: "#efefef", accent: "#ff8800" });
	});

	it("reports missing-frontmatter when there is no /*! block at all", () => {
		const result = parseThemeCss(VALID_APP_RULE);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.issues).toContainEqual({ kind: "missing-frontmatter" });
	});

	it("reports partial-frontmatter when a field is missing", () => {
		const css = withFrontmatter(" @name Only A Name\n@author peep ");
		const result = parseThemeCss(css);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.issues).toContainEqual({ kind: "partial-frontmatter", missing: ["description"] });
	});

	it("reports partial-frontmatter (as missing everything) for a malformed block with no recognized fields", () => {
		const css = withFrontmatter(" this is not frontmatter at all, just prose ");
		const result = parseThemeCss(css);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.issues).toContainEqual({
			kind: "partial-frontmatter",
			missing: ["name", "description", "author"],
		});
	});

	it("uses only the FIRST /*! ... *\/ block when multiple are present", () => {
		const block1 = " @name First\n@description First block.\n@author peep ";
		const block2 = " @name Second\n@description Second block.\n@author someone-else ";
		const css = `/*!${block1}*/\n/*!${block2}*/\n${VALID_APP_RULE}`;
		const result = parseThemeCss(css);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.frontmatter.name).toBe("First");
	});

	it("ignores a /*! block that starts beyond the first 4KB", () => {
		const padding = "/* padding */\n".repeat(400); // well past 4096 bytes
		const block = " @name Too Late\n@description Should not be found.\n@author peep ";
		const css = `${padding}/*!${block}*/\n${VALID_APP_RULE}`;
		expect(padding.length).toBeGreaterThan(4096);
		const result = parseThemeCss(css);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.issues).toContainEqual({ kind: "missing-frontmatter" });
	});

	it("reports no-app-rule when there is no .app rule", () => {
		const css = withFrontmatter(" @name X\n@description Y\n@author peep ", "");
		const result = parseThemeCss(css);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.issues).toContainEqual({ kind: "no-app-rule" });
	});

	it("reports unresolved-channel when the .app rule has no usable accent", () => {
		const rest = `
@layer theme {
	.app {
		background: #101010;
		color: #efefef;
	}
}
`;
		const css = withFrontmatter(" @name X\n@description Y\n@author peep ", rest);
		const result = parseThemeCss(css);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.issues).toContainEqual({ kind: "unresolved-channel", channel: "accent" });
	});

	it("sanitizes frontmatter fields: strips control characters and caps length", () => {
		const longName = "x".repeat(100);
		const css = withFrontmatter(` @name ${longName}\n@description ok\n@author peep `);
		const result = parseThemeCss(css);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.frontmatter.name).toHaveLength(64);
		expect(result.frontmatter.author).toBe("peep");
	});

	it("never throws, even on completely empty input", () => {
		expect(() => parseThemeCss("")).not.toThrow();
		expect(parseThemeCss("").ok).toBe(false);
	});
});

describe("assertParsed", () => {
	it("returns the parsed theme on success", () => {
		const css = withFrontmatter(" @name Test Theme\n@description A theme for testing.\n@author peep ");
		expect(assertParsed(css, "test.css")).toEqual({
			frontmatter: { name: "Test Theme", description: "A theme for testing.", author: "peep" },
			swatch: { bg: "#101010", text: "#efefef", accent: "#ff8800" },
		});
	});

	it("throws, including the filename, when parsing fails", () => {
		expect(() => assertParsed(VALID_APP_RULE, "broken-theme.css")).toThrow(/broken-theme\.css/);
	});
});

// ---------------------------------------------------------------------------
// slugifyThemeId
// ---------------------------------------------------------------------------

describe("slugifyThemeId", () => {
	it("lowercases", () => {
		expect(slugifyThemeId("MyTheme")).toBe("mytheme");
	});

	it("collapses spaces into a single dash", () => {
		expect(slugifyThemeId("My Cool Theme")).toBe("my-cool-theme");
	});

	it("collapses runs of non-alphanumeric characters (including colons) into a single dash", () => {
		expect(slugifyThemeId("weird:::name!!!here")).toBe("weird-name-here");
	});

	it("never emits a colon", () => {
		expect(slugifyThemeId("a:b:c")).not.toContain(":");
	});

	it("strips unicode characters that fall outside [a-z0-9]", () => {
		expect(slugifyThemeId("Caf\u00e9 Th\u00e8me")).toBe("caf-th-me");
	});

	it("trims leading and trailing dashes", () => {
		expect(slugifyThemeId("---leading-and-trailing---")).toBe("leading-and-trailing");
	});

	it("returns 'theme' rather than an empty string for input with no alphanumerics", () => {
		expect(slugifyThemeId("___")).toBe("theme");
	});

	it("returns 'theme' for a genuinely empty string", () => {
		expect(slugifyThemeId("")).toBe("theme");
	});

	it("caps length at 64 characters", () => {
		const long = "a".repeat(200);
		const slug = slugifyThemeId(long);
		expect(slug.length).toBeLessThanOrEqual(64);
	});

	it("never leaves a trailing dash after the length cap truncates mid-run", () => {
		// 64 a's followed by a run of separators that would land right at the cut.
		const raw = "a".repeat(64) + "   " + "b".repeat(10);
		const slug = slugifyThemeId(raw);
		expect(slug.endsWith("-")).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// resolveThemeId
// ---------------------------------------------------------------------------

describe("resolveThemeId", () => {
	it("returns the candidate unchanged when not taken", () => {
		expect(resolveThemeId("my-theme", new Set())).toBe("my-theme");
	});

	it("suffixes -2 on a single collision", () => {
		expect(resolveThemeId("my-theme", new Set(["my-theme"]))).toBe("my-theme-2");
	});

	it("walks the chain: -2 also taken resolves to -3", () => {
		const taken = new Set(["my-theme", "my-theme-2"]);
		expect(resolveThemeId("my-theme", taken)).toBe("my-theme-3");
	});

	it("walks a longer chain", () => {
		const taken = new Set(["x", "x-2", "x-3", "x-4"]);
		expect(resolveThemeId("x", taken)).toBe("x-5");
	});

	it("collides against a pre-existing -2 id directly", () => {
		// Two different source names could both slugify toward "theme-2":
		// the raw candidate "theme-2" is itself already taken.
		const taken = new Set(["theme-2"]);
		expect(resolveThemeId("theme-2", taken)).toBe("theme-2-2");
	});
});

// ---------------------------------------------------------------------------
// Regression: frontmatter tags must be anchored to their own line.
//
// Unanchored, each field regex scanned the whole block and took its first hit
// anywhere — including inside another field's VALUE — and still reported
// ok:true, so the wrong value looked completely valid to both callers.
// ---------------------------------------------------------------------------

describe("frontmatter tag anchoring", () => {
	const wrap = (body: string) => `/*!${body}*/\n.app { --md-bg: #fff; --md-text: #000; --md-accent: #f00; }`;

	it("does not read @name out of the middle of a @description", () => {
		const css = wrap(" @description Uses @name Foo internally\n@name Real\n@author peep ");
		const r = parseThemeCss(css);
		expect(r.ok).toBe(true);
		if (r.ok) expect(r.frontmatter.name).toBe("Real");
	});

	it("does not read @author out of the middle of a @description", () => {
		const css = wrap(" @name X\n@description credit @author nobody\n@author peep ");
		const r = parseThemeCss(css);
		expect(r.ok).toBe(true);
		if (r.ok) expect(r.frontmatter.author).toBe("peep");
	});

	it("accepts the `*`-prefixed comment style", () => {
		const css = wrap("\n * @name Starred\n * @description With leading stars.\n * @author peep\n ");
		const r = parseThemeCss(css);
		expect(r.ok).toBe(true);
		if (r.ok) expect(r.frontmatter.name).toBe("Starred");
	});

	it("does not let the tag separator swallow a newline", () => {
		// `@name` with nothing after it on its own line must NOT pull the next
		// line's text up as the value.
		const css = wrap(" @name\nNot the name\n@description d\n@author a ");
		const r = parseThemeCss(css);
		expect(r.ok).toBe(false);
	});
});

describe("frontmatter scan window", () => {
	const tail = "\n.app { --md-bg: #fff; --md-text: #000; --md-accent: #f00; }";

	it("reads a block that starts inside the window but ends outside it", () => {
		// The window bounds where a block may START. Slicing the source first
		// would cut this block in half and silently report it absent.
		const pad = " ".repeat(4000);
		const long = "x".repeat(500);
		const css = `${pad}/*! @name Late\n@description ${long}\n@author peep */${tail}`;
		const r = parseThemeCss(css);
		expect(r.ok).toBe(true);
		if (r.ok) expect(r.frontmatter.name).toBe("Late");
	});

	it("ignores a block starting beyond the window", () => {
		const css = `${" ".repeat(5000)}/*! @name TooLate\n@description d\n@author peep */${tail}`;
		const r = parseThemeCss(css);
		expect(r.ok).toBe(false);
	});
});

describe("sanitizeField control characters", () => {
	it("strips control characters from a value", () => {
		const css = `/*! @name A\x00B\x07C\n@description d\n@author peep */\n.app { --md-bg: #fff; --md-text: #000; --md-accent: #f00; }`;
		const r = parseThemeCss(css);
		expect(r.ok).toBe(true);
		if (r.ok) expect(r.frontmatter.name).toBe("ABC");
	});
});

describe("declaration matching", () => {
	it("does not match a property that merely ends with the target name", () => {
		// The `(?:^|;)` anchor is what stops `background` matching inside
		// `-webkit-background`. Without it the wrong value is read.
		const body = "-webkit-background: #111; background: #222;";
		expect(declaration(body, "background")).toBe("#222");
	});

	it("is case-insensitive", () => {
		expect(declaration("BACKGROUND: #abc;", "background")).toBe("#abc");
	});
});

// ---------------------------------------------------------------------------
// The real shipped theme files.
//
// Every other case in this file is a hand-written literal, which means they
// can all pass while the actual CSS on disk drifts away from them. These read
// the real files through Vite's `?raw` loader and assert the parser agrees
// with the committed generated output — making `theme-colors.ts` and
// `theme-meta.ts` self-verifying rather than trusted.
// ---------------------------------------------------------------------------

// Read from disk with `node:fs`, NOT `import.meta.glob(..., "?raw")`. This
// repo's vitest.config.ts sets `css: false`, which stubs CSS modules out — a
// `?raw` glob there resolves all 22 files to the EMPTY STRING, so the whole
// suite would assert nothing while appearing to pass. Reading the filesystem
// directly also matches the intent: this is the one place that must see what
// is genuinely committed, not what the bundler produces.
// Resolved from the process cwd (the project root under Vitest) rather than
// `import.meta.url`, which is not a `file:` URL once Vite has transformed the
// module.
const THEMES_DIR = join(process.cwd(), "src/lib/themes/themes");

describe("real theme files", () => {
	const entries = readdirSync(THEMES_DIR)
		.filter((f) => f.endsWith(".css"))
		.sort()
		.map((f) => [f.replace(/\.css$/, ""), readFileSync(join(THEMES_DIR, f), "utf8")] as const);

	it("finds every shipped theme", () => {
		expect(entries.length).toBeGreaterThan(0);
		expect(entries.length).toBe(Object.keys(themeColors).length);
	});

	it.each(entries)("%s parses without issues", (_id, css) => {
		const r = parseThemeCss(css);
		if (!r.ok) throw new Error(`issues: ${JSON.stringify(r.issues)}`);
		expect(r.ok).toBe(true);
	});

	it.each(entries)("%s swatch matches the generated theme-colors.ts", (id, css) => {
		const r = parseThemeCss(css);
		expect(r.ok).toBe(true);
		if (r.ok) expect(r.swatch).toEqual(themeColors[id as keyof typeof themeColors]);
	});

	it.each(entries)("%s name matches the generated theme-meta.ts", (id, css) => {
		const r = parseThemeCss(css);
		expect(r.ok).toBe(true);
		if (r.ok) expect(r.frontmatter.name).toBe(themeMeta[id as keyof typeof themeMeta].name);
	});
});
