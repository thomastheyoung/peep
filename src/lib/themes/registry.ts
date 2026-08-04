import type { ThemeMeta } from "./types";
import { themeColors } from "./theme-colors";

/**
 * Theme definitions. Preview swatches are NOT authored here — they are read out
 * of each theme's own CSS by `scripts/extract-theme-colors.js` (run via
 * `pnpm gen:theme-colors`) and merged in below, so a swatch cannot disagree
 * with what the theme actually paints.
 *
 * Adding a theme: add the .css file, add an entry here, run the generator.
 * The generator throws if a theme's `.app` rule has no resolvable color, so a
 * missing palette fails the build rather than shipping a blank swatch.
 */
const definitions = [
	{
		id: "github-dark",
		name: "GitHub Dark",
		load: () => import("./themes/github-dark.css?raw").then((m) => m.default),
	},
	{
		id: "github-light",
		name: "GitHub Light",
		load: () =>
			import("./themes/github-light.css?raw").then((m) => m.default),
	},
	{
		id: "neo-brutalist",
		name: "Neo Brutalist",
		load: () =>
			import("./themes/neo-brutalist.css?raw").then((m) => m.default),
	},
	{
		id: "warm-paper",
		name: "Warm Paper",
		load: () => import("./themes/warm-paper.css?raw").then((m) => m.default),
	},
	{
		id: "retro-terminal",
		name: "Retro Terminal",
		load: () =>
			import("./themes/retro-terminal.css?raw").then((m) => m.default),
	},
	{
		id: "glassmorphism",
		name: "Glassmorphism",
		load: () =>
			import("./themes/glassmorphism.css?raw").then((m) => m.default),
	},
	{
		id: "neon-cyberpunk",
		name: "Neon Cyberpunk",
		load: () =>
			import("./themes/neon-cyberpunk.css?raw").then((m) => m.default),
	},
	{
		id: "pastel-dream",
		name: "Pastel Dream",
		load: () =>
			import("./themes/pastel-dream.css?raw").then((m) => m.default),
	},
	{
		id: "swiss-design",
		name: "Swiss Design",
		load: () =>
			import("./themes/swiss-design.css?raw").then((m) => m.default),
	},
	{
		id: "ink-brush",
		name: "Ink & Brush",
		load: () => import("./themes/ink-brush.css?raw").then((m) => m.default),
	},
	{
		id: "cosmic-purple",
		name: "Cosmic Purple",
		load: () =>
			import("./themes/cosmic-purple.css?raw").then((m) => m.default),
	},
	{
		id: "tropical-sunset",
		name: "Tropical Sunset",
		load: () =>
			import("./themes/tropical-sunset.css?raw").then((m) => m.default),
	},
	{
		id: "forest-earth",
		name: "Forest & Earth",
		load: () =>
			import("./themes/forest-earth.css?raw").then((m) => m.default),
	},
	{
		id: "art-deco",
		name: "Art Deco",
		load: () => import("./themes/art-deco.css?raw").then((m) => m.default),
	},
	{
		id: "candy-pop",
		name: "Candy Pop",
		load: () => import("./themes/candy-pop.css?raw").then((m) => m.default),
	},
	{
		id: "minimal-mono",
		name: "Minimal Mono",
		load: () =>
			import("./themes/minimal-mono.css?raw").then((m) => m.default),
	},
	{
		id: "newspaper",
		name: "Newspaper",
		load: () => import("./themes/newspaper.css?raw").then((m) => m.default),
	},
	{
		id: "vaporwave",
		name: "Vaporwave",
		load: () => import("./themes/vaporwave.css?raw").then((m) => m.default),
	},
	{
		id: "arctic-ice",
		name: "Arctic Ice",
		load: () =>
			import("./themes/arctic-ice.css?raw").then((m) => m.default),
	},
	{
		id: "sunset-desert",
		name: "Sunset Desert",
		load: () =>
			import("./themes/sunset-desert.css?raw").then((m) => m.default),
	},
	{
		id: "electric-blue",
		name: "Electric Blue",
		load: () =>
			import("./themes/electric-blue.css?raw").then((m) => m.default),
	},
	{
		id: "handwritten",
		name: "Handwritten",
		load: () =>
			import("./themes/handwritten.css?raw").then((m) => m.default),
	},
] as const satisfies readonly Omit<ThemeMeta, "colors">[];

/**
 * `ThemeId` is derived from `definitions` rather than from `themes` so it stays
 * a union of the 22 string literals. The `as const` above is what keeps each
 * `id` narrow; `satisfies` shape-checks without widening it back to `string`.
 */
export type ThemeId = (typeof definitions)[number]["id"];

/**
 * Indexing `themeColors` by `ThemeId` is the drift check: if a theme is added
 * here without regenerating, or the generated file loses an id, this fails to
 * compile rather than rendering an undefined swatch at runtime.
 */
export const themes: readonly ThemeMeta[] = definitions.map((def) => ({
	...def,
	colors: themeColors[def.id satisfies ThemeId],
}));
