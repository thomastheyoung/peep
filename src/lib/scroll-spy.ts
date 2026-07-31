import type { Action } from "svelte/action";

const HEADING_SELECTOR = "h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]";
const SCROLL_OFFSET = 80;

interface ScrollSpyParams {
	/** Identity of the document being spied on; changing it resets dedup state. */
	key: string;
	onActiveChange: (id: string | null) => void;
}

export const scrollSpy: Action<HTMLElement, ScrollSpyParams> = (
	node,
	params,
) => {
	let ticking = false;
	let currentId: string | null = null;
	let callback = params.onActiveChange;
	// The node this action is attached to never unmounts, so `currentId` would
	// otherwise persist across tab switches and suppress the first callback for
	// a new document that happens to share a heading id.
	let prevKey = params.key;

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
		// Runs on every re-render (the caller passes a fresh object literal), so
		// this must stay idempotent — only reset when the key actually changes.
		update(next) {
			callback = next.onActiveChange;
			if (next.key !== prevKey) {
				prevKey = next.key;
				currentId = null;
			}
		},
		destroy() {
			node.removeEventListener("scroll", onScroll);
			mo.disconnect();
		},
	};
};
