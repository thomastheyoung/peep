/**
 * Svelte action that adds a copy-to-clipboard button to every <pre> block
 * inside the target element. Uses inline SVG matching the movingicons.dev
 * Copy / CopyCheck animation style.
 *
 * All SVG content is hardcoded — no user input is used in innerHTML.
 */

import type { Action } from "svelte/action";

const COPY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="overflow:visible"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" class="copy-rect"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" class="copy-path"/></svg>`;

const CHECK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="overflow:visible"><path d="m12 15 2 2 4-4" class="check-path"/><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;

function createCopyButton(pre: HTMLPreElement): HTMLButtonElement {
	const btn = document.createElement("button");
	btn.className = "copy-code-btn";
	btn.setAttribute("aria-label", "Copy code");
	btn.type = "button";
	// Safe: COPY_SVG is a hardcoded constant, not user input
	btn.innerHTML = COPY_SVG;

	btn.addEventListener("click", async () => {
		const code = pre.querySelector("code");
		const text = (code ?? pre).textContent ?? "";
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			// Fallback for older webviews
			const textarea = document.createElement("textarea");
			textarea.value = text;
			textarea.style.position = "fixed";
			textarea.style.opacity = "0";
			document.body.appendChild(textarea);
			textarea.select();
			document.execCommand("copy");
			document.body.removeChild(textarea);
		}

		// Safe: CHECK_SVG is a hardcoded constant, not user input
		btn.innerHTML = CHECK_SVG;
		btn.classList.add("copied");

		setTimeout(() => {
			// Safe: COPY_SVG is a hardcoded constant, not user input
			btn.innerHTML = COPY_SVG;
			btn.classList.remove("copied");
		}, 1500);
	});

	return btn;
}

function attachButtons(node: HTMLElement) {
	const pres = node.querySelectorAll("pre");
	for (const pre of pres) {
		if (pre.querySelector(".copy-code-btn")) continue;
		pre.style.position = "relative";
		pre.appendChild(createCopyButton(pre));
	}
}

export const copyCode: Action<HTMLElement> = (node) => {
	attachButtons(node);

	const observer = new MutationObserver(() => {
		attachButtons(node);
	});

	observer.observe(node, { childList: true, subtree: true });

	return {
		destroy() {
			observer.disconnect();
		},
	};
};
