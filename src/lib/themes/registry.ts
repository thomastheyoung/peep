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
];
