/**
 * Minimal toast/notification queue (peep-l6d), pulled forward
 * from the theme-import work because the sanitize failure path has nowhere
 * to report to otherwise: a rejected theme's `load()` cannot return an empty
 * string to mean "failed" — that already means "no theme loaded yet" at
 * `+page.svelte` — so the failure has to surface somewhere a user can see it,
 * or it is silently swallowed.
 *
 * Module-level singleton `$state`, matching every other reactive store in
 * this app (`tabs`, `preferences`, `themeState`) — see their file headers.
 */

export type ToastKind = "error" | "info";

export interface Toast {
	readonly id: number;
	readonly message: string;
	readonly kind: ToastKind;
}

const DEFAULT_DURATION_MS = 5000;

let nextId = 1;
let queue = $state<Toast[]>([]);
const timers = new Map<number, ReturnType<typeof setTimeout>>();

function dismiss(id: number): void {
	const timer = timers.get(id);
	if (timer !== undefined) {
		clearTimeout(timer);
		timers.delete(id);
	}
	queue = queue.filter((t) => t.id !== id);
}

function show(message: string, kind: ToastKind, durationMs = DEFAULT_DURATION_MS): number {
	const id = nextId++;
	queue = [...queue, { id, message, kind }];
	timers.set(
		id,
		setTimeout(() => dismiss(id), durationMs),
	);
	return id;
}

export interface ToastAPI {
	readonly toasts: readonly Toast[];
	error(message: string, durationMs?: number): number;
	info(message: string, durationMs?: number): number;
	dismiss(id: number): void;
}

export const toast: ToastAPI = {
	get toasts() {
		return queue;
	},
	error(message, durationMs) {
		return show(message, "error", durationMs);
	},
	info(message, durationMs) {
		return show(message, "info", durationMs);
	},
	dismiss(id) {
		dismiss(id);
	},
};
