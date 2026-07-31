import type { TocHeading } from "./markdown";

/**
 * Saved scroll position for a tab.
 *
 * `headingId`/`headingOffset` anchor the position to a heading so restore
 * survives content growing above it (async mermaid diagrams, image loads) and
 * zoom changes. `top` is both the pixel fallback and the base for the delta
 * from the anchor, so sub-heading precision is preserved.
 *
 * Deliberately separate from `activeHeadingId`: that field is the TOC
 * highlight, uses a different threshold, and gets rewritten by `update()` when
 * a heading disappears — which would silently repoint the scroll anchor at the
 * top of the document.
 */
interface TabScroll {
	top: number;
	headingId: string | null;
	headingOffset: number;
}

export interface Tab {
	path: string;
	filename: string;
	content: string;
	rendered: string;
	headings: TocHeading[];
	activeHeadingId: string | null;
	scroll: TabScroll;
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
	add(tab: Omit<Tab, 'color' | 'activeHeadingId' | 'scroll'>): void;
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
	add(tab: Omit<Tab, 'color' | 'activeHeadingId' | 'scroll'>) {
		const existing = tabList.findIndex((t) => t.path === tab.path);
		if (existing >= 0) {
			activeIndex = existing;
			return;
		}
		tabList.push({
			...tab,
			activeHeadingId: tab.headings[0]?.id ?? null,
			scroll: { top: 0, headingId: null, headingOffset: 0 },
			color: nextColor(),
		});
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
