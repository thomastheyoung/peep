import type { TocHeading } from "./markdown";

let headings = $state<TocHeading[]>([]);
let activeId = $state<string | null>(null);

export function getToc() {
	return {
		get headings() {
			return headings;
		},
		get activeId() {
			return activeId;
		},
		get hasHeadings() {
			return headings.length > 0;
		},
		setHeadings(h: TocHeading[]) {
			headings = h;
			activeId = h[0]?.id ?? null;
		},
		setActiveId(id: string | null) {
			activeId = id;
		},
		clear() {
			headings = [];
			activeId = null;
		},
	};
}
