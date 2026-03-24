import { getThemeState } from "./themes/theme.svelte";

export type ContentWidth = "auto" | "wide" | "full";

const STORAGE_KEY = "md-preferences";

interface StoredPreferences {
	theme?: string;
	contentWidth?: ContentWidth;
	zoomLevel?: number;
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

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.1;

let contentWidth = $state<ContentWidth>("auto");
let zoomLevel = $state(1);
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
		get zoomLevel() {
			return zoomLevel;
		},
		get zoomCss() {
			return `${zoomLevel * 100}%`;
		},
		get theme() {
			return themeState;
		},

		setContentWidth(value: ContentWidth) {
			contentWidth = value;
			saveStored({ theme: themeState.id, contentWidth: value, zoomLevel });
		},

		zoomIn() {
			zoomLevel = Math.min(ZOOM_MAX, Math.round((zoomLevel + ZOOM_STEP) * 10) / 10);
			saveStored({ theme: themeState.id, contentWidth, zoomLevel });
		},
		zoomOut() {
			zoomLevel = Math.max(ZOOM_MIN, Math.round((zoomLevel - ZOOM_STEP) * 10) / 10);
			saveStored({ theme: themeState.id, contentWidth, zoomLevel });
		},
		resetZoom() {
			zoomLevel = 1;
			saveStored({ theme: themeState.id, contentWidth, zoomLevel });
		},

		async setTheme(id: string) {
			await themeState.setTheme(id);
			saveStored({ theme: id, contentWidth, zoomLevel });
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
			if (stored.zoomLevel) zoomLevel = stored.zoomLevel;

			// Theme init — prefer preferences storage, fall back to theme's own storage
			if (stored.theme) {
				await themeState.setTheme(stored.theme);
			} else {
				await themeState.init();
			}
		},
	};
}
