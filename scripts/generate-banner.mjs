/**
 * README banner generator — renders the `peep` wordmark to committed SVGs.
 *
 * WHY THE GLYPHS ARE PATH DATA AND NOT `<text>`
 * ---------------------------------------------
 * GitHub serves README images from a sandboxed asset host and does not fetch
 * webfonts for them, so a `<text font-family="Space Grotesk">` banner renders
 * in whatever generic sans the viewer happens to have — which is not the
 * wordmark. Converting the four glyphs to outlines freezes the typography
 * into geometry, so every visitor sees identical type. The tagline stays as
 * `<text>` on purpose: it names a system monospace stack, degrades harmlessly
 * to any of them, and keeping it live text costs nothing.
 *
 * WHY THE OUTLINES ARE INLINED HERE RATHER THAN READ FROM THE .woff2
 * ------------------------------------------------------------------
 * Extracting them at build time needs a font parser (fontkit/opentype.js).
 * That is a permanent dependency for an asset whose inputs — four glyphs, one
 * weight of one font — change approximately never, so the outlines are baked
 * in below and this script stays dependency-free. To change the wordmark or
 * the font, re-extract with fontTools and replace `GLYPHS`/`INK`:
 *
 *   from fontTools.ttLib import TTFont
 *   from fontTools.pens.svgPathPen import SVGPathPen
 *   from fontTools.pens.boundsPen import BoundsPen
 *   f = TTFont("static/fonts/space-grotesk-latin-700-normal.woff2")
 *   gs, cmap, hmtx = f.getGlyphSet(), f.getBestCmap(), f["hmtx"]
 *   x = 0
 *   for ch in "peep":
 *       gn = cmap[ord(ch)]
 *       pen = SVGPathPen(gs); gs[gn].draw(pen)
 *       print(x, pen.getCommands())          # -> GLYPHS
 *       bp = BoundsPen(gs); gs[gn].draw(bp)  # union of these -> INK
 *       print(bp.bounds)
 *       x += hmtx[gn][0]
 *
 * WHY LAYOUT MEASURES INK AND NOT ADVANCE WIDTHS
 * ----------------------------------------------
 * "peep" is all-lowercase with two descenders and no ascenders or caps, so
 * its visual mass sits well below the em box. Centering on font metrics puts
 * the wordmark visibly low and runs the `p` tails into the tagline — both
 * were real, and both only showed up in a rendered screenshot. `INK` is the
 * union of the four glyph bounding boxes, so the block centers on the marks
 * actually painted.
 *
 * The gradient is sampled from the app icon (src-tauri/icons/icon.png), so
 * the banner and the dock icon stay the same product.
 *
 * Run: pnpm gen:banner
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "docs", "hero");

/** Space Grotesk Bold outlines for "peep", in font units at 1000 UPM. */
const UPM = 1000;
const GLYPHS = [
  { x: 0, d: "M70 -200V496H194V436H212Q229 465 265.0 487.5Q301 510 368 510Q428 510 479.0 480.5Q530 451 561.0 394.0Q592 337 592 256V240Q592 159 561.0 102.0Q530 45 479.0 15.5Q428 -14 368 -14Q323 -14 292.5 -3.5Q262 7 243.5 23.5Q225 40 214 57H196V-200ZM330 96Q389 96 427.5 133.5Q466 171 466 243V253Q466 325 427.0 362.5Q388 400 330 400Q272 400 233.0 362.5Q194 325 194 253V243Q194 171 233.0 133.5Q272 96 330 96Z" },
  { x: 638, d: "M296 -14Q222 -14 165.5 17.5Q109 49 77.5 106.5Q46 164 46 242V254Q46 332 77.0 389.5Q108 447 164.0 478.5Q220 510 294 510Q367 510 421.0 477.5Q475 445 505.0 387.5Q535 330 535 254V211H174Q176 160 212.0 128.0Q248 96 300 96Q353 96 378.0 119.0Q403 142 416 170L519 116Q505 90 478.5 59.5Q452 29 408.0 7.5Q364 -14 296 -14ZM175 305H407Q403 348 372.5 374.0Q342 400 293 400Q242 400 212.0 374.0Q182 348 175 305Z" },
  { x: 1215, d: "M296 -14Q222 -14 165.5 17.5Q109 49 77.5 106.5Q46 164 46 242V254Q46 332 77.0 389.5Q108 447 164.0 478.5Q220 510 294 510Q367 510 421.0 477.5Q475 445 505.0 387.5Q535 330 535 254V211H174Q176 160 212.0 128.0Q248 96 300 96Q353 96 378.0 119.0Q403 142 416 170L519 116Q505 90 478.5 59.5Q452 29 408.0 7.5Q364 -14 296 -14ZM175 305H407Q403 348 372.5 374.0Q342 400 293 400Q242 400 212.0 374.0Q182 348 175 305Z" },
  { x: 1792, d: "M70 -200V496H194V436H212Q229 465 265.0 487.5Q301 510 368 510Q428 510 479.0 480.5Q530 451 561.0 394.0Q592 337 592 256V240Q592 159 561.0 102.0Q530 45 479.0 15.5Q428 -14 368 -14Q323 -14 292.5 -3.5Q262 7 243.5 23.5Q225 40 214 57H196V-200ZM330 96Q389 96 427.5 133.5Q466 171 466 243V253Q466 325 427.0 362.5Q388 400 330 400Q272 400 233.0 362.5Q194 325 194 253V243Q194 171 233.0 133.5Q272 96 330 96Z" },
];

/** Union of the four glyph bounding boxes, in font units. */
const INK = { xMin: 70, xMax: 2384, yMin: -200, yMax: 510 };

/** Sampled from the app icon's gradient: purple -> magenta -> coral. */
const BRAND = ["#c34eb3", "#dc479a", "#e65667"];

const W = 760;
const H = 210;
const FONT_SIZE = 150;
const TAG_TEXT = "peep README.md";
const TAG_SIZE = 15;
const TAG_GAP = 30;

const scale = FONT_SIZE / UPM;
const inkW = (INK.xMax - INK.xMin) * scale;
const inkH = (INK.yMax - INK.yMin) * scale;

// Center the wordmark + tagline as one block, measured on ink.
const blockTop = (H - (inkH + TAG_GAP + TAG_SIZE)) / 2;
const baseline = blockTop + INK.yMax * scale;
const originX = (W - inkW) / 2 - INK.xMin * scale;
const tagY = blockTop + inkH + TAG_GAP + TAG_SIZE * 0.5;

const PALETTE = {
  dark: { top: "#1e2942", bottom: "#141c2e", rule: "#2a3350", tag: "#8b95ad" },
  light: { top: "#f7f4fa", bottom: "#ffffff", rule: "#e6e2ec", tag: "#6b7280" },
};

/** The y axis flips because font units grow upward and SVG units grow downward. */
function renderGlyphs() {
  return GLYPHS.map(({ x, d }) => {
    const tx = (originX + x * scale).toFixed(2);
    return `    <path transform="translate(${tx} ${baseline.toFixed(2)}) scale(${scale.toFixed(5)} -${scale.toFixed(5)})" d="${d}"/>`;
  }).join("\n");
}

function renderBanner(scheme) {
  const c = PALETTE[scheme];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="peep — a fast, themeable desktop markdown viewer">
  <defs>
    <linearGradient id="wordmark" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${BRAND[0]}"/>
      <stop offset="0.55" stop-color="${BRAND[1]}"/>
      <stop offset="1" stop-color="${BRAND[2]}"/>
    </linearGradient>
    <linearGradient id="backdrop" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${c.top}"/>
      <stop offset="1" stop-color="${c.bottom}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" rx="16" fill="url(#backdrop)"/>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="15.5" fill="none" stroke="${c.rule}"/>
  <g fill="url(#wordmark)">
${renderGlyphs()}
  </g>
  <text x="${W / 2}" y="${tagY.toFixed(1)}" text-anchor="middle" fill="${c.tag}"
        font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="${TAG_SIZE}" letter-spacing="1.6">${TAG_TEXT}</text>
</svg>
`;
}

mkdirSync(OUT, { recursive: true });
for (const scheme of ["dark", "light"]) {
  const file = join(OUT, `banner-${scheme}.svg`);
  writeFileSync(file, renderBanner(scheme));
  console.log(`wrote docs/hero/banner-${scheme}.svg`);
}
