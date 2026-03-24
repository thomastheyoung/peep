<script lang="ts">
	import { themes } from "$lib/themes/registry";
	import baseCssRaw from "$lib/themes/base.css?raw";

	let { themeId }: { themeId: string } = $props();

	let hostEl: HTMLDivElement | undefined = $state();
	let shadow: ShadowRoot | undefined;
	let styleEl: HTMLStyleElement | undefined;

	const cssCache = new Map<string, string>();

	const PREVIEW_OVERRIDES = `
		.app { margin: 0; }
		.markdown-body {
			max-width: none;
			padding: 20px;
			font-size: 13px;
		}
		.markdown-body h1 {
			font-size: 1.4em;
			margin-top: 0;
		}
		.markdown-body pre {
			overflow: hidden;
		}
	`;

	function buildSampleDom(): DocumentFragment {
		const fragment = document.createDocumentFragment();
		const app = document.createElement("div");
		app.className = "app";
		const body = document.createElement("div");
		body.className = "markdown-body";

		const h1 = document.createElement("h1");
		h1.textContent = "Heading";

		const p = document.createElement("p");
		p.append("Body text with a ");
		const link1 = document.createElement("a");
		link1.href = "#";
		link1.textContent = "hyperlink";
		p.append(link1);
		p.append(" and some ");
		const strong = document.createElement("strong");
		strong.textContent = "bold words";
		p.append(strong);
		p.append(" in a paragraph.");

		const bq = document.createElement("blockquote");
		const bqp = document.createElement("p");
		bqp.textContent = "A blockquote adds emphasis to a passage.";
		bq.appendChild(bqp);

		const hr = document.createElement("hr");

		const pre = document.createElement("pre");
		const code = document.createElement("code");
		code.textContent = 'const theme = "preview";';
		pre.appendChild(code);

		const ul = document.createElement("ul");
		const li1 = document.createElement("li");
		li1.textContent = "List item one";
		const li2 = document.createElement("li");
		li2.append("List item ");
		const link2 = document.createElement("a");
		link2.href = "#";
		link2.textContent = "with link";
		li2.append(link2);
		ul.append(li1, li2);

		body.append(h1, p, bq, hr, pre, ul);
		app.appendChild(body);
		fragment.appendChild(app);
		return fragment;
	}

	$effect(() => {
		if (!hostEl) return;

		if (!shadow) {
			shadow = hostEl.attachShadow({ mode: "open" });
			styleEl = document.createElement("style");
			shadow.appendChild(styleEl);
			shadow.appendChild(buildSampleDom());
		}

		const id = themeId;
		const cached = cssCache.get(id);
		if (cached) {
			styleEl!.textContent = cached;
			return;
		}

		const meta = themes.find((t) => t.id === id);
		if (!meta) return;

		let cancelled = false;
		meta.load().then((themeCss) => {
			if (cancelled) return;
			const combined = baseCssRaw + "\n" + themeCss + "\n" + PREVIEW_OVERRIDES;
			cssCache.set(id, combined);
			if (themeId === id) styleEl!.textContent = combined;
		});

		return () => {
			cancelled = true;
		};
	});
</script>

<div bind:this={hostEl} class="theme-preview-host"></div>

<style>
	.theme-preview-host {
		width: 100%;
		height: 100%;
		overflow-y: auto;
		overflow-x: hidden;
	}
</style>
