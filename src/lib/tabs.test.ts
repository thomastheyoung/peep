import { describe, it, expect, beforeEach } from "vitest";
import { tabs } from "./tabs.svelte";

function makeTab(path: string, filename?: string) {
	return {
		path,
		filename: filename ?? path.split("/").pop()!,
		content: `# ${path}`,
		rendered: `<h1>${path}</h1>`,
		headings: [],
	};
}

describe("tabs", () => {
	beforeEach(() => {
		// Drain any leftover tabs from previous tests (module-level singleton)
		while (tabs.items.length > 0) tabs.close(0);
	});

	describe("add", () => {
		it("adds a tab and sets it active", () => {
			tabs.add(makeTab("/a.md"));
			expect(tabs.items).toHaveLength(1);
			expect(tabs.activeIndex).toBe(0);
			expect(tabs.active?.path).toBe("/a.md");
		});

		it("assigns a color from the palette", () => {
			tabs.add(makeTab("/a.md"));
			expect(tabs.items[0]!.color).toBeTruthy();
		});

		it("activates last added tab", () => {
			tabs.add(makeTab("/a.md"));
			tabs.add(makeTab("/b.md"));
			expect(tabs.activeIndex).toBe(1);
			expect(tabs.active?.path).toBe("/b.md");
		});

		it("does not duplicate — activates existing tab instead", () => {
			tabs.add(makeTab("/a.md"));
			tabs.add(makeTab("/b.md"));
			tabs.add(makeTab("/a.md"));
			expect(tabs.items).toHaveLength(2);
			expect(tabs.activeIndex).toBe(0);
		});

		it("preserves scroll when reopening an already-open file", () => {
			tabs.add(makeTab("/a.md"));
			tabs.items[0]!.scroll.top = 750;
			tabs.add(makeTab("/b.md"));
			tabs.add(makeTab("/a.md")); // dedup path — bypasses activate()
			expect(tabs.active?.scroll.top).toBe(750);
		});

		it("starts with a zeroed scroll position", () => {
			tabs.add(makeTab("/a.md"));
			expect(tabs.items[0]!.scroll).toEqual({
				top: 0,
				headingId: null,
				headingOffset: 0,
			});
		});

		it("cycles through 8 colors", () => {
			const colors = new Set<string>();
			for (let i = 0; i < 9; i++) {
				tabs.add(makeTab(`/${i}.md`));
				colors.add(tabs.items[i]!.color);
			}
			// 8 unique colors, 9th wraps around
			expect(colors.size).toBe(8);
		});
	});

	describe("close", () => {
		it("removes the tab at given index", () => {
			tabs.add(makeTab("/a.md"));
			tabs.add(makeTab("/b.md"));
			tabs.close(0);
			expect(tabs.items).toHaveLength(1);
			expect(tabs.items[0]!.path).toBe("/b.md");
		});

		it("adjusts activeIndex when closing before active", () => {
			tabs.add(makeTab("/a.md"));
			tabs.add(makeTab("/b.md"));
			tabs.add(makeTab("/c.md"));
			// active is 2 (c.md)
			tabs.close(0);
			expect(tabs.activeIndex).toBe(1); // shifted left
		});

		it("clamps activeIndex when closing the last tab that was active", () => {
			tabs.add(makeTab("/a.md"));
			tabs.add(makeTab("/b.md"));
			// active is 1
			tabs.close(1);
			expect(tabs.activeIndex).toBe(0);
		});

		it("handles closing the only tab", () => {
			tabs.add(makeTab("/a.md"));
			tabs.close(0);
			expect(tabs.items).toHaveLength(0);
			expect(tabs.activeIndex).toBe(0);
			expect(tabs.active).toBeUndefined();
		});

		it("ignores out-of-bounds index", () => {
			tabs.add(makeTab("/a.md"));
			tabs.close(-1);
			tabs.close(5);
			expect(tabs.items).toHaveLength(1);
		});

		it("changes the active tab without changing activeIndex", () => {
			// Closing the active tab at index 0 leaves activeIndex at 0 while a
			// different document becomes active — scroll restore must key on tab
			// identity, not on activeIndex, or it will not fire here.
			tabs.add(makeTab("/a.md"));
			tabs.add(makeTab("/b.md"));
			tabs.activate(0);
			tabs.close(0);
			expect(tabs.activeIndex).toBe(0);
			expect(tabs.active?.path).toBe("/b.md");
		});

		it("keeps other tabs' scroll positions intact", () => {
			tabs.add(makeTab("/a.md"));
			tabs.add(makeTab("/b.md"));
			tabs.items[1]!.scroll.top = 420;
			tabs.close(0);
			expect(tabs.items[0]!.scroll.top).toBe(420);
		});
	});

	describe("activate", () => {
		it("sets the active index", () => {
			tabs.add(makeTab("/a.md"));
			tabs.add(makeTab("/b.md"));
			tabs.activate(0);
			expect(tabs.activeIndex).toBe(0);
		});

		it("ignores out-of-bounds index", () => {
			tabs.add(makeTab("/a.md"));
			tabs.activate(5);
			expect(tabs.activeIndex).toBe(0);
			tabs.activate(-1);
			expect(tabs.activeIndex).toBe(0);
		});
	});

	describe("update", () => {
		it("updates content and rendered for matching path", () => {
			tabs.add(makeTab("/a.md"));
			tabs.update("/a.md", "new content", "<p>new</p>");
			expect(tabs.items[0]!.content).toBe("new content");
			expect(tabs.items[0]!.rendered).toBe("<p>new</p>");
		});

		it("does nothing for unknown path", () => {
			tabs.add(makeTab("/a.md"));
			tabs.update("/unknown.md", "x", "y");
			expect(tabs.items[0]!.content).toBe("# /a.md");
		});

		it("preserves scroll position across a live reload", () => {
			tabs.add(makeTab("/a.md"));
			tabs.items[0]!.scroll = { top: 900, headingId: "intro", headingOffset: 850 };
			tabs.update("/a.md", "new content", "<p>new</p>", []);
			expect(tabs.items[0]!.scroll).toEqual({
				top: 900,
				headingId: "intro",
				headingOffset: 850,
			});
		});
	});
});
