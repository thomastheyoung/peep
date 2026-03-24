import { describe, it, expect, beforeEach } from "vitest";
import { getCommandPalette } from "./command-palette.svelte";
import type { Command } from "./commands";

const fakeCommands: Command[] = [
	{ id: "a", label: "Alpha", action: () => {} },
	{ id: "b", label: "Beta", action: () => {} },
	{
		id: "c",
		label: "Charlie",
		children: () => [
			{ id: "c1", label: "Child 1", action: () => {} },
			{ id: "c2", label: "Child 2", action: () => {} },
		],
	},
];

describe("command-palette", () => {
	let palette: ReturnType<typeof getCommandPalette>;

	beforeEach(() => {
		palette = getCommandPalette();
		// Ensure closed state
		palette.close();
	});

	describe("show / close", () => {
		it("opens with commands and resets state", () => {
			palette.show(fakeCommands);
			expect(palette.open).toBe(true);
			expect(palette.currentLevel?.commands).toStrictEqual(fakeCommands);
			expect(palette.query).toBe("");
			expect(palette.selectedIndex).toBe(0);
			expect(palette.depth).toBe(1);
		});

		it("closes and resets all state", () => {
			palette.show(fakeCommands);
			palette.setQuery("test");
			palette.setSelectedIndex(2);
			palette.close();

			expect(palette.open).toBe(false);
			expect(palette.query).toBe("");
			expect(palette.selectedIndex).toBe(0);
			expect(palette.depth).toBe(0);
			expect(palette.currentLevel).toBeUndefined();
		});
	});

	describe("drillIn / back", () => {
		it("pushes a new level onto the stack", () => {
			palette.show(fakeCommands);
			const children = fakeCommands[2]!.children!();
			palette.drillIn(children, "Charlie");

			expect(palette.depth).toBe(2);
			expect(palette.currentLevel?.title).toBe("Charlie");
			expect(palette.currentLevel?.commands).toStrictEqual(children);
			expect(palette.query).toBe("");
			expect(palette.selectedIndex).toBe(0);
		});

		it("back pops the top level", () => {
			palette.show(fakeCommands);
			palette.drillIn(fakeCommands[2]!.children!(), "Charlie");
			palette.back();

			expect(palette.depth).toBe(1);
			expect(palette.currentLevel?.title).toBe("Commands");
		});

		it("back on root level closes the palette", () => {
			palette.show(fakeCommands);
			palette.back();

			expect(palette.open).toBe(false);
			expect(palette.depth).toBe(0);
		});

		it("back resets query and selectedIndex", () => {
			palette.show(fakeCommands);
			palette.drillIn(fakeCommands[2]!.children!(), "Charlie");
			palette.setQuery("child");
			palette.setSelectedIndex(1);
			palette.back();

			expect(palette.query).toBe("");
			expect(palette.selectedIndex).toBe(0);
		});
	});

	describe("setQuery / setSelectedIndex", () => {
		it("updates query and resets selectedIndex", () => {
			palette.show(fakeCommands);
			palette.setSelectedIndex(2);
			palette.setQuery("new query");

			expect(palette.query).toBe("new query");
			expect(palette.selectedIndex).toBe(0); // reset on query change
		});

		it("sets selectedIndex directly", () => {
			palette.show(fakeCommands);
			palette.setSelectedIndex(2);
			expect(palette.selectedIndex).toBe(2);
		});
	});

	describe("multiple drill-in levels", () => {
		it("supports deep nesting and back traversal", () => {
			palette.show(fakeCommands);
			palette.drillIn([{ id: "d", label: "Deep", action: () => {} }], "Level 2");
			palette.drillIn([{ id: "e", label: "Deeper", action: () => {} }], "Level 3");

			expect(palette.depth).toBe(3);
			expect(palette.currentLevel?.title).toBe("Level 3");

			palette.back();
			expect(palette.depth).toBe(2);
			expect(palette.currentLevel?.title).toBe("Level 2");

			palette.back();
			expect(palette.depth).toBe(1);
			expect(palette.currentLevel?.title).toBe("Commands");
		});
	});
});
