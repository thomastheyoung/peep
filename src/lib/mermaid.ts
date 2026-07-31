/**
 * Svelte action that renders Mermaid diagrams inside `.mermaid-diagram` elements.
 * Mermaid is lazily imported on first use. Diagram source is read from the
 * element's textContent before rendering, then stored in `data-source` so
 * diagrams can be re-rendered when the theme changes (dark/light detection).
 */

import type { Action } from "svelte/action";

let mermaidPromise: Promise<typeof import("mermaid").default> | null = null;

function getMermaid() {
	if (!mermaidPromise) {
		mermaidPromise = import("mermaid").then((m) => m.default);
	}
	return mermaidPromise;
}

function isDarkBackground(el: Element): boolean {
	const bg = getComputedStyle(el).backgroundColor;
	const match = bg.match(/\d+/g);
	if (!match || match.length < 3) return false;
	const [r, g, b] = match.map(Number) as [number, number, number];
	const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
	return luminance < 0.5;
}

const PENDING_SELECTOR = ".mermaid-diagram:not(.mermaid-rendered)";

let renderCounter = 0;

/**
 * Renders are serialized through a promise chain rather than guarded by a
 * boolean. A boolean guard *drops* calls that arrive mid-render, so a tab
 * switch during rendering would silently lose the new tab's diagrams. The
 * `.catch` keeps a single failure from wedging every later render.
 */
let queue: Promise<void> = Promise.resolve();

function enqueue(step: () => Promise<void>): void {
	queue = queue.then(step).catch((err) => {
		console.error("Mermaid render failed:", err);
	});
}

async function doProcess(container: HTMLElement) {
	const pending = container.querySelectorAll<HTMLElement>(PENDING_SELECTOR);
	if (pending.length === 0) return;

	const mermaid = await getMermaid();
	const dark = isDarkBackground(container);
	mermaid.initialize({
		startOnLoad: false,
		theme: dark ? "dark" : "default",
		fontFamily: "inherit",
	});

	for (const el of pending) {
		const source = el.textContent?.trim();
		if (!source) continue;

		try {
			const id = `mermaid-${++renderCounter}`;
			const { svg } = await mermaid.render(id, source);
			el.setAttribute("data-source", source);
			// Mermaid-generated SVG — same trust level as marked HTML output
			// already rendered via {@html} in the page component
			el.innerHTML = svg;
			el.classList.add("mermaid-rendered");
		} catch {
			el.classList.add("mermaid-rendered", "mermaid-error");
			// Show source as plain text on parse failure
			const pre = document.createElement("pre");
			pre.className = "mermaid-error-message";
			const code = document.createElement("code");
			code.textContent = source;
			pre.appendChild(code);
			el.replaceChildren(pre);
		}
	}
}

function processBlocks(container: HTMLElement): void {
	// Cheap synchronous check before enqueuing: the MutationObserver below fires
	// on mermaid's own SVG writes and on copy-code's button insertions, so most
	// calls have nothing to do.
	if (!container.querySelector(PENDING_SELECTOR)) return;
	enqueue(() => doProcess(container));
}

export function rerenderMermaid(container: HTMLElement): void {
	// Strip inside the queue, not synchronously: an in-flight render would
	// otherwise re-mark elements as rendered with the *previous* theme's SVG
	// after the strip, leaving stale-theme diagrams that never correct.
	enqueue(async () => {
		const rendered = container.querySelectorAll<HTMLElement>(
			".mermaid-diagram.mermaid-rendered",
		);
		for (const el of rendered) {
			const source = el.getAttribute("data-source");
			if (!source) continue;
			el.textContent = source;
			el.classList.remove("mermaid-rendered", "mermaid-error");
		}
		// `initialize()` runs on every pass with the current theme, so the
		// module is not re-imported here.
		await doProcess(container);
	});
}

export const renderMermaid: Action<HTMLElement> = (node) => {
	processBlocks(node);

	const observer = new MutationObserver(() => {
		processBlocks(node);
	});

	observer.observe(node, { childList: true, subtree: true });

	return {
		destroy() {
			observer.disconnect();
		},
	};
};
