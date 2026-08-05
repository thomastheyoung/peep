import { themeState, isThemeId, discover } from "./themes/theme.svelte";
import { type ThemeId } from "./themes/registry";
import type { ThemeColors } from "./themes/parse-theme-css";
import { slugifyThemeId, resolveThemeId, withFrontmatterName } from "./themes/parse-theme-css";
import { loadPreferencesFile, savePreferencesFile, loadUserThemes, importThemeCss, deleteUserTheme } from "./ipc";
import { prompt } from "./prompt.svelte";
import { toast } from "./toast.svelte";

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
	swatches?: ThemeColors;
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

/** Actions offered per-theme in the palette/panel. `"delete"` is user-theme only. */
export type ThemeAction = "delete" | "duplicate";

/**
 * A single theme entry. NOT `ChoiceOption` — deliberately a separate,
 * theme-specific shape rather than widening the shared `ChoiceOption`, which
 * `content-width` also uses. `swatches` was already a theme-concept leak into
 * `ChoiceOption` (see `hasSwatches` in `Preferences.svelte`, a runtime shape
 * inference standing in for "is this the theme setting"); adding
 * `source`/`path`/`revision`/`actions` on top of that shared type would leak
 * further and make every non-theme `ChoiceOption` consumer carry fields that
 * make no sense for it.
 *
 * `swatches` is REQUIRED, not optional: `user-theme.ts`'s `FALLBACK_SWATCH`
 * guarantees every discovered user theme gets a (possibly gray) swatch
 * triple, and `registry.ts` guarantees the same for builtins via the
 * generated `theme-colors.ts` — so there is no real theme this type needs to
 * represent without one, and making it required is what lets consumers stop
 * treating "no swatch" as a case they have to handle.
 */
export interface ThemeOption {
	value: string;
	label: string;
	swatches: ThemeColors;
	source: "builtin" | "user";
	/** User themes only — the CSS file's path on disk. */
	path?: string;
	/** User themes only — mtime in ms, used as a preview cache-bust key. */
	revision?: number;
	actions: readonly ThemeAction[];
}

export interface ThemeSetting {
	type: "theme";
	id: "theme";
	label: string;
	section: SettingsSection;
	keywords: string[];
	options: ThemeOption[];
	value: string;
	select: (value: string) => Promise<void>;
	/** Delete a user theme. No-op (aside from the confirm/switch dance) on a builtin id. */
	remove: (value: string) => Promise<void>;
	/** Copy any theme (builtin or user) under a new id, via the naming flow. */
	duplicate: (value: string) => Promise<void>;
}

export type SettingDef = ChoiceSetting | RangeSetting | ThemeSetting;

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

// The stored theme id from a launch whose scan could not run (`discover()`
// returned `scanned: false`), held so later writes can put it back verbatim.
//
// It has to be the ORIGINAL string, not the visual fallback and not an
// omitted field. Omitting is the trap: `savePreferencesFile` replaces the
// whole file (`write_atomic` in lib.rs renames a freshly written temp over
// it), so a payload with no `theme` key does not "leave the stored value
// alone" — it ERASES it, on the very first zoom step or slider drag after a
// failed scan. That is the same data loss this whole branch exists to
// prevent, just reached by a different route. Measured before this was
// written: the payload came out as
// `{"contentWidth":"auto","zoomLevel":1.1,...}` with the user's id gone.
//
// A scan failure is not evidence the theme is gone, only that this launch
// could not check — so the correct write is the value we were given, not a
// guess and not a hole.
//
// `undefined` (the normal case, for every successful launch and every
// explicit setTheme) means "serialize the live theme id as usual".
// `setThemeValue` clears it, because an explicit user pick always wins: at
// that moment there is a definite new value to write.
let unverifiedThemeId: string | undefined;

function allStored(themeId: string): StoredPreferences {
	return {
		theme: unverifiedThemeId ?? themeId,
		contentWidth,
		zoomLevel,
		fontWeight,
		letterSpacing,
		lineHeight,
	};
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
	// An explicit user pick is a definite value to persist regardless of how
	// this session's theme field got here — releases any id a failed
	// launch-time scan (see `unverifiedThemeId`) was holding on the user's
	// behalf.
	unverifiedThemeId = undefined;
	persist();
}

/**
 * Apply `candidateId` if it resolves against the (successfully) discovered
 * registry, otherwise fall back to the default theme AND PERSIST that
 * fallback (markdown-viewer-zm6). Callers MUST only reach this after a
 * `discover()` call has reported `scanned: true` — this function has no way
 * to tell "genuinely gone" from "couldn't check," so calling it on a failed
 * scan would silently reintroduce the exact data loss `unverifiedThemeId`
 * exists to prevent.
 *
 * Shared by two call sites that both need this same rule:
 *   - `init()`, with `candidateId` = the freshly-parsed (not yet applied)
 *     stored theme id.
 *   - the `user-themes-changed` watcher's post-reconcile step, with
 *     `candidateId` = the CURRENTLY ACTIVE `themeState.id` — a theme that was
 *     valid a moment ago can stop resolving mid-session (the user deleted the
 *     file), and that reconciliation is the identical rule at a different
 *     trigger, not a different rule.
 *
 * Releases `unverifiedThemeId` unconditionally on entry: reaching this
 * function at all means a scan just succeeded, so whatever an EARLIER failed
 * scan was holding onto is no longer the right thing to write — either this
 * candidate resolves (write it) or it doesn't (write the default instead).
 */
async function applyResolvedTheme(candidateId: string | undefined): Promise<void> {
	unverifiedThemeId = undefined;
	if (candidateId && isThemeId(candidateId)) {
		await themeState.setTheme(candidateId);
	} else {
		await themeState.init();
		persist();
	}
}

// ---------------------------------------------------------------------------
// Theme setting: remove (delete a user theme) and duplicate (copy any theme
// under a new id).
// ---------------------------------------------------------------------------

/**
 * Delete a user theme.
 *
 * ORDERING IS THE WHOLE POINT — switch away from the theme being deleted
 * BEFORE deleting its file, never after:
 *
 *   1. If the theme being removed is currently active, switch to the DEFAULT
 *      theme (`themeState.defaultId`) first, and persist that switch.
 *   2. Only then call `deleteUserTheme`.
 *   3. On delete failure, restore the previous theme (best-effort — see
 *      below) and toast an error.
 *   4. On success, `redetectThemes()` to reconcile the live registry (drops
 *      the now-gone theme from `themeState.all`).
 *
 * Deleting first would leave the app rendering a theme whose backing file is
 * already gone for however long the debounced file-watcher takes to notice
 * (150ms+, per `themes.rs`'s `watch_user_themes` doc comment) — and on Linux,
 * `themes.rs` documents that an inotify watch on the themes directory can be
 * lost entirely, so that reconcile might never fire this session at all.
 *
 * The switch target is unconditionally the DEFAULT theme, not "whatever was
 * active before" and not "the next/previous card in the list" — that is what
 * makes "user deletes the active theme" and "the active theme's file
 * disappears out from under the app" (handled by `redetectThemes`'s
 * `applyResolvedTheme` fallback) converge on the exact same visible outcome,
 * rather than being two different behaviors for what is, from the theme
 * system's point of view, the same event.
 *
 * If the delete call itself fails AFTER the switch already happened, the
 * switch must be undone — otherwise a failed delete has silently changed the
 * user's theme as a side effect, which is worse than the delete simply not
 * happening.
 */
async function removeThemeValue(id: string): Promise<void> {
	const meta = themeState.all.find((t) => t.id === id);
	const confirmation = await prompt.ask<"cancel" | "delete">({
		title: "Delete theme",
		body: meta ? `Delete "${meta.name}"? This can't be undone.` : `Delete this theme? This can't be undone.`,
		choices: [
			// Cancel is `primary: true` so Enter is the safe action — a delete
			// must always be a deliberate, separate confirm, never a fat-fingered
			// Enter on the wrong row.
			{ value: "cancel", label: "Cancel", primary: true },
			{ value: "delete", label: "Delete", danger: true },
		],
		cancelValue: "cancel",
	});
	if (confirmation.choice !== "delete") return;

	const wasActive = themeState.id === id;
	const previousId = themeState.id;

	if (wasActive) {
		await setThemeValue(themeState.defaultId);
	}

	const outcome = await deleteUserTheme(id).then(
		() => ({ ok: true as const }),
		(err: unknown) => ({ ok: false as const, message: err instanceof Error ? err.message : String(err) }),
	);

	if (!outcome.ok) {
		if (wasActive) {
			// Best-effort restore. If `previousId` no longer resolves either
			// (unlikely — we just had it loaded a moment ago) `setThemeValue`
			// silently no-ops via `themeState.setTheme`'s own `!meta` guard,
			// which is the same "can't apply, don't corrupt state" behavior
			// used everywhere else a theme id fails to resolve.
			await setThemeValue(previousId as ThemeId);
		}
		toast.error(`Couldn't delete theme — ${outcome.message}`);
		return;
	}

	await preferences.redetectThemes();
}

/**
 * Copy a theme's CSS under a new id via the shared naming flow.
 *
 * Source CSS selection matters: for a BUILTIN theme, `load()` is fine to call
 * directly — builtin CSS is checked-in and `load()` always resolves
 * `{ok: true}` for it (see `registry.ts`'s `builtinLoad`). For a USER theme,
 * `load()` returns SANITIZED css (see `user-theme.ts` — the sanitizer strips
 * `!important`, wraps selectors, etc.), which is exactly the wrong thing to
 * write back to disk as a new theme: re-importing it would sanitize an
 * already-sanitized (and therefore already-lossy) file a second time,
 * compounding the loss. The unsanitized source has to come from a fresh
 * `loadUserThemes()` read.
 */
async function duplicateThemeValue(id: string): Promise<void> {
	const meta = themeState.all.find((t) => t.id === id);
	if (!meta) return;

	let sourceCss: string;
	if (meta.source === "builtin") {
		const result = await meta.load();
		if (!result.ok) return; // builtins never refuse; unreachable in practice
		sourceCss = result.css;
	} else {
		const files = await loadUserThemes();
		const file = files.find((f) => f.id === id);
		if (!file) {
			toast.error(`Couldn't duplicate "${meta.name}" — its file is no longer on disk.`);
			return;
		}
		sourceCss = file.css;
	}

	await nameThemeFlow(meta.name, sourceCss);
}

/**
 * Suggest a starting NAME for the "name this theme" prompt: `sourceName`
 * unchanged when its slug isn't already taken, otherwise `sourceName` with
 * `resolveThemeId`'s numeric suffix appended — the same "-2, -3, …"
 * disambiguation the id gets, surfaced on the visible name so the field's
 * default value and its derived-id hint agree with each other the instant
 * the prompt opens (both flows that call `nameThemeFlow` — duplicate, and
 * "Keep both" on an import collision — start from a name that is, by
 * definition, already taken).
 */
function suggestThemeName(sourceName: string, taken: ReadonlySet<string>): string {
	const baseSlug = slugifyThemeId(sourceName);
	const resolvedId = resolveThemeId(baseSlug, taken);
	if (resolvedId === baseSlug) return sourceName;
	const suffix = resolvedId.slice(baseSlug.length).replace(/^-/, " ");
	return `${sourceName}${suffix}`;
}

/**
 * Shared "name this theme" flow (markdown-viewer-2ha): prompts for a NAME
 * (not an id — the field derives an id via `slugifyThemeId`, matching how
 * `deriveImportId` in Preferences.svelte already prefers frontmatter `@name`
 * over a filename), rewrites the CSS frontmatter to match via
 * `withFrontmatterName` so the saved copy's card is labelled with the chosen
 * name rather than the source's, and imports under `mode: "create-new"`.
 *
 * Shared by two call sites that are both, at the type-system level, "create a
 * second theme from CSS whose name is already taken": `duplicateThemeValue`
 * (the explicit Duplicate action) and the import-collision "Keep both" choice
 * in Preferences.svelte.
 *
 * The prompt is pre-filled with `suggestThemeName`'s auto-suffixed
 * suggestion rather than a blind " copy" suffix — the silent `-2` rename a
 * naive importer would do silently becomes a visible, editable default, so
 * the zero-thought path still costs one Enter but is a choice the user saw
 * on screen first.
 *
 * If the backend still reports `reason: "exists"` after `validate` passed
 * (the frontend's `themeState.all` can be stale relative to disk — that
 * staleness is exactly why the backend re-checks; see `ImportOutcome`'s doc
 * comment in ipc.ts), the prompt is re-opened with the backend's message
 * rather than the flow simply failing, so a stale local list doesn't turn
 * into a dead end.
 */
export async function nameThemeFlow(
	sourceName: string,
	css: string,
	retryMessage?: string,
	/**
	 * Ids the BACKEND rejected as already-existing that `themeState.all` does
	 * not know about. Threading these through the retry is what lets it make
	 * progress: `themeState.all` is rebuilt from the registry on every call and
	 * by definition never contains a disk-only id, so without this the same
	 * suggestion is re-offered and re-rejected forever — the user could hold
	 * Enter and never converge. Measured during review.
	 */
	rejected: ReadonlySet<string> = new Set(),
): Promise<void> {
	const taken = new Set([...themeState.all.map((t) => t.id), ...rejected]);

	const result = await prompt.ask<"save" | "cancel">({
		title: "Name this theme",
		body: retryMessage ?? `Name for the copy of "${sourceName}":`,
		choices: [
			{ value: "cancel", label: "Cancel", primary: true },
			{ value: "save", label: "Save" },
		],
		cancelValue: "cancel",
		input: {
			label: "Name",
			initial: suggestThemeName(sourceName, taken),
			validate: (value) => {
				const trimmed = value.trim();
				if (!trimmed) return "Name can't be empty.";
				const slug = slugifyThemeId(trimmed);
				if (slug === "theme" && trimmed.toLowerCase() !== "theme") {
					return "That name has no usable characters — try adding letters or numbers.";
				}
				if (taken.has(slug)) return `A theme called "${trimmed}" already exists.`;
				return null;
			},
			hint: (value) => {
				const trimmed = value.trim();
				if (!trimmed) return null;
				return `Will be saved as \`${slugifyThemeId(trimmed)}\``;
			},
		},
	});

	if (result.choice !== "save" || !result.value) return;

	const name = result.value.trim();
	const id = slugifyThemeId(name);
	const namedCss = withFrontmatterName(css, name);

	const outcome = await importThemeCss(id, namedCss, "create-new");
	if (outcome.ok) {
		await preferences.redetectThemes();
		return;
	}

	if (outcome.reason === "exists") {
		// The frontend's `themeState.all` said `id` was free; the backend
		// disagrees. Re-open the prompt, carrying `id` forward in `rejected` so
		// the next suggestion actually differs — see the parameter's comment.
		// Recursion is safe here despite being unbounded: every level awaits a
		// fresh `prompt.ask`, so the stack unwinds at each `await` and each
		// iteration costs one deliberate user interaction.
		await nameThemeFlow(
			sourceName,
			css,
			`"${id}" already exists on disk. Choose another name:`,
			new Set([...rejected, id]),
		);
		return;
	}

	toast.error(`Couldn't save the theme — ${outcome.message}.`);
}

const settings: SettingDef[] = $derived([
	{
		type: "theme",
		id: "theme",
		label: "Theme",
		section: "appearance",
		keywords: ["color", "dark", "light", "appearance"],
		options: themeState.all.map((t) => ({
			value: t.id,
			label: t.name,
			swatches: t.colors,
			source: t.source,
			path: t.source === "user" ? t.path : undefined,
			revision: t.source === "user" ? t.revision : undefined,
			actions: t.source === "user" ? (["duplicate", "delete"] as const) : (["duplicate"] as const),
		})),
		value: themeState.id,
		select: (value) => setThemeValue(value as ThemeId),
		remove: (value) => removeThemeValue(value),
		duplicate: (value) => duplicateThemeValue(value),
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
	/**
	 * Re-scans the user themes directory and reconciles the currently active
	 * theme against the result. Called from the debounced `user-themes-changed`
	 * listener in +page.svelte — a theme file can be deleted or edited on disk
	 * at any point mid-session, not only at launch.
	 */
	redetectThemes(): Promise<void>;
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

	async redetectThemes() {
		const discovery = await discover();
		if (!discovery.scanned) {
			// A re-scan can fail mid-session too (the directory becomes
			// unreadable, an IPC hiccup) — the currently active theme is already
			// applied and rendering fine, so there is nothing to reconcile and
			// nothing to persist. Do NOT touch `unverifiedThemeId` here: that
			// field is specifically for a stored-but-not-yet-applied id from
			// `init()`; a failed re-scan mid-session has no such pending value.
			return;
		}

		if (unverifiedThemeId !== undefined) {
			// A launch-time scan failed to resolve the user's stored id, so
			// `themeState.id` right now is only the VISUAL fallback (default) —
			// not the theme the user actually chose. This later, successful scan
			// is the first real chance to try the ORIGINAL stored id again, not
			// merely to check whether the visual fallback still resolves (it
			// always will; it's a builtin). `applyResolvedTheme` applies it if
			// discovery now finds it, or commits to the default for real
			// (persisting it) if it's genuinely gone.
			await applyResolvedTheme(unverifiedThemeId);
			return;
		}

		// No pending unverified id — reconcile the CURRENTLY ACTIVE theme
		// instead. Only take the fallback path when it actually stopped
		// resolving: a re-scan runs on every debounced `user-themes-changed`
		// event, including ones that only ADD or edit an unrelated theme, and
		// `applyResolvedTheme` would otherwise re-run `setTheme` (a full
		// re-sanitize) on the SAME still-valid id for no reason.
		if (isThemeId(themeState.id)) return;
		// The theme that resolved a moment ago (the user deleted its file, or
		// renamed it) no longer does. Already known invalid, so this call
		// always takes `applyResolvedTheme`'s fallback branch.
		await applyResolvedTheme(themeState.id);
	},

	async init() {
		// Issued BEFORE loadPreferencesFile(), not awaited yet: both are
		// independent IPC round trips (disk read vs. a themes-directory scan),
		// so starting them together lets them overlap instead of forcing
		// discovery to wait behind the preferences read. `discover()` itself is
		// awaited immediately above the `isThemeId` check below, which is the
		// only place its result is actually needed — everything between here
		// and there (migration, numeric normalization) has no dependency on it.
		const discoveryPromise = discover();

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

		// `isThemeId` is a point-in-time check against the live theme registry,
		// so discovery MUST have completed before it runs here — awaited now,
		// having been issued at the top of `init()` so its round trip overlapped
		// with the preferences-file read above rather than running after it.
		const discovery = await discoveryPromise;

		if (!discovery.scanned) {
			// The scan itself could not run (broken IPC, unreadable themes
			// directory) — this is NOT evidence the stored theme is gone, only
			// that this launch couldn't check. Apply the default so the window
			// isn't left unthemed, but keep writing the user's ORIGINAL id, so
			// a launch that merely failed to look cannot overwrite a choice
			// whose file is probably still sitting on disk. Writing the visual
			// fallback would destroy it; omitting the field would ALSO destroy
			// it, because the preferences write replaces the whole file rather
			// than merging into it. An explicit setTheme() later this session
			// releases the held id (see setThemeValue).
			unverifiedThemeId = stored.theme;
			await themeState.init();
		} else {
			// Scan succeeded — `applyResolvedTheme` both releases any id an
			// earlier failed scan was holding and applies (or falls back to and
			// persists) the freshly-parsed stored id. See its doc comment: this
			// is the SAME rule the watcher's reconciliation uses later in the
			// session, just triggered here by init() instead of a live
			// `user-themes-changed` event.
			await applyResolvedTheme(stored.theme);
		}
	},
};
