import { themeState, isThemeId } from "./themes/theme.svelte";
import { type ThemeId } from "./themes/registry";
import { loadPreferencesFile, savePreferencesFile } from "./ipc";

type ContentWidth = "auto" | "wide" | "full";
type SettingsSection = "appearance" | "layout" | "font";

// ---------------------------------------------------------------------------
// Settings registry types — the single source of truth consumed by both
// the Preferences panel and the command palette.
// ---------------------------------------------------------------------------

interface ChoiceOption<T extends string = string> {
	value: T;
	label: string;
	description?: string;
	swatches?: { bg: string; text: string; accent: string };
}

export interface ChoiceSetting<T extends string = string> {
	type: "choice";
	id: string;
	label: string;
	section: SettingsSection;
	keywords: string[];
	options: ChoiceOption<T>[];
	value: T;
	select: (value: T) => void | Promise<void>;
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
}

function parseStoredPreferences(raw: string | null): Partial<StoredPreferences> {
	if (!raw) return {};
	try {
		const parsed: unknown = JSON.parse(raw);
		if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
		const obj = parsed as Record<string, unknown>;
		const result: Partial<StoredPreferences> = {};
		if (typeof obj.theme === "string") result.theme = obj.theme;
		if (typeof obj.contentWidth === "string" && ["auto", "wide", "full"].includes(obj.contentWidth))
			result.contentWidth = obj.contentWidth as ContentWidth;
		if (typeof obj.zoomLevel === "number" && isFinite(obj.zoomLevel)) result.zoomLevel = obj.zoomLevel;
		if (typeof obj.fontWeight === "number" && isFinite(obj.fontWeight)) result.fontWeight = obj.fontWeight;
		if (typeof obj.letterSpacing === "number" && isFinite(obj.letterSpacing))
			result.letterSpacing = obj.letterSpacing;
		if (typeof obj.lineHeight === "number" && isFinite(obj.lineHeight)) result.lineHeight = obj.lineHeight;
		return result;
	} catch {
		return {};
	}
}

// Debounced: localStorage writes were sync and free, but a range slider calls
// `set` on every step (see commands.ts:81 / the drag handlers in
// Preferences.svelte), which would otherwise mean one fsync-ed disk write per
// animation frame over IPC. Stays a plain (non-async) function so `persist()`
// and its call sites don't need to become async just to fire off a save.
const SAVE_DEBOUNCE_MS = 150; // matches the existing file-changed debounce in +page.svelte
let saveTimer: ReturnType<typeof setTimeout> | undefined;

// Serializes writes so the LAST-ISSUED save is the last to land on disk.
//
// This is not belt-and-braces: Tauri dispatches every `invoke` onto its async
// runtime via `async_runtime::spawn` (tauri/src/ipc/mod.rs:329), and the JS
// `invoke` returns independent promises, so two in-flight writes can complete
// in either order. The backend's `prefs_lock` guarantees mutual exclusion but
// NOT ordering. Without this chain the first-run migration write (issued from
// `init`, and the slowest possible write since it creates the config dir) can
// land *after* a newer user change and silently revert it — and then delete the
// localStorage key that was the only remaining copy.
let saveChain: Promise<void> = Promise.resolve();
function queueSave(json: string): Promise<void> {
	// Both handlers re-issue: a rejected earlier write must not poison the chain
	// and block every subsequent save for the rest of the session.
	saveChain = saveChain.then(
		() => savePreferencesFile(json),
		() => savePreferencesFile(json),
	);
	return saveChain;
}

function saveStored(prefs: StoredPreferences) {
	clearTimeout(saveTimer);
	saveTimer = setTimeout(() => {
		saveTimer = undefined;
		queueSave(JSON.stringify(prefs)).catch((err) => console.error("Failed to save preferences:", err));
	}, SAVE_DEBOUNCE_MS);
}

/**
 * Writes any pending debounced save immediately. Without this, quitting within
 * `SAVE_DEBOUNCE_MS` of a change drops it — a regression versus the old
 * synchronous localStorage write, and one users would notice because this app
 * already persists window geometry across sessions.
 */
function flushStored(): Promise<void> {
	if (saveTimer === undefined) return saveChain;
	clearTimeout(saveTimer);
	saveTimer = undefined;
	return queueSave(JSON.stringify(allStored(themeState.id)));
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
const contentWidthValues: Record<ContentWidth, string> = {
	auto: "780px",
	wide: "1200px",
	full: "100%",
};

function allStored(themeId: string): StoredPreferences {
	return { theme: themeId, contentWidth, zoomLevel, fontWeight, letterSpacing, lineHeight };
}

function persist() {
	saveStored(allStored(themeState.id));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

// Setter helpers — shared by direct API and settings registry
function setContentWidthValue(value: ContentWidth) {
	contentWidth = value;
	persist();
}

function setFontWeightValue(value: number) {
	fontWeight = Math.max(FONT_WEIGHT_MIN, Math.min(FONT_WEIGHT_MAX, value));
	persist();
}

function setLetterSpacingValue(value: number) {
	letterSpacing = Math.max(LETTER_SPACING_MIN, Math.min(LETTER_SPACING_MAX, Math.round(value * 100) / 100));
	persist();
}

function setLineHeightValue(value: number) {
	lineHeight = Math.max(LINE_HEIGHT_MIN, Math.min(LINE_HEIGHT_MAX, Math.round(value * 10) / 10));
	persist();
}

function setZoomValue(value: number) {
	zoomLevel = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, Math.round(value * 10) / 10));
	persist();
}

async function setThemeValue(id: ThemeId) {
	await themeState.setTheme(id);
	persist();
}

const settings: SettingDef[] = $derived([
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
		select: (value: string) => setThemeValue(value as ThemeId),
	},
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
		select: (value: string) => setContentWidthValue(value as ContentWidth),
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
]);

export interface PreferencesAPI {
	readonly contentWidthCss: string;
	readonly fontWeightCss: string;
	readonly letterSpacingCss: string;
	readonly lineHeightCss: string;
	readonly zoomLevel: number;
	readonly showPanel: boolean;
	readonly activeSection: SettingsSection;
	readonly theme: import("./themes/theme.svelte").ThemeStateAPI;
	readonly settings: SettingDef[];
	zoomIn(): void;
	zoomOut(): void;
	resetZoom(): void;
	setTheme(id: ThemeId): Promise<void>;
	setActiveSection(section: SettingsSection): void;
	openPanel(): void;
	closePanel(): void;
	togglePanel(): void;
	init(): Promise<void>;
	/** Write any pending debounced save immediately. Call before the app quits. */
	flush(): Promise<void>;
}

export const preferences: PreferencesAPI = {
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

	get settings() {
		return settings;
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

	async setTheme(id: ThemeId) {
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

	flush() {
		return flushStored();
	},

	async init() {
		// Migration from the pre-on-disk-preferences localStorage scheme:
		//
		// | File     | localStorage   | Behavior                                            |
		// |----------|----------------|------------------------------------------------------|
		// | present  | any            | file wins; localStorage ignored and left in place    |
		// | absent   | present+valid  | migrate; remove LS key only after the write resolves |
		// | absent   | absent         | defaults                                             |
		// | corrupt  | any            | parseStoredPreferences returns {} => defaults; next  |
		// |          |                | persist() repairs. Deliberately does NOT fall back   |
		// |          |                | to localStorage — a corrupt file proves migration    |
		// |          |                | already ran, so resurrecting the LS snapshot would   |
		// |          |                | time-travel settings. Self-heal over archaeology.    |
		let raw = await loadPreferencesFile();
		if (raw === null) {
			const legacy = localStorage.getItem(STORAGE_KEY);
			if (legacy !== null && Object.keys(parseStoredPreferences(legacy)).length > 0) {
				raw = legacy;
				// Queued rather than awaited: awaiting would block `init()`, and with
				// it theme application, behind a disk write — the user would stare at
				// an unthemed window. Going through `queueSave` means any later user
				// change is chained *after* this write and therefore wins, so the
				// migration can never revert newer state (see `queueSave`).
				//
				// The legacy key is removed ONLY after the write resolves, so a failed
				// write leaves the migration retryable on the next launch.
				queueSave(legacy)
					.then(() => localStorage.removeItem(STORAGE_KEY))
					.catch((err) => console.error("Preferences migration failed:", err));
			}
		}
		const stored = parseStoredPreferences(raw);
		if (stored.contentWidth) contentWidth = stored.contentWidth;
		if (stored.zoomLevel != null) zoomLevel = stored.zoomLevel;
		if (stored.fontWeight != null) fontWeight = stored.fontWeight;
		if (stored.letterSpacing != null) letterSpacing = stored.letterSpacing;
		if (stored.lineHeight != null) lineHeight = stored.lineHeight;
		if (stored.theme && isThemeId(stored.theme)) {
			await themeState.setTheme(stored.theme);
		} else {
			await themeState.init();
		}
	},
};
