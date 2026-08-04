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

// `step` and `precision` are deliberately separate fields, not one derived
// from the other:
//   - `step` is a UI affordance, read only when building `settings` and passed
//     through to an `<input type="range">`.
//   - `precision` is a domain invariant, read only by `normalize()`.
// `fontWeight` is the case that proves they are different concepts: it steps
// by 100 in the panel, but CSS accepts any integer weight and variable fonts
// honor them, so a hand-written `437` is kept rather than snapped. Omitting
// `precision` is how an entry says "clamp but do not quantize".
interface NumericSpec {
	min: number;
	max: number;
	step: number;
	default: number;
	/** Multiplier for `Math.round(v * p) / p`. Omit to skip quantization. */
	precision?: number;
}

// Not `as const`: that would narrow each `default` to a literal type, so
// `$state(NUMERIC_SPECS.zoomLevel.default)` would infer `1` instead of
// `number` and reject every later assignment. `satisfies` alone gives the
// compile-time check that each entry is a complete spec.
const NUMERIC_SPECS = {
	zoomLevel: { min: 0.5, max: 3, step: 0.1, default: 1, precision: 10 },
	fontWeight: { min: 300, max: 700, step: 100, default: 400 },
	letterSpacing: { min: -0.05, max: 0.15, step: 0.01, default: 0, precision: 100 },
	lineHeight: { min: 1.2, max: 2.4, step: 0.1, default: 1.7, precision: 10 },
} satisfies Record<string, NumericSpec>;

// Clamp (and optionally quantize) a number into a setting's valid domain.
//
// Used by both the setters and `init()`, so a value loaded from disk is always
// one the setters could have produced — everything downstream (the range
// inputs, the `format` functions, the `defaultValue` comparisons) was written
// against the setters' output domain, and a weaker load-path normalization
// would leave reachable states the rest of the module does not handle.
//
// The quantization is written as `Math.round(v * p) / p` and must stay that
// way. The algebraically identical `Math.round(v / q) * q` is NOT equivalent
// in IEEE-754: `1.15 / 0.1` is `11.499999999999998`, so that form rounds 1.15
// DOWN to 1.1 while this one gives 1.2. The error is introduced before the
// rounding decision, so it changes the result and not merely its precision.
//
// Quantize first, clamp second — the clamp must be last so it is always
// authoritative. Every bound in NUMERIC_SPECS is currently an exact multiple
// of its own quantum, which makes the two orders equivalent today, but they
// diverge the moment a bound is not: with `max: 0.15, precision: 10`, clamping
// first yields 0.2 for an input of 0.16, i.e. a result ABOVE the maximum.
function normalize(value: number, spec: NumericSpec): number {
	const quantized = spec.precision ? Math.round(value * spec.precision) / spec.precision : value;
	return Math.max(spec.min, Math.min(spec.max, quantized));
}

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
let zoomLevel = $state(NUMERIC_SPECS.zoomLevel.default);
let showPanel = $state(false);
let activeSection = $state<SettingsSection>("appearance");
let fontWeight = $state(NUMERIC_SPECS.fontWeight.default);
let letterSpacing = $state(NUMERIC_SPECS.letterSpacing.default);
let lineHeight = $state(NUMERIC_SPECS.lineHeight.default);
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
	fontWeight = normalize(value, NUMERIC_SPECS.fontWeight);
	persist();
}

function setLetterSpacingValue(value: number) {
	letterSpacing = normalize(value, NUMERIC_SPECS.letterSpacing);
	persist();
}

function setLineHeightValue(value: number) {
	lineHeight = normalize(value, NUMERIC_SPECS.lineHeight);
	persist();
}

function setZoomValue(value: number) {
	zoomLevel = normalize(value, NUMERIC_SPECS.zoomLevel);
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
		min: NUMERIC_SPECS.zoomLevel.min,
		max: NUMERIC_SPECS.zoomLevel.max,
		step: NUMERIC_SPECS.zoomLevel.step,
		value: zoomLevel,
		defaultValue: NUMERIC_SPECS.zoomLevel.default,
		set: setZoomValue,
		format: (v) => `${Math.round(v * 100)}%`,
	},
	{
		type: "range",
		id: "font-weight",
		label: "Weight",
		section: "font",
		keywords: ["bold", "light", "regular", "medium", "semibold"],
		min: NUMERIC_SPECS.fontWeight.min,
		max: NUMERIC_SPECS.fontWeight.max,
		step: NUMERIC_SPECS.fontWeight.step,
		value: fontWeight,
		defaultValue: NUMERIC_SPECS.fontWeight.default,
		set: setFontWeightValue,
		format: (v) => FONT_WEIGHT_LABELS[v] ?? String(v),
	},
	{
		type: "range",
		id: "letter-spacing",
		label: "Letter spacing",
		section: "font",
		keywords: ["tracking", "kerning", "spacing"],
		min: NUMERIC_SPECS.letterSpacing.min,
		max: NUMERIC_SPECS.letterSpacing.max,
		step: NUMERIC_SPECS.letterSpacing.step,
		value: letterSpacing,
		defaultValue: NUMERIC_SPECS.letterSpacing.default,
		set: setLetterSpacingValue,
		format: formatLetterSpacing,
	},
	{
		type: "range",
		id: "line-height",
		label: "Line height",
		section: "font",
		keywords: ["leading", "spacing", "vertical"],
		min: NUMERIC_SPECS.lineHeight.min,
		max: NUMERIC_SPECS.lineHeight.max,
		step: NUMERIC_SPECS.lineHeight.step,
		value: lineHeight,
		defaultValue: NUMERIC_SPECS.lineHeight.default,
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
		setZoomValue(zoomLevel + NUMERIC_SPECS.zoomLevel.step);
	},
	zoomOut() {
		setZoomValue(zoomLevel - NUMERIC_SPECS.zoomLevel.step);
	},
	resetZoom() {
		setZoomValue(NUMERIC_SPECS.zoomLevel.default);
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
		// `parseStoredPreferences` proves these are finite numbers, not that they
		// are in range: a hand-edited `{"zoomLevel": 1e6}` would otherwise render
		// an unusable window until the user found Cmd+0.
		//
		// Normalized via `normalize()` rather than through the setters, which
		// would reuse the same clamps but also `persist()` — the load path would
		// then write on every launch, and those writes would interleave with the
		// migration write queued above, the exact ordering hazard `queueSave`
		// exists to prevent.
		const stored = parseStoredPreferences(raw);
		if (stored.contentWidth) contentWidth = stored.contentWidth;
		if (stored.zoomLevel != null) zoomLevel = normalize(stored.zoomLevel, NUMERIC_SPECS.zoomLevel);
		if (stored.fontWeight != null) fontWeight = normalize(stored.fontWeight, NUMERIC_SPECS.fontWeight);
		if (stored.letterSpacing != null)
			letterSpacing = normalize(stored.letterSpacing, NUMERIC_SPECS.letterSpacing);
		if (stored.lineHeight != null) lineHeight = normalize(stored.lineHeight, NUMERIC_SPECS.lineHeight);
		// `isThemeId` is a point-in-time check against the theme registry. Once
		// user themes are discovered from disk (markdown-viewer-s0r), discovery
		// must complete before this runs, or a valid user-theme id falls through
		// to the default and the user's choice silently resets each launch.
		if (stored.theme && isThemeId(stored.theme)) {
			await themeState.setTheme(stored.theme);
		} else {
			await themeState.init();
		}
	},
};
