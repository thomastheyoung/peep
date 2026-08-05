/**
 * Reusable modal prompt primitive (peep-zm6), built for three
 * upcoming flows that each need a modal decision point: delete-confirm
 * (binary, destructive), an import-collision prompt (three-way: Replace /
 * Keep both / Cancel), and name-this-theme (text entry). One primitive
 * serves all three rather than three bespoke dialogs.
 *
 * Module-level singleton `$state`, matching every other reactive store in
 * this app (`tabs`, `preferences`, `themeState`, `toast`) — see their file
 * headers.
 *
 * `ask()` NEVER rejects. Cancel is a value via the required `cancelValue`,
 * so every call site is a `switch` over the choice rather than a try/catch
 * plus a switch — matching this codebase's established taste for
 * discriminated results over throws (`SanitizeResult`, `DiscoveryResult`).
 *
 * Calls are serialized rather than concurrent: a second `showModal()` on an
 * already-open native `<dialog>` throws `InvalidStateError`. A second
 * `ask()` while one is pending is queued and shown once the first resolves.
 */

export interface PromptChoice<T extends string = string> {
	value: T;
	label: string;
	/** Rendered as the default/primary button. At most one choice may set this. */
	primary?: boolean;
	/** Destructive styling. */
	danger?: boolean;
}

export interface PromptInput {
	label: string;
	initial: string;
	placeholder?: string;
	/** Return an error string to display, or null when acceptable. */
	validate?: (value: string) => string | null;
	/** Optional live-derived hint shown under the field, e.g. "Will be saved as `x`". */
	hint?: (value: string) => string | null;
}

export interface PromptRequest<T extends string = string> {
	title: string;
	body?: string;
	choices: readonly PromptChoice<T>[];
	/** Present => the dialog renders a text field; its value comes back in PromptResult. */
	input?: PromptInput;
	/** Returned when the user presses Escape or dismisses. REQUIRED. */
	cancelValue: T;
}

export interface PromptResult<T extends string = string> {
	choice: T;
	/** Only present when the request declared an `input`. */
	value?: string;
}

/**
 * The active request plus its resolver, type-erased to `string` so a single
 * queue can hold requests with different literal choice unions. `ask<T>`
 * restores the caller's `T` at the boundary since the resolver it hands the
 * component is only ever invoked with values drawn from that same request's
 * `choices`/`cancelValue`.
 */
interface ActivePrompt {
	readonly request: PromptRequest<string>;
	readonly resolve: (result: PromptResult<string>) => void;
}

let active = $state<ActivePrompt | undefined>(undefined);
const queue: ActivePrompt[] = [];

function settle(result: PromptResult<string>): void {
	const current = active;
	if (!current) return;
	current.resolve(result);
	active = queue.shift();
}

export interface PromptAPI {
	readonly current: PromptRequest<string> | undefined;
	ask<T extends string = string>(request: PromptRequest<T>): Promise<PromptResult<T>>;
	/** Resolve the currently-open prompt as if the user chose `choice`. */
	resolve(choice: string, value?: string): void;
	/** Resolve the currently-open prompt with its `cancelValue`. */
	cancel(): void;
}

export const prompt: PromptAPI = {
	get current() {
		return active?.request;
	},
	ask<T extends string = string>(request: PromptRequest<T>): Promise<PromptResult<T>> {
		return new Promise((resolvePromise) => {
			const entry: ActivePrompt = {
				request: request as PromptRequest<string>,
				resolve: resolvePromise as (result: PromptResult<string>) => void,
			};
			if (active) {
				queue.push(entry);
			} else {
				active = entry;
			}
		});
	},
	resolve(choice, value) {
		settle({ choice, value });
	},
	cancel() {
		if (!active) return;
		settle({ choice: active.request.cancelValue });
	},
};
