import { themes, type ThemeId } from "./registry";

const STORAGE_KEY = "md-theme";

let activeId: ThemeId = $state("github-dark");
let activeCss = $state("");

export function getThemeState() {
	return {
		get id() {
			return activeId;
		},
		get css() {
			return activeCss;
		},
		get meta() {
			return themes.find((t) => t.id === activeId);
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
			localStorage.setItem(STORAGE_KEY, id);
		},
		async init() {
			const saved = localStorage.getItem(STORAGE_KEY);
			const id: ThemeId =
				saved && themes.find((t) => t.id === saved)
					? (saved as ThemeId)
					: "github-dark";
			await this.setTheme(id);
		},
	};
}
