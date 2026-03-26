export interface ThemeMeta {
	readonly id: string;
	readonly name: string;
	readonly colors: { readonly bg: string; readonly text: string; readonly accent: string };
	readonly load: () => Promise<string>;
}
