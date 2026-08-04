/**
 * Storybook runs in a plain browser, but several shared components import
 * `@tauri-apps/api`, which reads `window.__TAURI_INTERNALS__` at call time
 * (see node_modules/@tauri-apps/api/core.js). Without it, `invoke()` throws and
 * `getCurrentWindow()` fails during component init — before any markup renders.
 *
 * Faking the transport here, rather than branching inside the components, keeps
 * production code free of Storybook-awareness: the component previewed is the
 * component shipped.
 */

/** Commands the app actually invokes, with plausible browser-side answers. */
const COMMAND_RESPONSES: Record<string, unknown> = {
	is_default_markdown_viewer: false,
	set_default_markdown_viewer: null,
	get_initial_files: [],
	read_file: {
		path: "/storybook/example.md",
		filename: "example.md",
		content: "# Example\n\nStorybook stub response.",
	},
	watch_file: null,
	unwatch_file: null,
	get_preferences: null,
	set_preferences: null,
};

export function installTauriMock() {
	if (typeof window === "undefined") return;

	const w = window as unknown as Record<string, unknown>;
	if (w.__TAURI_INTERNALS__) return;

	let callbackId = 0;

	w.__TAURI_INTERNALS__ = {
		invoke(cmd: string) {
			if (cmd in COMMAND_RESPONSES) {
				return Promise.resolve(COMMAND_RESPONSES[cmd]);
			}
			// Unknown commands resolve rather than reject: a story should render
			// its component, not surface an unhandled rejection from a call the
			// story never cared about.
			console.info(`[storybook] unmocked Tauri command: ${cmd}`);
			return Promise.resolve(null);
		},
		transformCallback(callback: (payload: unknown) => void) {
			const id = ++callbackId;
			w[`_${id}`] = callback;
			return id;
		},
		unregisterCallback(id: number) {
			delete w[`_${id}`];
		},
		convertFileSrc(filePath: string) {
			return filePath;
		},
		metadata: {
			currentWindow: { label: "main" },
			currentWebview: { windowLabel: "main", label: "main" },
		},
		plugins: {},
	};
}
