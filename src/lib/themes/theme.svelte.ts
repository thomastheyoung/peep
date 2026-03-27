import { themes, type ThemeId } from "./registry";

export function isThemeId(value: string): value is ThemeId {
	return themes.some((t) => t.id === value);
}

export interface ThemeStateAPI {
	readonly id: ThemeId;
	readonly css: string;
	readonly all: typeof themes;
	setTheme(id: ThemeId): Promise<void>;
	init(): Promise<void>;
}

let activeId: ThemeId = $state("github-dark");
let activeCss = $state("");

export const themeState: ThemeStateAPI = {
	get id() {
		return activeId;
	},
	get css() {
		return activeCss;
	},
	get all() {
		return themes;
	},
	async setTheme(id: ThemeId) {
		const meta = themes.find((t) => t.id === id);
		if (!meta) return;
		const css = await meta.load();
		activeId = id;
		activeCss = css;
	},
	async init() {
		await themeState.setTheme("github-dark");
	},
};
