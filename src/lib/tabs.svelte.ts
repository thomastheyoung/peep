import type { TocHeading } from "./markdown";

interface Tab {
	path: string;
	filename: string;
	content: string;
	rendered: string;
	headings: TocHeading[];
	activeHeadingId: string | null;
	color: string;
}

const TAB_COLORS = ['#fde047', '#f472b6', '#67e8f9', '#a78bfa', '#86efac', '#fdba74', '#f87171', '#22d3ee'] as const;
let colorIndex = 0;

function nextColor(): string {
	const color = TAB_COLORS[colorIndex % TAB_COLORS.length]!;
	colorIndex++;
	return color;
}

export interface TabsAPI {
	readonly items: Tab[];
	readonly activeIndex: number;
	readonly active: Tab | undefined;
	add(tab: Omit<Tab, 'color' | 'activeHeadingId'>): void;
	update(path: string, content: string, rendered: string, headings: TocHeading[]): void;
	close(index: number): void;
	activate(index: number): void;
	setActiveHeadingId(id: string | null): void;
}

let tabList = $state<Tab[]>([]);
let activeIndex = $state(0);

export const tabs: TabsAPI = {
	get items() {
		return tabList;
	},
	get activeIndex() {
		return activeIndex;
	},
	get active(): Tab | undefined {
		return tabList[activeIndex];
	},
	add(tab: Omit<Tab, 'color' | 'activeHeadingId'>) {
		const existing = tabList.findIndex((t) => t.path === tab.path);
		if (existing >= 0) {
			activeIndex = existing;
			return;
		}
		tabList.push({ ...tab, activeHeadingId: tab.headings[0]?.id ?? null, color: nextColor() });
		activeIndex = tabList.length - 1;
	},
	update(path: string, content: string, rendered: string, headings: TocHeading[]) {
		const idx = tabList.findIndex((t) => t.path === path);
		if (idx < 0) return;
		const existing = tabList[idx];
		if (!existing) return;
		existing.content = content;
		existing.rendered = rendered;
		existing.headings = headings;
		if (existing.activeHeadingId && !headings.some((h) => h.id === existing.activeHeadingId)) {
			existing.activeHeadingId = headings[0]?.id ?? null;
		}
	},
	close(index: number) {
		if (index < 0 || index >= tabList.length) return;
		tabList.splice(index, 1);
		if (index < activeIndex) {
			activeIndex--;
		} else if (activeIndex >= tabList.length) {
			activeIndex = Math.max(0, tabList.length - 1);
		}
	},
	activate(index: number) {
		if (index < 0 || index >= tabList.length) return;
		activeIndex = index;
	},
	setActiveHeadingId(id: string | null) {
		const tab = tabList[activeIndex];
		if (tab) tab.activeHeadingId = id;
	},
};
