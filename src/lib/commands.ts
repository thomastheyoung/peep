import type { getPreferences, ContentWidth } from "./preferences.svelte";
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

const widthOptions: { value: ContentWidth; label: string }[] = [
	{ value: "auto", label: "Auto — optimized for reading" },
	{ value: "wide", label: "Wide — more room for code" },
	{ value: "full", label: "Full — entire window width" },
];

export function buildCommands(ctx: CommandContext): Command[] {
	const { prefs, tabs, openFileDialog, closeTab } = ctx;
	const commands: Command[] = [];

	// Theme
	commands.push({
		id: "theme",
		label: "Theme...",
		keywords: ["color", "dark", "light", "appearance"],
		detail: prefs.theme.meta?.name,
		children: () =>
			prefs.theme.all.map((t) => ({
				id: `theme:${t.id}`,
				label: t.name,
				swatches: t.colors,
				detail: t.id === prefs.theme.id ? "✓" : undefined,
				action: () => prefs.setTheme(t.id),
			})),
	});

	// Content width
	commands.push({
		id: "width",
		label: "Content width...",
		keywords: ["layout", "narrow", "wide", "full"],
		detail: prefs.contentWidth,
		children: () =>
			widthOptions.map((o) => ({
				id: `width:${o.value}`,
				label: o.label,
				detail: prefs.contentWidth === o.value ? "✓" : undefined,
				action: () => prefs.setContentWidth(o.value),
			})),
	});

	// Zoom
	const zoomDetail = `${Math.round(prefs.zoomLevel * 100)}%`;
	commands.push({
		id: "zoom-in",
		label: "Zoom in",
		keywords: ["bigger", "larger", "magnify"],
		shortcut: "⌘=",
		detail: zoomDetail,
		action: () => prefs.zoomIn(),
	});
	commands.push({
		id: "zoom-out",
		label: "Zoom out",
		keywords: ["smaller", "reduce"],
		shortcut: "⌘-",
		detail: zoomDetail,
		action: () => prefs.zoomOut(),
	});
	commands.push({
		id: "zoom-reset",
		label: "Reset zoom",
		keywords: ["100%", "default"],
		shortcut: "⌘0",
		action: () => prefs.resetZoom(),
	});

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
