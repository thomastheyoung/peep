import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { toast } from "./toast.svelte";

describe("toast", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		// Drain any toasts left over from a previous test.
		for (const t of [...toast.toasts]) toast.dismiss(t.id);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("starts empty", () => {
		expect(toast.toasts).toEqual([]);
	});

	it("error() queues a toast of kind error", () => {
		toast.error("something broke");
		expect(toast.toasts).toHaveLength(1);
		expect(toast.toasts[0]).toMatchObject({ message: "something broke", kind: "error" });
	});

	it("info() queues a toast of kind info", () => {
		toast.info("theme installed");
		expect(toast.toasts[0]).toMatchObject({ message: "theme installed", kind: "info" });
	});

	it("assigns each toast a distinct id", () => {
		const a = toast.error("a");
		const b = toast.error("b");
		expect(a).not.toBe(b);
	});

	it("queues multiple toasts in order", () => {
		toast.error("first");
		toast.info("second");
		expect(toast.toasts.map((t) => t.message)).toEqual(["first", "second"]);
	});

	it("dismiss() removes a toast by id", () => {
		const id = toast.error("gone soon");
		toast.dismiss(id);
		expect(toast.toasts).toEqual([]);
	});

	it("dismissing an unknown id is a no-op", () => {
		toast.error("stays");
		toast.dismiss(99999);
		expect(toast.toasts).toHaveLength(1);
	});

	it("auto-dismisses after the default duration", () => {
		toast.error("auto");
		expect(toast.toasts).toHaveLength(1);
		vi.advanceTimersByTime(5000);
		expect(toast.toasts).toEqual([]);
	});

	it("does not auto-dismiss before the duration elapses", () => {
		toast.error("not yet");
		vi.advanceTimersByTime(4999);
		expect(toast.toasts).toHaveLength(1);
	});

	it("respects a custom duration", () => {
		toast.error("quick", 1000);
		vi.advanceTimersByTime(999);
		expect(toast.toasts).toHaveLength(1);
		vi.advanceTimersByTime(1);
		expect(toast.toasts).toEqual([]);
	});

	// Manual dismiss before the timer fires must not leave a dangling timeout
	// that later dismisses a *different* toast that reused the same id slot
	// — guards the timers Map cleanup in dismiss().
	it("manual dismiss clears the pending auto-dismiss timer", () => {
		const id = toast.error("manual");
		toast.dismiss(id);
		expect(() => vi.advanceTimersByTime(10_000)).not.toThrow();
		expect(toast.toasts).toEqual([]);
	});
});
