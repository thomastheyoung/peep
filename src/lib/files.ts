import { invoke } from "@tauri-apps/api/core";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { renderMarkdown, isLatestRender, clearGeneration } from "./markdown";
import { tabs } from "./tabs.svelte";
import type { FileContent } from "./types";
const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

function clearDebounceTimer(path: string) {
	const timer = debounceTimers.get(path);
	if (timer) {
		clearTimeout(timer);
		debounceTimers.delete(path);
	}
}

export function clearAllTimers() {
	for (const timer of debounceTimers.values()) clearTimeout(timer);
	debounceTimers.clear();
}

export async function openFile(path: string) {
	try {
		const result = await invoke<FileContent>("read_file", { path });
		const { html, headings } = await renderMarkdown(result.content, result.path);
		try {
			await invoke("watch_file", { path: result.path });
		} catch (err) {
			console.error(`Failed to watch ${result.path}:`, err);
		}
		tabs.add({ ...result, rendered: html, headings });
	} catch (err) {
		console.error(`Failed to open ${path}:`, err);
	}
}

export async function closeTab(index: number) {
	const tab = tabs.items[index];
	if (!tab) return;
	const { path } = tab;
	clearDebounceTimer(path);
	clearGeneration(path);
	tabs.close(index);
	try {
		await invoke("unwatch_file", { path });
	} catch {
		// best effort
	}
}

export function handleFileChanged(payload: FileContent) {
	clearDebounceTimer(payload.path);
	debounceTimers.set(
		payload.path,
		setTimeout(async () => {
			debounceTimers.delete(payload.path);
			try {
				const { html, generation, headings } = await renderMarkdown(payload.content, payload.path);
				if (!isLatestRender(generation, payload.path)) return;
				tabs.update(payload.path, payload.content, html, headings);
			} catch (err) {
				console.error(`Failed to render ${payload.path}:`, err);
			}
		}, 150),
	);
}

export async function openFileDialog() {
	try {
		const result = await openDialog({
			multiple: true,
			filters: [{ name: "Markdown", extensions: ["md", "markdown"] }],
		});
		if (result) {
			const paths = Array.isArray(result) ? result : [result];
			await Promise.allSettled(paths.map((path) => openFile(path)));
		}
	} catch (err) {
		console.error("Failed to open file dialog:", err);
	}
}
