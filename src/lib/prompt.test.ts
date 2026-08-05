import { describe, it, expect, beforeEach } from "vitest";
import { prompt } from "./prompt.svelte";

// Component-level focus/top-layer behaviour (native <dialog> showModal(),
// autofocus, Escape not bubbling past the `oncancel` handler) is NOT
// asserted here — jsdom's <dialog>/showModal support is partial (no real
// top layer, no focus trap), so any assertion of that behaviour in jsdom
// would pass or fail for the wrong reason. See sanitize-theme-css.test.ts's
// header for the same house rule applied elsewhere in this repo. Those
// paths need a real-browser check (this repo's playwright devDependency).

describe("prompt", () => {
	beforeEach(() => {
		// Drain any pending prompt left over from a previous test so state
		// doesn't leak across tests via the module-level singleton.
		while (prompt.current) prompt.cancel();
	});

	it("resolves with the chosen value", async () => {
		const result = prompt.ask({
			title: "Delete file?",
			choices: [
				{ value: "cancel", label: "Cancel", primary: true },
				{ value: "delete", label: "Delete", danger: true },
			],
			cancelValue: "cancel",
		});
		expect(prompt.current?.title).toBe("Delete file?");
		prompt.resolve("delete");
		await expect(result).resolves.toEqual({ choice: "delete", value: undefined });
	});

	it("resolves cancelValue on cancel()", async () => {
		const result = prompt.ask({
			title: "Delete file?",
			choices: [
				{ value: "keep", label: "Keep" },
				{ value: "delete", label: "Delete" },
			],
			cancelValue: "keep",
		});
		prompt.cancel();
		await expect(result).resolves.toEqual({ choice: "keep", value: undefined });
	});

	it("never rejects, even when cancelled", async () => {
		const result = prompt.ask({
			title: "Anything",
			choices: [{ value: "ok", label: "OK", primary: true }],
			cancelValue: "ok",
		});
		prompt.cancel();
		await expect(result).resolves.not.toThrow();
	});

	it("queues a second ask() instead of throwing", async () => {
		const first = prompt.ask({
			title: "First",
			choices: [{ value: "ok", label: "OK", primary: true }],
			cancelValue: "ok",
		});
		const second = prompt.ask({
			title: "Second",
			choices: [{ value: "ok", label: "OK", primary: true }],
			cancelValue: "ok",
		});

		// Second request must not be shown yet.
		expect(prompt.current?.title).toBe("First");

		prompt.resolve("ok");
		await expect(first).resolves.toEqual({ choice: "ok", value: undefined });

		// Now the second one should have become current.
		expect(prompt.current?.title).toBe("Second");
		prompt.resolve("ok");
		await expect(second).resolves.toEqual({ choice: "ok", value: undefined });
	});

	it("queues multiple asks in call order", async () => {
		const results: string[] = [];
		const a = prompt.ask({
			title: "A",
			choices: [{ value: "ok", label: "OK", primary: true }],
			cancelValue: "ok",
		});
		const b = prompt.ask({
			title: "B",
			choices: [{ value: "ok", label: "OK", primary: true }],
			cancelValue: "ok",
		});
		const c = prompt.ask({
			title: "C",
			choices: [{ value: "ok", label: "OK", primary: true }],
			cancelValue: "ok",
		});

		a.then(() => results.push("A"));
		b.then(() => results.push("B"));
		c.then(() => results.push("C"));

		prompt.resolve("ok");
		await Promise.resolve();
		prompt.resolve("ok");
		await Promise.resolve();
		prompt.resolve("ok");
		await Promise.all([a, b, c]);

		expect(results).toEqual(["A", "B", "C"]);
	});

	it("returns the input value alongside the choice", async () => {
		const result = prompt.ask({
			title: "Name this theme",
			choices: [{ value: "save", label: "Save", primary: true }],
			input: { label: "Name", initial: "My Theme" },
			cancelValue: "save",
		});
		prompt.resolve("save", "Renamed Theme");
		await expect(result).resolves.toEqual({ choice: "save", value: "Renamed Theme" });
	});

	it("carries the validate function through current so it can block resolution", async () => {
		// The primitive itself does not run `validate` — that is Prompt.svelte's
		// job (disabling the primary button when it returns non-null; see the
		// component-level note at the top of this file for what that means
		// jsdom can and cannot verify). What `ask()` guarantees is that the
		// request's validator survives the round trip through `current`
		// unchanged, which is what the render surface depends on.
		const validate = (v: string) => (v.trim() === "" ? "Name is required" : null);
		const result = prompt.ask({
			title: "Name this theme",
			choices: [{ value: "save", label: "Save", primary: true }],
			input: { label: "Name", initial: "", validate },
			cancelValue: "save",
		});

		expect(prompt.current?.input?.validate?.("")).toBe("Name is required");
		expect(prompt.current?.input?.validate?.("ok")).toBeNull();

		prompt.resolve("save", "ok");
		await expect(result).resolves.toEqual({ choice: "save", value: "ok" });
	});

	it("supports the three-way import-collision shape (Replace / Keep both / Cancel)", async () => {
		const result = prompt.ask({
			title: "A theme with this name already exists",
			choices: [
				{ value: "replace", label: "Replace", danger: true },
				{ value: "keep-both", label: "Keep both", primary: true },
				{ value: "cancel", label: "Cancel" },
			],
			cancelValue: "cancel",
		});
		prompt.resolve("keep-both");
		await expect(result).resolves.toEqual({ choice: "keep-both", value: undefined });
	});
});
