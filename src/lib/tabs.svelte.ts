export interface Tab {
	path: string;
	filename: string;
	content: string;
	rendered: string;
	color: string;
}

const TAB_COLORS = ['#fde047', '#f472b6', '#67e8f9', '#a78bfa', '#86efac', '#fdba74', '#f87171', '#22d3ee'];
let colorIndex = 0;

function nextColor(): string {
	const color = TAB_COLORS[colorIndex % TAB_COLORS.length]!;
	colorIndex++;
	return color;
}

let tabs = $state<Tab[]>([]);
let activeIndex = $state(0);

export function getTabs() {
	return {
		get items() {
			return tabs;
		},
		get activeIndex() {
			return activeIndex;
		},
		get active(): Tab | undefined {
			return tabs[activeIndex];
		},
		add(tab: Omit<Tab, 'color'>) {
			const existing = tabs.findIndex((t) => t.path === tab.path);
			if (existing >= 0) {
				activeIndex = existing;
				return;
			}
			tabs.push({ ...tab, color: nextColor() });
			activeIndex = tabs.length - 1;
		},
		update(path: string, content: string, rendered: string) {
			const idx = tabs.findIndex((t) => t.path === path);
			if (idx < 0) return;
			const existing = tabs[idx];
			if (!existing) return;
			existing.content = content;
			existing.rendered = rendered;
		},
		close(index: number) {
			if (index < 0 || index >= tabs.length) return;
			tabs.splice(index, 1);
			if (index < activeIndex) {
				activeIndex--;
			} else if (activeIndex >= tabs.length) {
				activeIndex = Math.max(0, tabs.length - 1);
			}
		},
		activate(index: number) {
			if (index < 0 || index >= tabs.length) return;
			activeIndex = index;
		},
	};
}
