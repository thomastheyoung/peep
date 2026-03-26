import { getThemeState } from "./themes/theme.svelte";

export type ContentWidth = "auto" | "wide" | "full";
export type SettingsSection = "appearance" | "layout" | "font";

// ---------------------------------------------------------------------------
// Settings registry types — the single source of truth consumed by both
// the Preferences panel and the command palette.
// ---------------------------------------------------------------------------

export interface ChoiceOption {
	value: string;
	label: string;
	description?: string;
	swatches?: { bg: string; text: string; accent: string };
}

export interface ChoiceSetting {
	type: "choice";
	id: string;
	label: string;
	section: SettingsSection;
	keywords: string[];
	options: ChoiceOption[];
	value: string;
	select: (value: string) => void | Promise<void>;
}

export interface RangeSetting {
	type: "range";
	id: string;
	label: string;
	section: SettingsSection;
	keywords: string[];
	min: number;
	max: number;
	step: number;
	value: number;
	defaultValue: number;
	set: (value: number) => void;
	format: (value: number) => string;
}

export type SettingDef = ChoiceSetting | RangeSetting;

export const settingsSections: { id: SettingsSection; label: string }[] = [
	{ id: "appearance", label: "Appearance" },
	{ id: "layout", label: "Layout" },
	{ id: "font", label: "Font" },
];

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

const STORAGE_KEY = "md-preferences";

interface StoredPreferences {
	theme?: string;
	contentWidth?: ContentWidth;
	zoomLevel?: number;
	fontWeight?: number;
	letterSpacing?: number;
	lineHeight?: number;
	showToc?: boolean;
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

// ---------------------------------------------------------------------------
// Defaults & constants
// ---------------------------------------------------------------------------

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.1;
const ZOOM_DEFAULT = 1;

const FONT_WEIGHT_MIN = 300;
const FONT_WEIGHT_MAX = 700;
const FONT_WEIGHT_STEP = 100;
const FONT_WEIGHT_DEFAULT = 400;

const LETTER_SPACING_MIN = -0.05;
const LETTER_SPACING_MAX = 0.15;
const LETTER_SPACING_STEP = 0.01;
const LETTER_SPACING_DEFAULT = 0;

const LINE_HEIGHT_MIN = 1.2;
const LINE_HEIGHT_MAX = 2.4;
const LINE_HEIGHT_STEP = 0.1;
const LINE_HEIGHT_DEFAULT = 1.7;

const FONT_WEIGHT_LABELS: Record<number, string> = {
	300: "Light",
	400: "Regular",
	500: "Medium",
	600: "Semibold",
	700: "Bold",
};

function formatLetterSpacing(v: number): string {
	if (v === 0) return "0 em";
	return `${v > 0 ? "+" : ""}${v.toFixed(2)} em`;
}

// ---------------------------------------------------------------------------
// Reactive state
// ---------------------------------------------------------------------------

let contentWidth = $state<ContentWidth>("auto");
let zoomLevel = $state(ZOOM_DEFAULT);
let showPanel = $state(false);
let activeSection = $state<SettingsSection>("appearance");
let fontWeight = $state(FONT_WEIGHT_DEFAULT);
let letterSpacing = $state(LETTER_SPACING_DEFAULT);
let lineHeight = $state(LINE_HEIGHT_DEFAULT);
let showToc = $state(true);

const contentWidthValues: Record<ContentWidth, string> = {
	auto: "780px",
	wide: "1200px",
	full: "100%",
};

function allStored(themeId: string): StoredPreferences {
	return { theme: themeId, contentWidth, zoomLevel, fontWeight, letterSpacing, lineHeight, showToc };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getPreferences() {
	const themeState = getThemeState();

	// Setter helpers — shared by direct API and settings registry
	function setContentWidthValue(value: ContentWidth) {
		contentWidth = value;
		saveStored(allStored(themeState.id));
	}

	function setFontWeightValue(value: number) {
		fontWeight = Math.max(FONT_WEIGHT_MIN, Math.min(FONT_WEIGHT_MAX, value));
		saveStored(allStored(themeState.id));
	}

	function setLetterSpacingValue(value: number) {
		letterSpacing = Math.max(LETTER_SPACING_MIN, Math.min(LETTER_SPACING_MAX, Math.round(value * 100) / 100));
		saveStored(allStored(themeState.id));
	}

	function setLineHeightValue(value: number) {
		lineHeight = Math.max(LINE_HEIGHT_MIN, Math.min(LINE_HEIGHT_MAX, Math.round(value * 10) / 10));
		saveStored(allStored(themeState.id));
	}

	function setZoomValue(value: number) {
		zoomLevel = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, Math.round(value * 10) / 10));
		saveStored(allStored(themeState.id));
	}

	function setShowTocValue(value: boolean) {
		showToc = value;
		saveStored(allStored(themeState.id));
	}

	async function setThemeValue(id: string) {
		await themeState.setTheme(id);
		saveStored(allStored(id));
	}

	return {
		// CSS value getters — consumed by +page.svelte for inline styles
		get contentWidthCss() {
			return contentWidthValues[contentWidth];
		},
		get fontWeightCss() {
			return String(fontWeight);
		},
		get letterSpacingCss() {
			return `${letterSpacing}em`;
		},
		get lineHeightCss() {
			return String(lineHeight);
		},
		get zoomLevel() {
			return zoomLevel;
		},

		// Panel state
		get showPanel() {
			return showPanel;
		},
		get activeSection() {
			return activeSection;
		},
		get theme() {
			return themeState;
		},

		// ---------------------------------------------------------------
		// Settings registry — the single list that drives both the
		// Preferences panel and the command palette.
		// ---------------------------------------------------------------
		get settings(): SettingDef[] {
			return [
				// Appearance
				{
					type: "choice",
					id: "theme",
					label: "Theme",
					section: "appearance",
					keywords: ["color", "dark", "light", "appearance"],
					options: themeState.all.map((t) => ({
						value: t.id,
						label: t.name,
						swatches: t.colors,
					})),
					value: themeState.id,
					select: setThemeValue,
				},

				// Layout
				{
					type: "choice",
					id: "content-width",
					label: "Content width",
					section: "layout",
					keywords: ["layout", "narrow", "wide", "full"],
					options: [
						{ value: "auto", label: "Auto", description: "Optimized for reading (~80 chars)" },
						{ value: "wide", label: "Wide", description: "More room for tables and code" },
						{ value: "full", label: "Full", description: "Use the entire window width" },
					],
					value: contentWidth,
					select: (v) => setContentWidthValue(v as ContentWidth),
				},
				{
					type: "choice",
					id: "table-of-contents",
					label: "Table of contents",
					section: "layout",
					keywords: ["toc", "outline", "sidebar", "headings"],
					options: [
						{ value: "on", label: "Show" },
						{ value: "off", label: "Hide" },
					],
					value: showToc ? "on" : "off",
					select: (v) => setShowTocValue(v === "on"),
				},
				{
					type: "range",
					id: "zoom",
					label: "Zoom",
					section: "layout",
					keywords: ["magnify", "bigger", "smaller", "scale"],
					min: ZOOM_MIN,
					max: ZOOM_MAX,
					step: ZOOM_STEP,
					value: zoomLevel,
					defaultValue: ZOOM_DEFAULT,
					set: setZoomValue,
					format: (v) => `${Math.round(v * 100)}%`,
				},

				// Font
				{
					type: "range",
					id: "font-weight",
					label: "Weight",
					section: "font",
					keywords: ["bold", "light", "regular", "medium", "semibold"],
					min: FONT_WEIGHT_MIN,
					max: FONT_WEIGHT_MAX,
					step: FONT_WEIGHT_STEP,
					value: fontWeight,
					defaultValue: FONT_WEIGHT_DEFAULT,
					set: setFontWeightValue,
					format: (v) => FONT_WEIGHT_LABELS[v] ?? String(v),
				},
				{
					type: "range",
					id: "letter-spacing",
					label: "Letter spacing",
					section: "font",
					keywords: ["tracking", "kerning", "spacing"],
					min: LETTER_SPACING_MIN,
					max: LETTER_SPACING_MAX,
					step: LETTER_SPACING_STEP,
					value: letterSpacing,
					defaultValue: LETTER_SPACING_DEFAULT,
					set: setLetterSpacingValue,
					format: formatLetterSpacing,
				},
				{
					type: "range",
					id: "line-height",
					label: "Line height",
					section: "font",
					keywords: ["leading", "spacing", "vertical"],
					min: LINE_HEIGHT_MIN,
					max: LINE_HEIGHT_MAX,
					step: LINE_HEIGHT_STEP,
					value: lineHeight,
					defaultValue: LINE_HEIGHT_DEFAULT,
					set: setLineHeightValue,
					format: (v) => v.toFixed(1),
				},
			];
		},

		// Direct setters — used by zoom event handler, keyboard shortcuts, etc.
		zoomIn() {
			setZoomValue(zoomLevel + ZOOM_STEP);
		},
		zoomOut() {
			setZoomValue(zoomLevel - ZOOM_STEP);
		},
		resetZoom() {
			setZoomValue(ZOOM_DEFAULT);
		},

		async setTheme(id: string) {
			await setThemeValue(id);
		},

		setActiveSection(section: SettingsSection) {
			activeSection = section;
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

		get showToc() {
			return showToc;
		},
		toggleToc() {
			setShowTocValue(!showToc);
		},

		async init() {
			const stored = loadStored();
			if (stored.contentWidth) contentWidth = stored.contentWidth;
			if (stored.zoomLevel) zoomLevel = stored.zoomLevel;
			if (stored.fontWeight != null) fontWeight = stored.fontWeight;
			if (stored.letterSpacing != null) letterSpacing = stored.letterSpacing;
			if (stored.lineHeight != null) lineHeight = stored.lineHeight;
			if (stored.showToc != null) showToc = stored.showToc;

			if (stored.theme) {
				await themeState.setTheme(stored.theme);
			} else {
				await themeState.init();
			}
		},
	};
}
