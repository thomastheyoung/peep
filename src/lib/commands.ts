import { invoke } from "@tauri-apps/api/core";
import type { getPreferences } from "./preferences.svelte";
import type { SettingDef, RangeSetting } from "./preferences.svelte";
import type { getTabs } from "./tabs.svelte";

export interface Command {
	id: string;
	label: string;
	/** Additional search terms (not displayed) */
	keywords?: string[];
	/** Shortcut hint shown right-aligned, e.g. "⌘O" */
	shortcut?: string;
	/** Right-side detail text */
	detail?: string;
	/** Color swatches for theme items */
	swatches?: { bg: string; text: string; accent: string };
	/** If present, selecting this item drills into a sub-list */
	children?: () => Command[];
	/** Action to execute. Absent if item has children. */
	action?: () => void | Promise<void>;
}

interface CommandContext {
	prefs: ReturnType<typeof getPreferences>;
	tabs: ReturnType<typeof getTabs>;
	openFileDialog: () => void;
	closeTab: (index: number) => void;
}

/** Generate all discrete steps for a range setting */
function rangeSteps(s: RangeSetting): number[] {
	const steps: number[] = [];
	for (let v = s.min; v <= s.max + s.step / 2; v += s.step) {
		steps.push(Math.round(v * 1000) / 1000);
	}
	return steps;
}

function commandFromSetting(setting: SettingDef): Command {
	if (setting.type === "choice") {
		const current = setting.options.find((o) => o.value === setting.value);
		return {
			id: setting.id,
			label: `${setting.label}...`,
			keywords: setting.keywords,
			detail: current?.label,
			children: () =>
				setting.options.map((o) => ({
					id: `${setting.id}:${o.value}`,
					label: o.label,
					swatches: o.swatches,
					detail: setting.value === o.value ? "✓" : undefined,
					action: () => setting.select(o.value),
				})),
		};
	}

	// Range → drill-in showing discrete steps
	return {
		id: setting.id,
		label: `${setting.label}...`,
		keywords: setting.keywords,
		detail: setting.format(setting.value),
		children: () =>
			rangeSteps(setting).map((v) => ({
				id: `${setting.id}:${v}`,
				label: setting.format(v),
				detail: v === setting.value ? "✓" : undefined,
				action: () => setting.set(v),
			})),
	};
}

// Shortcuts for zoom — keep as top-level commands for discoverability
const ZOOM_SHORTCUTS: { suffix: string; label: string; shortcut: string; delta: number | null }[] = [
	{ suffix: "in", label: "Zoom in", shortcut: "⌘=", delta: 1 },
	{ suffix: "out", label: "Zoom out", shortcut: "⌘-", delta: -1 },
	{ suffix: "reset", label: "Reset zoom", shortcut: "⌘0", delta: null },
];

export function buildCommands(ctx: CommandContext): Command[] {
	const { prefs, tabs, openFileDialog, closeTab } = ctx;
	const commands: Command[] = [];

	// Generate commands from the settings registry
	for (const setting of prefs.settings) {
		commands.push(commandFromSetting(setting));
	}

	// Zoom shortcuts as top-level commands (in addition to the drill-in)
	const zoomSetting = prefs.settings.find((s) => s.id === "zoom") as RangeSetting | undefined;
	if (zoomSetting) {
		const zoomDetail = zoomSetting.format(zoomSetting.value);
		for (const z of ZOOM_SHORTCUTS) {
			commands.push({
				id: `zoom-${z.suffix}`,
				label: z.label,
				keywords: ["zoom"],
				shortcut: z.shortcut,
				detail: z.delta != null ? zoomDetail : undefined,
				action: z.delta != null
					? () => zoomSetting.set(zoomSetting.value + z.delta! * zoomSetting.step)
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
		action: openFileDialog,
	});

	if (tabs.items.length > 0) {
		commands.push({
			id: "close-tab",
			label: "Close tab",
			shortcut: "⌘W",
			action: () => closeTab(tabs.activeIndex),
		});
		commands.push({
			id: "close-all",
			label: "Close all tabs",
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
			children: () =>
				tabs.items.map((tab, i) => ({
					id: `tab:${tab.path}`,
					label: tab.filename,
					detail: i === tabs.activeIndex ? "✓" : undefined,
					action: () => tabs.activate(i),
				})),
		});
	}

	// System
	commands.push({
		id: "set-default-viewer",
		label: "Set as default markdown viewer",
		keywords: ["default", "finder", "associate", "open with", "system"],
		action: async () => {
			const isDefault = await invoke<boolean>("is_default_markdown_viewer");
			if (isDefault) return;
			await invoke("set_default_markdown_viewer");
		},
	});

	// Preferences
	commands.push({
		id: "preferences",
		label: "Preferences",
		keywords: ["settings", "options", "configure"],
		shortcut: "⌘,",
		action: () => prefs.openPanel(),
	});

	return commands;
}
