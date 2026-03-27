import type { Action } from "svelte/action";

const HEADING_SELECTOR = "h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]";
const SCROLL_OFFSET = 80;

export const scrollSpy: Action<HTMLElement, (id: string | null) => void> = (
	node,
	onActiveChange,
) => {
	let ticking = false;
	let currentId: string | null = null;
	let callback = onActiveChange;

	function check() {
		const article = node.querySelector("article.markdown-body");
		if (!article) return;

		const headings =
			article.querySelectorAll<HTMLElement>(HEADING_SELECTOR);
		if (headings.length === 0) return;

		const containerRect = node.getBoundingClientRect();
		let active: string | null = null;

		for (const h of headings) {
			const headingRect = h.getBoundingClientRect();
			const relativeTop = headingRect.top - containerRect.top;
			if (relativeTop <= SCROLL_OFFSET) {
				active = h.id;
			} else {
				break;
			}
		}

		if (active !== currentId) {
			currentId = active;
			callback(active);
		}
	}

	function onScroll() {
		if (!ticking) {
			ticking = true;
			requestAnimationFrame(() => {
				check();
				ticking = false;
			});
		}
	}

	node.addEventListener("scroll", onScroll, { passive: true });

	const mo = new MutationObserver(() => {
		requestAnimationFrame(check);
	});
	mo.observe(node, { childList: true, subtree: true });

	requestAnimationFrame(check);

	return {
		update(newCallback) {
			callback = newCallback;
		},
		destroy() {
			node.removeEventListener("scroll", onScroll);
			mo.disconnect();
		},
	};
};
