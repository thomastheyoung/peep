/**
 * Theme screenshot generator — renders every theme to a committed PNG.
 *
 * WHY IT RENDERS THE REAL PIPELINE RATHER THAN A FIXTURE STRING
 * -------------------------------------------------------------
 * `theme-diff.mjs` next door screenshots nothing and can therefore get away
 * with a hand-written HTML fixture: it reads `getComputedStyle`, so an
 * unstyled `<pre><code>` still answers the question it asks. A screenshot
 * cannot. Code blocks are the most theme-differentiated region of a peep
 * document, and their colors come from shiki emitting `<span
 * style="color:var(--shiki-token-keyword)">` which each theme then defines —
 * see `markdown.ts`'s `createCssVariablesTheme`. A fixture containing literal
 * `<pre><code>const x = 1;</code></pre>` renders one flat foreground color in
 * all 22 themes, so the screenshots would agree precisely where the themes
 * differ most.
 *
 * So this bundles the app's own `renderMarkdown` with esbuild and runs it
 * INSIDE the page. That also brings KaTeX, footnotes, emoji, and the
 * `user-content-` heading ids along for free, and means a change to the
 * render pipeline shows up in the next regenerated screenshot instead of
 * silently diverging from a fixture nobody remembered to update.
 *
 * The bundle is built once and the markdown rendered once; only the <style>
 * element's text changes between themes. Shiki's grammars make that bundle
 * ~10MB, which is a few seconds of esbuild — paid once per run, not per theme.
 *
 * WHY AN HTTP SERVER AND NOT `page.setContent`
 * --------------------------------------------
 * `base.css` declares `@font-face { src: url('/fonts/…woff2') }` with
 * ROOT-ABSOLUTE paths, matching how the app serves them from `static/`. Under
 * `setContent` the page has no origin, those URLs resolve to nothing, and
 * every screenshot silently renders in a system fallback font — a wrong
 * picture that still looks plausible, which is the worst failure mode for an
 * artifact whose whole job is to show what a theme looks like. Serving the
 * repo over localhost lets the shipped CSS resolve unmodified, rather than
 * screenshotting a rewritten copy of it.
 *
 * Fonts must also be WAITED for. `font-display: swap` means the first paint
 * happens in the fallback face and reflows when the woff2 lands, so a
 * screenshot taken on `load` can catch the pre-swap frame. `document.fonts.ready`
 * is the actual condition; `waitUntil: "load"` is not.
 *
 * Usage:
 *   pnpm gen:theme-shots                       # all builtin + gallery themes
 *   node scripts/theme-shots.mjs --only vaporwave,newspaper
 *   node scripts/theme-shots.mjs --dir themes  # one theme directory only
 *   node scripts/theme-shots.mjs --width 900 --scale 2
 *   node scripts/theme-shots.mjs --crop       # fixed viewport instead of full document
 *   node scripts/theme-shots.mjs --out docs/shots
 *
 * Exit codes: 0 = wrote every requested screenshot, 2 = the run was invalid
 * (unknown theme id, empty set, unwritable output). Same rationale as
 * theme-diff.mjs: a run that rendered nothing must not look like a success.
 */

import { build } from "esbuild";
import { createServer } from "node:http";
import { readFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname, extname, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
const BUILTIN_REL = "src/lib/themes/themes";
const GALLERY_REL = "themes";
const BASE_CSS = join(REPO, "src/lib/themes/base.css");
const STATIC_DIR = join(REPO, "static");
const KATEX_DIST = join(REPO, "node_modules/katex/dist");
const SAMPLE_MD = join(REPO, "scripts/theme-shot-sample.md");

// ---------------------------------------------------------------- arguments

const argv = process.argv.slice(2);

/**
 * Same guard as theme-diff.mjs: a flag in final position has no value after
 * it, and silently falling back would run something other than what was asked
 * (`--only` with no value would render all 22 themes).
 */
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

const num = (name, fallback) => {
	const raw = arg(name, null);
	if (raw === null) return fallback;
	const n = Number(raw);
	if (!Number.isFinite(n) || n <= 0) {
		console.error(`${name} must be a positive number, got: ${raw}`);
		process.exit(2);
	}
	return n;
};

const only = arg("--only", null)?.split(",").map((s) => s.trim()).filter(Boolean);
const dirFilter = arg("--dir", null);
const outRel = arg("--out", "docs/theme-shots");
const width = num("--width", 860);
const height = num("--height", 620);
const scale = num("--scale", 2);
// Full document by default: a viewport crop silently cuts themes off
// mid-sentence, and it does so UNEVENLY — themes differ enormously in type
// size, so the same 620px crop reaches the footnote in minimal-mono and stops
// inside the first blockquote in newspaper. `--crop` opts back into a fixed
// viewport when uniform card dimensions matter more than completeness.
const fullPage = !argv.includes("--crop");

const OUT_DIR = join(REPO, outRel);

// ------------------------------------------------------------------- themes

/**
 * Both theme directories, unioned into one list. The builtin/gallery split is
 * a distribution detail (bundled vs. importable, see registry.ts) — for a
 * screenshot they are all just CSS, and keeping the source dir on each entry
 * is what lets `--dir` filter and what tells a caller where a name came from
 * if two directories ever hold the same id.
 */
function collectThemes() {
	const dirs = [BUILTIN_REL, GALLERY_REL].filter((d) => !dirFilter || d === dirFilter);
	if (dirFilter && !dirs.length) {
		console.error(`--dir must be one of: ${BUILTIN_REL}, ${GALLERY_REL} (got ${dirFilter})`);
		process.exit(2);
	}

	const found = [];
	for (const rel of dirs) {
		const abs = join(REPO, rel);
		if (!existsSync(abs)) continue;
		for (const file of readdirSync(abs).filter((f) => f.endsWith(".css")).sort()) {
			found.push({ id: file.replace(/\.css$/, ""), dir: rel, path: join(abs, file) });
		}
	}
	return found;
}

const all = collectThemes();

// A typo'd id must fail the run rather than shrink the set: rendering 21 of 22
// themes and printing a success line is the same false-green theme-diff.mjs
// guards against.
if (only) {
	const known = new Set(all.map((t) => t.id));
	const unknown = only.filter((id) => !known.has(id));
	if (unknown.length) {
		console.error(`Unknown theme id(s): ${unknown.join(", ")}`);
		console.error(`Known: ${[...known].sort().join(", ")}`);
		process.exit(2);
	}
}

const themes = only ? all.filter((t) => only.includes(t.id)) : all;

if (!themes.length) {
	console.error("No themes to screenshot — refusing to report success over an empty set.");
	process.exit(2);
}

// -------------------------------------------------------------- static host

const MIME = {
	".css": "text/css",
	".woff2": "font/woff2",
	".woff": "font/woff",
	".png": "image/png",
	".svg": "image/svg+xml",
	".html": "text/html",
};

/**
 * Serves `static/` so the root-absolute `/fonts/*.woff2` URLs in base.css
 * resolve exactly as they do in the app, plus KaTeX's dist under `/katex/`.
 *
 * KaTeX needs its own mount because `katex.min.css` references its fonts
 * RELATIVELY (`fonts/KaTeX_Main-Regular.woff2`), so they resolve against
 * wherever the stylesheet itself is served from — serving the CSS from `/`
 * would send Chromium looking for `/fonts/KaTeX_*` inside `static/`, where the
 * app's own fonts live and KaTeX's do not.
 *
 * Path traversal is rejected: this only ever runs locally against our own
 * fixtures, but a server that will happily read `../../` is not worth leaving
 * in a repo.
 */
function startServer() {
	const server = createServer((req, res) => {
		const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^(\.\.[/\\])+/, "");

		// Serve a real page at `/` so the navigation SUCCEEDS and the page keeps
		// an origin. Not incidental: a failed goto leaves Chromium on
		// `about:blank`, where every root-absolute URL — `/fonts/*.woff2`,
		// `/katex/katex.min.css` — resolves to nothing and silently renders in
		// fallback fonts. This previously worked only because a 404 still counts
		// as a successful navigation; relying on that is one stray redirect away
		// from a whole run of quietly wrong screenshots.
		if (path === "/") {
			res.writeHead(200, { "content-type": "text/html" });
			res.end("<!doctype html><title>peep theme shots</title>");
			return;
		}

		const katex = path.startsWith("/katex/");
		const root = katex ? KATEX_DIST : STATIC_DIR;
		const file = join(root, katex ? path.slice("/katex/".length) : path);
		if (!file.startsWith(root) || !existsSync(file) || !extname(file)) {
			res.writeHead(404).end();
			return;
		}
		res.writeHead(200, { "content-type": MIME[extname(file)] ?? "application/octet-stream" });
		res.end(readFileSync(file));
	});
	return new Promise((resolve) => {
		// Port 0 = let the OS pick a free one, so this never collides with the
		// Vite dev server on 1420 or with a second copy of this script.
		server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port }));
	});
}

// ----------------------------------------------------------------- pipeline

console.log(`Bundling renderMarkdown (shiki grammars make this the slow step)…`);
const bundled = await build({
	entryPoints: [join(REPO, "src/lib/markdown.ts")],
	bundle: true,
	format: "iife",
	globalName: "PeepMarkdown",
	platform: "browser",
	write: false,
	logLevel: "silent",
});
const markdownBundle = bundled.outputFiles[0].text;

const sampleMarkdown = readFileSync(SAMPLE_MD, "utf8");
const baseCss = readFileSync(BASE_CSS, "utf8");

try {
	mkdirSync(OUT_DIR, { recursive: true });
} catch (err) {
	console.error(`Cannot create ${outRel}: ${err.message}`);
	process.exit(2);
}

const { server, port } = await startServer();
const browser = await chromium.launch();
const page = await browser.newPage({
	viewport: { width, height },
	deviceScaleFactor: scale,
});

const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(e.message));

// A missing font or stylesheet does not throw — it renders something
// plausible in a fallback face, which is the failure mode this whole harness
// is most exposed to (it produced two wrong-font bugs during development).
// Treat any 4xx/5xx as fatal so a broken asset path can never be mistaken for
// a theme that simply looks like that.
const missing = [];
page.on("response", (r) => {
	if (r.status() >= 400) missing.push(`${r.status()} ${r.url()}`);
});

/**
 * What `+page.svelte` supplies and `base.css` does not.
 *
 * Same gap Storybook papers over in `.storybook/preview-head.html`, and it
 * bites harder here. `base.css:147` sets `font-family: var(--md-font-body,
 * inherit)` — the fallback is `inherit`, NOT a font stack — and the ancestor
 * it inherits from is `.app`, whose `font-family: var(--chrome-font)` lives in
 * the component-scoped `<style>` of `+page.svelte:397`. Mount `base.css`
 * alone and that chain dead-ends at Chromium's default serif, so every
 * token-only theme (github-dark, github-light) screenshots in Times instead of
 * Space Grotesk. Measured, not theorized: the first run of this script
 * produced exactly that.
 *
 * The padding is this harness's own framing, not the app's — the real app puts
 * the markdown under a titlebar and inside a width-constrained column, and a
 * screenshot with text jammed against the viewport edge misrepresents every
 * theme equally.
 *
 * IT MUST LOSE TO THEME CSS, hence `@layer base`. The obvious spelling — a
 * plain rule after the theme's <style> — sets `.app { font-family }` at the
 * same specificity as the themes' own `.app` rule and, being later, WINS.
 * `minimal-mono` and `retro-terminal` both declare their monospace face
 * exactly there, so an unlayered shim silently screenshots them in Space
 * Grotesk: the fix for one wrong font would have introduced another. base.css
 * declares `@layer base, tokens, theme, user`, and an unlayered declaration
 * beats every layered one, so joining `base` puts this at the bottom of the
 * order where a default belongs.
 */
const APP_SHIM = `
@layer base {
	*, *::before, *::after { box-sizing: border-box; }
	body {
		margin: 0;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
		text-rendering: optimizeLegibility;
	}
	/* min-height, not height: under full-page capture the document is taller
	   than the viewport, and an .app fixed at 100vh would end partway down,
	   leaving every gradient-on-.app theme (glassmorphism, cosmic-purple,
	   vaporwave) painting its backdrop across the top and bare white below. */
	.app { font-family: var(--chrome-font); min-height: 100vh; }
	.markdown-body { padding: 40px 44px; }
}`;

// `.app > .markdown-body` mirrors the app's real structure — themes target
// both, and several set the page background on `.app` only.
await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "domcontentloaded" }).catch(() => {});
await page.setContent(
	`<!doctype html><html><head>
<link rel="stylesheet" href="/katex/katex.min.css">
<style id="md-base">${baseCss}</style>
<style id="md-theme"></style>
<style id="md-shim">${APP_SHIM}</style>
</head><body><div class="app"><div class="markdown-body" id="content"></div></div></body></html>`,
	{ waitUntil: "domcontentloaded" },
);
await page.addScriptTag({ content: markdownBundle });

const rendered = await page.evaluate(async (md) => {
	const result = await PeepMarkdown.renderMarkdown(md);
	// `innerHTML` is the correct sink here and not a lapse: `renderMarkdown`
	// sanitizes at the producer (see sanitize-html.ts — the `SanitizedHtml`
	// brand exists so consumers can assign the value), and the input is a
	// repo-owned fixture rather than a user's file. Using textContent would
	// screenshot the markup as literal text.
	document.getElementById("content").innerHTML = String(result.html);
	return String(result.html).length;
}, sampleMarkdown);

if (pageErrors.length || missing.length) {
	if (pageErrors.length) console.error(`Render failed in-page:\n  ${pageErrors.join("\n  ")}`);
	if (missing.length) console.error(`Assets failed to load:\n  ${missing.join("\n  ")}`);
	await browser.close();
	server.close();
	process.exit(2);
}
console.log(`Rendered sample document (${rendered} bytes of HTML), screenshotting ${themes.length} themes…\n`);

const written = [];
for (const theme of themes) {
	const css = readFileSync(theme.path, "utf8");

	// Only the theme <style> changes between shots. The `user` layer is where
	// the app's sanitizer parks imported themes, but these are our own files
	// injected the way builtins are — unlayered, so raw theme CSS still wins
	// over base.css's `theme` layer exactly as it does at runtime.
	await page.evaluate((themeCss) => {
		document.getElementById("md-theme").textContent = themeCss;
	}, css);

	// Fonts first (font-display: swap would otherwise let a pre-swap frame be
	// captured), then one rAF so the swap-induced reflow has actually painted.
	await page.evaluate(() => document.fonts.ready);
	await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

	const out = join(OUT_DIR, `${theme.id}.png`);
	await page.screenshot({ path: out, animations: "disabled", fullPage });
	written.push(theme.id);
	console.log(`  ✓ ${theme.id}.png  (${theme.dir})`);
}

await browser.close();
server.close();

const geometry = fullPage ? `${width}px wide, full page` : `${width}×${height}`;
console.log(`\nWrote ${written.length} screenshots to ${outRel}/ at ${geometry} @${scale}x`);
