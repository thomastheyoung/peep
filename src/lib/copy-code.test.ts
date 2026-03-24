import { describe, it, expect, vi, beforeEach } from "vitest";
import { copyCode } from "./copy-code";

describe("copyCode action", () => {
	let container: HTMLDivElement;

	beforeEach(() => {
		container = document.createElement("div");
		document.body.appendChild(container);
	});

	afterEach(() => {
		document.body.removeChild(container);
	});

	function addPre(text: string) {
		const pre = document.createElement("pre");
		const code = document.createElement("code");
		code.textContent = text;
		pre.appendChild(code);
		container.appendChild(pre);
		return pre;
	}

	it("adds a copy button to existing <pre> blocks", () => {
		addPre("console.log('hello')");
		copyCode(container);

		const btns = container.querySelectorAll(".copy-code-btn");
		expect(btns).toHaveLength(1);
	});

	it("sets aria-label for accessibility", () => {
		addPre("code");
		copyCode(container);

		const btn = container.querySelector(".copy-code-btn")!;
		expect(btn.getAttribute("aria-label")).toBe("Copy code");
	});

	it("sets pre to position:relative for button positioning", () => {
		const pre = addPre("code");
		copyCode(container);

		expect(pre.style.position).toBe("relative");
	});

	it("does not add duplicate buttons", () => {
		addPre("code");
		const action = copyCode(container);

		// Manually trigger by adding another pre
		addPre("more code");

		// Wait for MutationObserver to fire
		return new Promise<void>((resolve) => {
			setTimeout(() => {
				const btns = container.querySelectorAll(".copy-code-btn");
				expect(btns).toHaveLength(2); // one per pre, no duplicates
				action.destroy();
				resolve();
			}, 50);
		});
	});

	it("adds buttons to dynamically added <pre> elements", async () => {
		const action = copyCode(container);

		// Add a pre after the action is initialized
		addPre("dynamic code");

		await new Promise<void>((resolve) => {
			setTimeout(() => {
				const btns = container.querySelectorAll(".copy-code-btn");
				expect(btns).toHaveLength(1);
				action.destroy();
				resolve();
			}, 50);
		});
	});

	it("button contains SVG icon", () => {
		addPre("code");
		copyCode(container);

		const btn = container.querySelector(".copy-code-btn")!;
		expect(btn.querySelector("svg")).not.toBeNull();
	});

	it("clicking button copies code text to clipboard", async () => {
		const writeText = vi.fn().mockResolvedValue(undefined);
		Object.assign(navigator, {
			clipboard: { writeText },
		});

		addPre("hello world");
		copyCode(container);

		const btn = container.querySelector(".copy-code-btn") as HTMLButtonElement;
		btn.click();

		// Allow async clipboard call to resolve
		await vi.waitFor(() => {
			expect(writeText).toHaveBeenCalledWith("hello world");
		});
	});

	it("button shows check icon after copying", async () => {
		Object.assign(navigator, {
			clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
		});

		addPre("code");
		copyCode(container);

		const btn = container.querySelector(".copy-code-btn") as HTMLButtonElement;
		btn.click();

		await vi.waitFor(() => {
			expect(btn.classList.contains("copied")).toBe(true);
		});
	});

	it("destroy disconnects the MutationObserver", () => {
		const action = copyCode(container);
		action.destroy();

		// Add a pre after destroy — no button should appear
		addPre("after destroy");

		return new Promise<void>((resolve) => {
			setTimeout(() => {
				// The pre added after destroy should NOT have a button
				const pres = container.querySelectorAll("pre");
				const lastPre = pres[pres.length - 1]!;
				expect(lastPre.querySelector(".copy-code-btn")).toBeNull();
				resolve();
			}, 50);
		});
	});
});
