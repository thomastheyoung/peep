import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Tauri invoke before importing commands
vi.mock("@tauri-apps/api/core", () => ({
	invoke: vi.fn(),
}));

import { buildCommands, type Command } from "./commands";
import type { SettingDef, ChoiceSetting, RangeSetting } from "./preferences.svelte";

function mockChoiceSetting(overrides: Partial<ChoiceSetting> = {}): ChoiceSetting {
	return {
		type: "choice",
		id: "test-choice",
		label: "Test Choice",
		section: "appearance",
		keywords: ["test"],
		options: [
			{ value: "a", label: "Alpha" },
			{ value: "b", label: "Beta" },
		],
		value: "a",
		select: vi.fn(),
		...overrides,
	};
}

function mockRangeSetting(overrides: Partial<RangeSetting> = {}): RangeSetting {
	return {
		type: "range",
		id: "zoom",
		label: "Zoom",
		section: "layout",
		keywords: ["zoom"],
		min: 0.5,
		max: 3,
		step: 0.1,
		value: 1,
		defaultValue: 1,
		set: vi.fn(),
		format: (v: number) => `${Math.round(v * 100)}%`,
		...overrides,
	};
}

/**
 * A mutable stand-in for the updater singleton.
 *
 * Returned as a plain object so tests can reassign `status` after building the
 * commands — that is what proves the palette command reads through getters
 * rather than snapshotting values.
 */
function mockUpdater(overrides: Record<string, unknown> = {}) {
	return {
		status: "idle",
		version: null,
		notes: null,
		errorMessage: null,
		progress: null,
		busy: false,
		check: vi.fn(),
		checkOnce: vi.fn(),
		install: vi.fn(),
		restart: vi.fn(),
		activate: vi.fn(),
		dismiss: vi.fn(),
		...overrides,
	};
}

function mockContext(
	settings: SettingDef[] = [],
	tabCount = 0,
	updater: Record<string, unknown> = mockUpdater()
) {
	const tabItems = Array.from({ length: tabCount }, (_, i) => ({
		path: `/${i}.md`,
		filename: `${i}.md`,
		content: "",
		rendered: "",
		color: "#fff",
	}));

	return {
		updater: updater as any,
		prefs: {
			settings,
			openPanel: vi.fn(),
		} as any,
		tabs: {
			items: tabItems,
			activeIndex: 0,
			active: tabItems[0],
			activate: vi.fn(),
		} as any,
		openFileDialog: vi.fn(),
		closeTab: vi.fn(),
	};
}

describe("buildCommands", () => {
	it("always includes open-file and preferences commands", () => {
		const commands = buildCommands(mockContext());
		const ids = commands.map((c) => c.id);
		expect(ids).toContain("open-file");
		expect(ids).toContain("preferences");
	});

	it("includes close-tab when tabs exist", () => {
		const commands = buildCommands(mockContext([], 2));
		const ids = commands.map((c) => c.id);
		expect(ids).toContain("close-tab");
		expect(ids).toContain("close-all");
	});

	it("excludes close-tab when no tabs", () => {
		const commands = buildCommands(mockContext([], 0));
		const ids = commands.map((c) => c.id);
		expect(ids).not.toContain("close-tab");
		expect(ids).not.toContain("close-all");
	});

	it("includes switch-tab when 2+ tabs exist", () => {
		const commands = buildCommands(mockContext([], 2));
		expect(commands.map((c) => c.id)).toContain("switch-tab");
	});

	it("excludes switch-tab with fewer than 2 tabs", () => {
		const commands = buildCommands(mockContext([], 1));
		expect(commands.map((c) => c.id)).not.toContain("switch-tab");
	});

	it("includes set-default-viewer command", () => {
		const commands = buildCommands(mockContext());
		expect(commands.map((c) => c.id)).toContain("set-default-viewer");
	});

	describe("choice settings → commands", () => {
		it("creates a command with children for choice settings", () => {
			const setting = mockChoiceSetting();
			const commands = buildCommands(mockContext([setting]));
			const cmd = commands.find((c) => c.id === "test-choice")!;

			expect(cmd.label).toBe("Test Choice...");
			expect(cmd.kind).toBe("parent");
			expect(cmd.detail).toBe("Alpha"); // current value label
		});

		it("children have check mark on current value", () => {
			const setting = mockChoiceSetting({ value: "b" });
			const commands = buildCommands(mockContext([setting]));
			const cmd = commands.find((c) => c.id === "test-choice")!;
			expect(cmd.kind).toBe("parent");
			if (cmd.kind !== "parent") throw new Error("expected parent");
			const children = cmd.children();

			expect(children.find((c) => c.id === "test-choice:b")!.detail).toBe("✓");
			expect(children.find((c) => c.id === "test-choice:a")!.detail).toBeUndefined();
		});

		it("child action calls select", () => {
			const setting = mockChoiceSetting();
			const commands = buildCommands(mockContext([setting]));
			const cmd = commands.find((c) => c.id === "test-choice")!;
			if (cmd.kind !== "parent") throw new Error("expected parent");
			const children = cmd.children();
			const child = children[1]!;
			if (child.kind !== "action") throw new Error("expected action");
			child.action();

			expect(setting.select).toHaveBeenCalledWith("b");
		});
	});

	describe("range settings → commands", () => {
		it("creates a command with children for range settings", () => {
			const setting = mockRangeSetting({ min: 1, max: 3, step: 1 });
			const commands = buildCommands(mockContext([setting]));
			const cmd = commands.find((c) => c.id === "zoom")!;

			expect(cmd.label).toBe("Zoom...");
			expect(cmd.kind).toBe("parent");
			if (cmd.kind !== "parent") throw new Error("expected parent");

			const children = cmd.children();
			expect(children).toHaveLength(3); // 1, 2, 3
			expect(children[0]!.label).toBe("100%");
		});
	});

	describe("zoom shortcuts", () => {
		it("creates zoom-in, zoom-out, zoom-reset commands", () => {
			const setting = mockRangeSetting();
			const commands = buildCommands(mockContext([setting]));
			const ids = commands.map((c) => c.id);

			expect(ids).toContain("zoom-in");
			expect(ids).toContain("zoom-out");
			expect(ids).toContain("zoom-reset");
		});

		it("zoom-in calls set with incremented value", () => {
			const setting = mockRangeSetting({ value: 1, step: 0.1 });
			const commands = buildCommands(mockContext([setting]));
			const zoomIn = commands.find((c) => c.id === "zoom-in")!;
			if (zoomIn.kind !== "action") throw new Error("expected action");
			zoomIn.action();

			expect(setting.set).toHaveBeenCalledWith(expect.closeTo(1.1, 5));
		});

		it("zoom-reset calls set with default value", () => {
			const setting = mockRangeSetting({ value: 2, defaultValue: 1 });
			const commands = buildCommands(mockContext([setting]));
			const zoomReset = commands.find((c) => c.id === "zoom-reset")!;
			if (zoomReset.kind !== "action") throw new Error("expected action");
			zoomReset.action();

			expect(setting.set).toHaveBeenCalledWith(1);
		});
	});

	describe("close-all action", () => {
		it("closes tabs from last to first", () => {
			const ctx = mockContext([], 3);
			const commands = buildCommands(ctx);
			const closeAll = commands.find((c) => c.id === "close-all")!;
			if (closeAll.kind !== "action") throw new Error("expected action");
			closeAll.action();

			expect(ctx.closeTab).toHaveBeenCalledTimes(3);
			// Should close in reverse order
			expect(ctx.closeTab).toHaveBeenNthCalledWith(1, 2);
			expect(ctx.closeTab).toHaveBeenNthCalledWith(2, 1);
			expect(ctx.closeTab).toHaveBeenNthCalledWith(3, 0);
		});
	});

	describe("switch-tab children", () => {
		it("lists all tabs with active marked", () => {
			const ctx = mockContext([], 3);
			const commands = buildCommands(ctx);
			const switchTab = commands.find((c) => c.id === "switch-tab")!;
			if (switchTab.kind !== "parent") throw new Error("expected parent");
			const children = switchTab.children();

			expect(children).toHaveLength(3);
			expect(children[0]!.detail).toBe("✓"); // activeIndex is 0
			expect(children[1]!.detail).toBeUndefined();
		});
	});

	describe("check-for-updates", () => {
		function updateCommand(updater: Record<string, unknown>) {
			const cmd = buildCommands(mockContext([], 0, updater)).find(
				(c) => c.id === "check-for-updates"
			);
			if (!cmd) throw new Error("expected check-for-updates command");
			return cmd;
		}

		// Membership is fixed when the palette snapshots the array, so the
		// command must never be pushed conditionally. If someone wraps it in an
		// `if`, this fails.
		it.each([
			"idle",
			"checking",
			"up-to-date",
			"available",
			"downloading",
			"ready",
			"relaunching",
			"error",
		])("is present when status is %s", (status) => {
			expect(updateCommand(mockUpdater({ status }))).toBeDefined();
		});

		// Guards the `previewThemeId` split in CommandPalette, which treats a
		// two-part id as a theme id.
		it("uses an id with no colon", () => {
			expect(updateCommand(mockUpdater()).id).not.toContain(":");
		});

		it("labels by status", () => {
			expect(updateCommand(mockUpdater()).label).toBe("Check for updates");
			expect(updateCommand(mockUpdater({ status: "checking" })).label).toBe(
				"Checking for updates…"
			);
			expect(
				updateCommand(mockUpdater({ status: "available", version: "1.2.3" })).label
			).toBe("Download update 1.2.3");
			expect(updateCommand(mockUpdater({ status: "ready" })).label).toBe(
				"Restart to finish update"
			);
		});

		it("details by status", () => {
			expect(updateCommand(mockUpdater({ status: "up-to-date" })).detail).toBe("Up to date");
			expect(
				updateCommand(mockUpdater({ status: "downloading", progress: 0.5 })).detail
			).toBe("50%");
			// Unknown Content-Length must not render as NaN%.
			expect(
				updateCommand(mockUpdater({ status: "downloading", progress: null })).detail
			).toBe("…");
			expect(updateCommand(mockUpdater({ status: "error" })).detail).toBe("Failed");
			expect(updateCommand(mockUpdater()).detail).toBeUndefined();
		});

		/*
		 * The highest-value test here. `label`/`detail` must be getters so the
		 * palette row tracks state that changes after the snapshot was taken.
		 * Replacing them with plain values would compile, typecheck, and pass
		 * every other test while silently producing a permanently stale row.
		 */
		it("reads status through getters, not a snapshot", () => {
			const updater = mockUpdater();
			const cmd = updateCommand(updater);
			expect(cmd.label).toBe("Check for updates");

			updater.status = "ready";
			expect(cmd.label).toBe("Restart to finish update");

			updater.status = "downloading";
			updater.progress = 0.42;
			expect(cmd.detail).toBe("42%");
		});

		/*
		 * Status dispatch lives on the updater singleton, not here, so the
		 * titlebar badge and this command cannot disagree about what a click
		 * means. Re-inlining the switch would silently reintroduce that drift.
		 */
		it("delegates to activate rather than dispatching on status itself", async () => {
			const updater = mockUpdater({ status: "available" });
			const cmd = updateCommand(updater);
			if (cmd.kind === "parent") throw new Error("expected action");

			await cmd.action();

			expect(updater.activate).toHaveBeenCalledOnce();
			expect(updater.install).not.toHaveBeenCalled();
			expect(updater.check).not.toHaveBeenCalled();
			expect(updater.restart).not.toHaveBeenCalled();
		});
	});
});
