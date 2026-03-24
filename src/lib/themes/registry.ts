import type { ThemeMeta } from "./types";

export const themes: ThemeMeta[] = [
	{
		id: "github-dark",
		name: "GitHub Dark",
		colors: { bg: "#0d1117", text: "#e6edf3", accent: "#58a6ff" },
		load: () => import("./themes/github-dark.css?raw").then((m) => m.default),
	},
	{
		id: "github-light",
		name: "GitHub Light",
		colors: { bg: "#ffffff", text: "#1f2328", accent: "#0969da" },
		load: () =>
			import("./themes/github-light.css?raw").then((m) => m.default),
	},
	{
		id: "neo-brutalist",
		name: "Neo Brutalist",
		colors: { bg: "#fffdf0", text: "#1a1a1a", accent: "#ff5722" },
		load: () =>
			import("./themes/neo-brutalist.css?raw").then((m) => m.default),
	},
	{
		id: "warm-paper",
		name: "Warm Paper",
		colors: { bg: "#fdf6ec", text: "#3d3229", accent: "#c0392b" },
		load: () => import("./themes/warm-paper.css?raw").then((m) => m.default),
	},
	{
		id: "retro-terminal",
		name: "Retro Terminal",
		colors: { bg: "#0a0a0a", text: "#00ff41", accent: "#00ff41" },
		load: () =>
			import("./themes/retro-terminal.css?raw").then((m) => m.default),
	},
	{
		id: "glassmorphism",
		name: "Glassmorphism",
		colors: { bg: "#667eea", text: "#f0f0f0", accent: "#a8d8ff" },
		load: () =>
			import("./themes/glassmorphism.css?raw").then((m) => m.default),
	},
	{
		id: "neon-cyberpunk",
		name: "Neon Cyberpunk",
		colors: { bg: "#0a0014", text: "#e0d4ff", accent: "#ff00ff" },
		load: () =>
			import("./themes/neon-cyberpunk.css?raw").then((m) => m.default),
	},
	{
		id: "pastel-dream",
		name: "Pastel Dream",
		colors: { bg: "#fef9ff", text: "#4a3f6b", accent: "#b388ff" },
		load: () =>
			import("./themes/pastel-dream.css?raw").then((m) => m.default),
	},
	{
		id: "swiss-design",
		name: "Swiss Design",
		colors: { bg: "#ffffff", text: "#111111", accent: "#ff0000" },
		load: () =>
			import("./themes/swiss-design.css?raw").then((m) => m.default),
	},
	{
		id: "ink-brush",
		name: "Ink & Brush",
		colors: { bg: "#faf8f5", text: "#2c2c2c", accent: "#c62828" },
		load: () => import("./themes/ink-brush.css?raw").then((m) => m.default),
	},
	{
		id: "cosmic-purple",
		name: "Cosmic Purple",
		colors: { bg: "#0f0720", text: "#e8dff5", accent: "#c084fc" },
		load: () =>
			import("./themes/cosmic-purple.css?raw").then((m) => m.default),
	},
	{
		id: "tropical-sunset",
		name: "Tropical Sunset",
		colors: { bg: "#fff7ed", text: "#4a2c17", accent: "#f97316" },
		load: () =>
			import("./themes/tropical-sunset.css?raw").then((m) => m.default),
	},
	{
		id: "forest-earth",
		name: "Forest & Earth",
		colors: { bg: "#f5f0e8", text: "#2d3a2e", accent: "#4a7c59" },
		load: () =>
			import("./themes/forest-earth.css?raw").then((m) => m.default),
	},
	{
		id: "art-deco",
		name: "Art Deco",
		colors: { bg: "#1a1a2e", text: "#f0e6d3", accent: "#d4af37" },
		load: () => import("./themes/art-deco.css?raw").then((m) => m.default),
	},
	{
		id: "candy-pop",
		name: "Candy Pop",
		colors: { bg: "#fffbfe", text: "#4a2153", accent: "#ff6b9d" },
		load: () => import("./themes/candy-pop.css?raw").then((m) => m.default),
	},
	{
		id: "minimal-mono",
		name: "Minimal Mono",
		colors: { bg: "#fafafa", text: "#1a1a1a", accent: "#0066ff" },
		load: () =>
			import("./themes/minimal-mono.css?raw").then((m) => m.default),
	},
	{
		id: "newspaper",
		name: "Newspaper",
		colors: { bg: "#fdf8ef", text: "#222222", accent: "#8b0000" },
		load: () => import("./themes/newspaper.css?raw").then((m) => m.default),
	},
	{
		id: "vaporwave",
		name: "Vaporwave",
		colors: { bg: "#2d1b69", text: "#e8c4f0", accent: "#ff71ce" },
		load: () => import("./themes/vaporwave.css?raw").then((m) => m.default),
	},
	{
		id: "arctic-ice",
		name: "Arctic Ice",
		colors: { bg: "#f0f7ff", text: "#1e3a5f", accent: "#0284c7" },
		load: () =>
			import("./themes/arctic-ice.css?raw").then((m) => m.default),
	},
	{
		id: "sunset-desert",
		name: "Sunset Desert",
		colors: { bg: "#fef7ed", text: "#5c3d2e", accent: "#e07a5f" },
		load: () =>
			import("./themes/sunset-desert.css?raw").then((m) => m.default),
	},
	{
		id: "electric-blue",
		name: "Electric Blue",
		colors: { bg: "#0c1222", text: "#c8d6e5", accent: "#3b82f6" },
		load: () =>
			import("./themes/electric-blue.css?raw").then((m) => m.default),
	},
	{
		id: "handwritten",
		name: "Handwritten",
		colors: { bg: "#fffff8", text: "#333333", accent: "#2980b9" },
		load: () =>
			import("./themes/handwritten.css?raw").then((m) => m.default),
	},
];
