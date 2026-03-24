import { getThemeState } from "./themes/theme.svelte";

export type ContentWidth = "auto" | "wide" | "full";

const STORAGE_KEY = "md-preferences";

interface StoredPreferences {
	theme?: string;
	contentWidth?: ContentWidth;
}

function loadStored(): StoredPreferences {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : {};
	} catch {
		return {};
	}
}

function saveStored(prefs: StoredPreferences) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

let contentWidth = $state<ContentWidth>("auto");
let showPanel = $state(false);

const contentWidthValues: Record<ContentWidth, string> = {
	auto: "780px",
	wide: "1200px",
	full: "100%",
};

export function getPreferences() {
	const themeState = getThemeState();

	return {
		get contentWidth() {
			return contentWidth;
		},
		get contentWidthCss() {
			return contentWidthValues[contentWidth];
		},
		get showPanel() {
			return showPanel;
		},
		get theme() {
			return themeState;
		},

		setContentWidth(value: ContentWidth) {
			contentWidth = value;
			saveStored({ theme: themeState.id, contentWidth: value });
		},

		async setTheme(id: string) {
			await themeState.setTheme(id);
			saveStored({ theme: id, contentWidth });
		},

		openPanel() {
			showPanel = true;
		},
		closePanel() {
			showPanel = false;
		},
		togglePanel() {
			showPanel = !showPanel;
		},

		async init() {
			const stored = loadStored();
			if (stored.contentWidth) contentWidth = stored.contentWidth;

			// Theme init — prefer preferences storage, fall back to theme's own storage
			if (stored.theme) {
				await themeState.setTheme(stored.theme);
			} else {
				await themeState.init();
			}
		},
	};
}
