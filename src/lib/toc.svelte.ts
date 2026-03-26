import { tabs } from "./tabs.svelte";

export interface TocAPI {
	readonly headings: import("./markdown").TocHeading[];
	readonly activeId: string | null;
	readonly hasHeadings: boolean;
	setActiveId(id: string | null): void;
	clear(): void;
}

export const toc: TocAPI = {
	get headings() {
		return tabs.active?.headings ?? [];
	},
	get activeId() {
		return tabs.active?.activeHeadingId ?? null;
	},
	get hasHeadings() {
		return (tabs.active?.headings.length ?? 0) > 0;
	},
	setActiveId(id: string | null) {
		tabs.setActiveHeadingId(id);
	},
	clear() {
		tabs.setActiveHeadingId(null);
	},
};
