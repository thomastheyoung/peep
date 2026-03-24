export interface ThemeMeta {
	id: string;
	name: string;
	colors: { bg: string; text: string; accent: string };
	load: () => Promise<string>;
}
