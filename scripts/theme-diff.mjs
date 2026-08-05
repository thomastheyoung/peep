/**
 * Real-Chromium theme regression harness.
 *
 * WHY THIS EXISTS AND WHY IT IS NOT A VITEST TEST
 * -----------------------------------------------
 * jsdom (this repo's vitest environment) supports neither CSS `@layer` nor
 * `var()`. `getComputedStyle` there returns roughly what was literally declared
 * on a matching simple selector, so an assertion about a theme's resolved color
 * is testing jsdom's limitations, not the cascade — it passes or fails for the
 * wrong reason. `base.css` is built entirely on `@layer base, tokens, theme`
 * plus `var(--md-*, fallback)`, so jsdom can say nothing useful about it.
 *
 * Playwright is already a devDependency (via Storybook), so a real Chromium can
 * resolve the actual cascade. Diffing the resolved values against `git show
 * <ref>:<file>` makes this a before/after REGRESSION DETECTOR rather than a
 * snapshot someone has to bless.
 *
 * Usage:
 *   pnpm diff:themes                              # diff working tree against HEAD
 *   node scripts/theme-diff.mjs                   # diff working tree against HEAD
 *   node scripts/theme-diff.mjs --ref HEAD~1      # against another ref
 *   node scripts/theme-diff.mjs --only github-dark,swiss-design
 *   node scripts/theme-diff.mjs --capture out.json   # record only, no diff
 *   node scripts/theme-diff.mjs --dir themes      # diff a different theme directory
 *
 * Exit codes: 0 = no changes, 1 = changes found, 2 = the run itself was invalid
 * (bad ref, unknown theme id, empty comparison set). The distinction matters:
 * this harness is used as proof that a refactor changed nothing, so a run that
 * compared nothing must never look like a run that found nothing.
 */

import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_THEMES_REL = "src/lib/themes/themes";
const BASE_CSS = "src/lib/themes/base.css";

// The properties worth diffing. Deliberately not "every computed property":
// Chromium reports ~340 of them, most of which are UA defaults that add noise
// without carrying theme intent. These are the ones the token vocabulary in
// base.css actually claims to control, plus the structural ones the CLAUDE.md
// notes call out as having been broken by tokenization before (`hr` drawn two
// ways, `pre` border-radius, `pre` font-family).
const PROPS = [
	"color",
	"background-color",
	"background-image",
	"font-family",
	"font-size",
	"font-weight",
	"line-height",
	"letter-spacing",
	"border-top-color",
	"border-top-width",
	"border-top-style",
	"border-bottom-color",
	"border-bottom-width",
	"border-left-color",
	"border-left-width",
	"border-radius",
	"box-shadow",
	"padding",
	"margin",
	"text-decoration-color",
	"opacity",
];

// One representative node per element the themes style. `.app` and
// `.markdown-body` come first because they carry the token declarations that
// everything else inherits from.
const PROBES = [
	[".app", "app"],
	[".markdown-body", "body"],
	[".markdown-body h1", "h1"],
	[".markdown-body h2", "h2"],
	[".markdown-body h3", "h3"],
	[".markdown-body p", "p"],
	[".markdown-body a", "a"],
	[".markdown-body strong", "strong"],
	[".markdown-body em", "em"],
	[".markdown-body blockquote", "blockquote"],
	[".markdown-body hr", "hr"],
	[".markdown-body pre", "pre"],
	[".markdown-body pre code", "precode"],
	[".markdown-body p code", "inlinecode"],
	[".markdown-body ul", "ul"],
	[".markdown-body li", "li"],
	[".markdown-body table", "table"],
	[".markdown-body th", "th"],
	[".markdown-body td", "td"],
	[".markdown-body img", "img"],
];

const FIXTURE = `<div class="app"><div class="markdown-body">
<h1>Heading one</h1><h2>Heading two</h2><h3>Heading three</h3>
<p>Body text with <a href="#">a link</a>, <strong>bold</strong>, <em>italic</em> and <code>inline code</code>.</p>
<blockquote><p>A quoted passage.</p></blockquote>
<hr>
<pre><code>const x = 1;</code></pre>
<ul><li>Item one</li><li>Item two</li></ul>
<table><thead><tr><th>Head</th></tr></thead><tbody><tr><td>Cell</td></tr></tbody></table>
<p><img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="i"></p>
</div></div>`;

function gitShow(ref, path) {
	try {
		// stderr is silenced because a miss is an expected, meaningful answer
		// ("absent at that ref"), not an error worth printing. The ref itself is
		// validated up front, so a genuinely broken ref cannot hide behind this.
		return execFileSync("git", ["show", `${ref}:${path}`], {
			cwd: REPO,
			encoding: "utf8",
			stdio: ["ignore", "pipe", "ignore"],
		});
	} catch {
		return null; // file did not exist at that ref
	}
}

/** Abort early on a ref that does not resolve. */
function assertRef(ref) {
	try {
		execFileSync("git", ["rev-parse", "--verify", `${ref}^{commit}`], {
			cwd: REPO,
			encoding: "utf8",
			stdio: ["ignore", "pipe", "ignore"],
		});
	} catch {
		console.error(`Not a valid git ref: ${ref}`);
		process.exit(2);
	}
}

/**
 * Theme ids from the working tree UNIONED with those at the ref.
 *
 * Reading only the working tree would make the `REMOVED` branch unreachable: a
 * deleted theme is absent from `readdirSync`, so it would never become a
 * candidate and the run would report "no changes" across a smaller set — a
 * silent pass in exactly the case this harness exists to catch. Deletion is the
 * headline event of a theme cull, so it must be enumerated from the ref side.
 */
function themeIds(ref) {
	const working = existsSync(THEMES_DIR)
		? readdirSync(THEMES_DIR).filter((f) => f.endsWith(".css"))
		: [];

	let atRef = [];
	try {
		atRef = execFileSync("git", ["ls-tree", "--name-only", ref, `${THEMES_REL}/`], {
			cwd: REPO,
			encoding: "utf8",
			stdio: ["ignore", "pipe", "ignore"],
		})
			.split("\n")
			.filter((p) => p.endsWith(".css"))
			.map((p) => p.slice(p.lastIndexOf("/") + 1));
	} catch {
		// Directory did not exist at the ref; the working tree is the whole story.
	}

	return [...new Set([...working, ...atRef].map((f) => f.replace(/\.css$/, "")))].sort();
}

/** Resolve every probe's computed style for one base+theme CSS pair. */
async function measure(page, baseCss, themeCss) {
	await page.setContent(
		`<!doctype html><html><head><style>${baseCss}</style><style>${themeCss}</style></head><body>${FIXTURE}</body></html>`,
		{ waitUntil: "load" },
	);
	return page.evaluate(
		({ probes, props }) => {
			const out = {};
			for (const [sel, key] of probes) {
				const el = document.querySelector(sel);
				if (!el) continue;
				const cs = getComputedStyle(el);
				const rec = {};
				for (const p of props) rec[p] = cs.getPropertyValue(p);
				out[key] = rec;
			}
			return out;
		},
		{ probes: PROBES, props: PROPS },
	);
}

function diff(before, after) {
	const changes = [];
	const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
	for (const k of keys) {
		const b = before?.[k];
		const a = after?.[k];
		if (!b) { changes.push({ probe: k, prop: "*", before: "(absent)", after: "(present)" }); continue; }
		if (!a) { changes.push({ probe: k, prop: "*", before: "(present)", after: "(absent)" }); continue; }
		for (const p of PROPS) {
			if (b[p] !== a[p]) changes.push({ probe: k, prop: p, before: b[p], after: a[p] });
		}
	}
	return changes;
}

const argv = process.argv.slice(2);
// A flag given as the last argument has no value after it. Returning the
// fallback there would silently run something other than what was asked —
// `--only` with no value would quietly diff every theme.
const arg = (name, fallback) => {
	const i = argv.indexOf(name);
	if (i < 0) return fallback;
	const value = argv[i + 1];
	if (value === undefined || value.startsWith("--")) {
		console.error(`${name} requires a value`);
		process.exit(2);
	}
	return value;
};
const ref = arg("--ref", "HEAD");
const only = arg("--only", null)
	?.split(",")
	.map((s) => s.trim())
	.filter(Boolean);
const capturePath = arg("--capture", null);
const dirArg = arg("--dir", DEFAULT_THEMES_REL);

// Must be repo-relative: `git show <ref>:<path>` and `git ls-tree <ref> <path>/`
// only resolve relative to the repo root. An absolute path or one containing
// `..` would not resolve at the ref side, which reads as "absent at ref" for
// every file — not a clean error, but a wall of false ADDED rows for a run
// that never actually compared anything.
if (dirArg.startsWith("/") || dirArg.split("/").includes("..")) {
	console.error(`--dir must be a repo-relative path with no "..": ${dirArg}`);
	process.exit(2);
}
const THEMES_REL = dirArg;
const THEMES_DIR = join(REPO, THEMES_REL);

assertRef(ref);

const themeRel = (id) => `${THEMES_REL}/${id}.css`;
const known = (id) => existsSync(join(THEMES_DIR, `${id}.css`)) || gitShow(ref, themeRel(id)) !== null;

// An id that resolves neither in the working tree nor at the ref is a typo.
// Dropping it silently would leave `ids` short — or empty — and still print the
// success banner below, which is the same false-green as an unenumerated
// deletion.
if (only) {
	const unknown = only.filter((id) => !known(id));
	if (unknown.length) {
		console.error(`Unknown theme id(s): ${unknown.join(", ")}`);
		process.exit(2);
	}
}

const ids = (only ?? themeIds(ref)).filter(known);

if (!ids.length) {
	console.error(`No themes to compare in ${THEMES_REL} — refusing to report success over an empty set.`);
	process.exit(2);
}

const browser = await chromium.launch();
const page = await browser.newPage();

const baseAfter = readFileSync(join(REPO, BASE_CSS), "utf8");
const baseBefore = gitShow(ref, BASE_CSS);

let totalChanges = 0;
const report = {};
const captured = {};

for (const id of ids) {
	const afterCss = existsSync(join(THEMES_DIR, `${id}.css`))
		? readFileSync(join(THEMES_DIR, `${id}.css`), "utf8")
		: null;
	const beforeCss = gitShow(ref, themeRel(id));

	// Capture records the working tree as it stands; there is nothing to record
	// for a theme that no longer exists, and nothing to diff either.
	if (afterCss === null && beforeCss !== null) {
		if (!capturePath) report[id] = "REMOVED (present at ref, absent now)";
		continue;
	}

	const after = await measure(page, baseAfter, afterCss);
	if (capturePath) {
		captured[id] = after;
		continue; // --capture records only; it never diffs.
	}

	if (beforeCss === null) {
		report[id] = "ADDED (absent at ref, present now)";
		continue;
	}

	const before = await measure(page, baseBefore ?? baseAfter, beforeCss);
	const changes = diff(before, after);
	totalChanges += changes.length;
	if (changes.length) report[id] = changes;
}

await browser.close();

if (capturePath) {
	try {
		writeFileSync(capturePath, JSON.stringify(captured, null, 2));
	} catch (err) {
		console.error(`Cannot write ${capturePath}: ${err.message}`);
		process.exit(2);
	}
	console.log(`Captured ${Object.keys(captured).length} themes to ${capturePath}`);
	process.exit(0); // Record only — reporting "no changes" here would be meaningless.
}

const changed = Object.keys(report);
if (!changed.length) {
	console.log(`✓ No computed-style changes across ${ids.length} themes in ${THEMES_REL} (vs ${ref})`);
	process.exit(0);
}

console.log(
	`\n${changed.length} of ${ids.length} themes in ${THEMES_REL} changed (vs ${ref}), ${totalChanges} property diffs:\n`,
);
for (const [id, changes] of Object.entries(report)) {
	if (typeof changes === "string") { console.log(`  ${id}: ${changes}`); continue; }
	console.log(`  ${id} (${changes.length}):`);
	for (const c of changes.slice(0, 12)) {
		console.log(`    ${c.probe}.${c.prop}\n      - ${c.before}\n      + ${c.after}`);
	}
	if (changes.length > 12) console.log(`    … and ${changes.length - 12} more`);
}
process.exit(1);
