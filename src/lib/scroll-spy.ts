const HEADING_SELECTOR = "h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]";
const SCROLL_OFFSET = 80;

export function scrollSpy(
	node: HTMLElement,
	onActiveChange: (id: string | null) => void,
) {
	let ticking = false;
	let currentId: string | null = null;

	function update() {
		const article = node.querySelector("article.markdown-body");
		if (!article) return;

		const headings =
			article.querySelectorAll<HTMLElement>(HEADING_SELECTOR);
		if (headings.length === 0) return;

		const scrollTop = node.scrollTop;
		let active: string | null = null;

		for (const h of headings) {
			if (h.offsetTop - node.offsetTop <= scrollTop + SCROLL_OFFSET) {
				active = h.id;
			} else {
				break;
			}
		}

		if (active !== currentId) {
			currentId = active;
			onActiveChange(active);
		}
	}

	function onScroll() {
		if (!ticking) {
			ticking = true;
			requestAnimationFrame(() => {
				update();
				ticking = false;
			});
		}
	}

	node.addEventListener("scroll", onScroll, { passive: true });

	const mo = new MutationObserver(() => {
		requestAnimationFrame(update);
	});
	mo.observe(node, { childList: true, subtree: true });

	requestAnimationFrame(update);

	return {
		destroy() {
			node.removeEventListener("scroll", onScroll);
			mo.disconnect();
		},
	};
}
