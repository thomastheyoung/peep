import type { Command } from "./commands";

interface Level {
	commands: Command[];
	title: string;
}

let open = $state(false);
let query = $state("");
let selectedIndex = $state(0);
let stack = $state<Level[]>([]);

const filtered: Command[] = $derived.by(() => {
	const level = stack[stack.length - 1];
	if (!level) return [];
	const q = query.toLowerCase();
	if (!q) return level.commands;
	return level.commands.filter((cmd) => {
		if (cmd.label.toLowerCase().includes(q)) return true;
		return cmd.keywords?.some((k) => k.toLowerCase().includes(q)) ?? false;
	});
});

function close() {
	open = false;
	query = "";
	selectedIndex = 0;
	stack = [];
}

export function getCommandPalette() {
	return {
		get open() {
			return open;
		},
		get query() {
			return query;
		},
		get selectedIndex() {
			return selectedIndex;
		},
		get currentLevel(): Level | undefined {
			return stack[stack.length - 1];
		},
		get depth() {
			return stack.length;
		},
		get filtered() {
			return filtered;
		},

		show(commands: Command[]) {
			stack = [{ commands, title: "Commands" }];
			query = "";
			selectedIndex = 0;
			open = true;
		},
		close,
		back() {
			if (stack.length > 1) {
				stack.pop();
				stack = [...stack];
				query = "";
				selectedIndex = 0;
			} else {
				close();
			}
		},
		drillIn(children: Command[], title: string) {
			stack = [...stack, { commands: children, title }];
			query = "";
			selectedIndex = 0;
		},
		setQuery(q: string) {
			query = q;
			selectedIndex = 0;
		},
		setSelectedIndex(i: number) {
			selectedIndex = i;
		},
	};
}
