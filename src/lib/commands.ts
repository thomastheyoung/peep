import { invoke } from "@tauri-apps/api/core";
import type { SettingDef, RangeSetting, PreferencesAPI } from "./preferences.svelte";
import type { TabsAPI } from "./tabs.svelte";
import type { UpdaterAPI } from "./updater.svelte";
import type { ThemeColors } from "./themes/parse-theme-css";

interface CommandBase {
	id: string;
	label: string;
	/** Additional search terms (not displayed) */
	keywords?: string[];
	/** Shortcut hint shown right-aligned, e.g. "⌘O" */
	shortcut?: string;
	/** Right-side detail text */
	detail?: string;
	/** Color swatches for theme items */
	swatches?: ThemeColors;
}

interface ParentCommand extends CommandBase {
	kind: 'parent';
	children: () => Command[];
}

interface ActionCommand extends CommandBase {
	kind: 'action';
	action: () => void | Promise<void>;
}

export type Command = ParentCommand | ActionCommand;

interface CommandContext {
	prefs: PreferencesAPI;
	tabs: TabsAPI;
	updater: UpdaterAPI;
	openFileDialog: () => void;
	closeTab: (index: number) => void;
}

/** Generate all discrete steps for a range setting */
function rangeSteps(s: RangeSetting): number[] {
	const count = Math.round((s.max - s.min) / s.step);
	return Array.from({ length: count + 1 }, (_, i) =>
		Math.round((s.min + i * s.step) * 1000) / 1000
	);
}

function commandFromSetting(setting: SettingDef): Command {
	switch (setting.type) {
		case "choice": {
			const current = setting.options.find((o) => o.value === setting.value);
			return {
				id: setting.id,
				label: `${setting.label}...`,
				keywords: setting.keywords,
				detail: current?.label,
				kind: 'parent',
				children: () =>
					setting.options.map((o) => ({
						id: `${setting.id}:${o.value}`,
						label: o.label,
						swatches: o.swatches,
						detail: setting.value === o.value ? "✓" : undefined,
						kind: 'action' as const,
						action: () => setting.select(o.value),
					})),
			};
		}
		case "range":
			return {
				id: setting.id,
				label: `${setting.label}...`,
				keywords: setting.keywords,
				detail: setting.format(setting.value),
				kind: 'parent',
				children: () =>
					rangeSteps(setting).map((v) => ({
						id: `${setting.id}:${v}`,
						label: setting.format(v),
						detail: v === setting.value ? "✓" : undefined,
						kind: 'action' as const,
						action: () => setting.set(v),
					})),
			};
		default: {
			const _exhaustive: never = setting;
			throw new Error(`Unknown setting type: ${(_exhaustive as SettingDef).type}`);
		}
	}
}

// Shortcuts for zoom — keep as top-level commands for discoverability
const ZOOM_SHORTCUTS: { suffix: string; label: string; shortcut: string; delta: number | null }[] = [
	{ suffix: "in", label: "Zoom in", shortcut: "⌘=", delta: 1 },
	{ suffix: "out", label: "Zoom out", shortcut: "⌘-", delta: -1 },
	{ suffix: "reset", label: "Reset zoom", shortcut: "⌘0", delta: null },
];

export function buildCommands(ctx: CommandContext): Command[] {
	const { prefs, tabs, updater, openFileDialog, closeTab } = ctx;
	const commands: Command[] = [];

	// Generate commands from the settings registry
	for (const setting of prefs.settings) {
		commands.push(commandFromSetting(setting));
	}

	// Zoom shortcuts as top-level commands (in addition to the drill-in)
	const zoomSetting = prefs.settings.find((s): s is RangeSetting => s.type === "range" && s.id === "zoom");
	if (zoomSetting) {
		const zoomDetail = zoomSetting.format(zoomSetting.value);
		for (const z of ZOOM_SHORTCUTS) {
			const delta = z.delta;
			commands.push({
				id: `zoom-${z.suffix}`,
				label: z.label,
				keywords: ["zoom"],
				shortcut: z.shortcut,
				detail: delta != null ? zoomDetail : undefined,
				kind: 'action',
				action: delta != null
					? () => zoomSetting.set(zoomSetting.value + delta * zoomSetting.step)
					: () => zoomSetting.set(zoomSetting.defaultValue),
			});
		}
	}

	// File operations
	commands.push({
		id: "open-file",
		label: "Open file",
		keywords: ["browse", "add"],
		shortcut: "⌘O",
		kind: 'action',
		action: openFileDialog,
	});

	if (tabs.items.length > 0) {
		commands.push({
			id: "close-tab",
			label: "Close tab",
			shortcut: "⌘W",
			kind: 'action',
			action: () => closeTab(tabs.activeIndex),
		});
		commands.push({
			id: "close-all",
			label: "Close all tabs",
			kind: 'action',
			action: () => {
				for (let i = tabs.items.length - 1; i >= 0; i--) closeTab(i);
			},
		});
	}

	// Tab switching
	if (tabs.items.length >= 2) {
		commands.push({
			id: "switch-tab",
			label: "Switch tab...",
			keywords: ["go to", "navigate"],
			kind: 'parent',
			children: () =>
				tabs.items.map((tab, i) => ({
					id: `tab:${tab.path}`,
					label: tab.filename,
					detail: i === tabs.activeIndex ? "✓" : undefined,
					kind: 'action' as const,
					action: () => tabs.activate(i),
				})),
		});
	}

	// System
	commands.push({
		id: "set-default-viewer",
		label: "Set as default markdown viewer",
		keywords: ["default", "finder", "associate", "open with", "system"],
		kind: 'action',
		action: async () => {
			const isDefault = await invoke<boolean>("is_default_markdown_viewer");
			if (isDefault) return;
			await invoke("set_default_markdown_viewer");
		},
	});

	// Updates.
	//
	// The palette snapshots this array when it opens, so anything read eagerly
	// here would be frozen for the lifetime of that snapshot. Reading `updater`
	// inside a getter defers the read to template render time, where it
	// registers as a reactive dependency of the row and updates live.
	//
	// Push unconditionally: getters make a command's *contents* reactive, never
	// its membership. Wrapping this in an `if` would freeze presence instead.
	//
	// The id must stay constant (it keys the `{#each}`) and contain no colon
	// (CommandPalette parses two-part ids as theme ids).
	commands.push({
		id: "check-for-updates",
		get label() {
			switch (updater.status) {
				case "checking":
					return "Checking for updates…";
				case "available":
					return `Download update ${updater.version ?? ""}`.trim();
				case "downloading":
					return "Downloading update…";
				case "ready":
					return "Restart to finish update";
				case "relaunching":
					return "Restarting…";
				default:
					return "Check for updates";
			}
		},
		get detail() {
			switch (updater.status) {
				case "up-to-date":
					return "Up to date";
				case "downloading": {
					const p = updater.progress;
					return p == null ? "…" : `${Math.round(p * 100)}%`;
				}
				case "error":
					return "Failed";
				default:
					return undefined;
			}
		},
		keywords: ["update", "upgrade", "version", "release", "install"],
		kind: 'action',
		action: () => updater.activate(),
	});

	// Preferences
	commands.push({
		id: "preferences",
		label: "Preferences",
		keywords: ["settings", "options", "configure"],
		shortcut: "⌘,",
		kind: 'action',
		action: () => prefs.openPanel(),
	});

	return commands;
}
