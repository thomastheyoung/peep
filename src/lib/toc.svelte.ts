import { getTabs } from "./tabs.svelte";

export function getToc() {
	const tabs = getTabs();

	return {
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
			if (tabs.active) {
				tabs.active.activeHeadingId = id;
			}
		},
		clear() {
			if (tabs.active) {
				tabs.active.activeHeadingId = null;
			}
		},
	};
}
