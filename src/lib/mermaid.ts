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

let renderCounter = 0;
let processing = false;

async function processBlocks(container: HTMLElement) {
	if (processing) return;
	const pending = container.querySelectorAll<HTMLElement>(
		".mermaid-diagram:not(.mermaid-rendered)",
	);
	if (pending.length === 0) return;
	processing = true;

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
	processing = false;
}

export function rerenderMermaid(container: HTMLElement) {
	const rendered = container.querySelectorAll<HTMLElement>(
		".mermaid-diagram.mermaid-rendered",
	);
	for (const el of rendered) {
		const source = el.getAttribute("data-source");
		if (!source) continue;
		el.textContent = source;
		el.classList.remove("mermaid-rendered", "mermaid-error");
	}
	// Reset so mermaid re-initializes with the current theme on next process
	mermaidPromise = null;
	processBlocks(container);
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
