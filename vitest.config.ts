import { defineConfig } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
	plugins: [svelte({ hot: false })],
	resolve: {
		alias: {
			$lib: new URL("./src/lib", import.meta.url).pathname,
		},
	},
	test: {
		include: ["src/**/*.test.ts"],
		environment: "jsdom",
		globals: true,
		setupFiles: ["src/test-setup.ts"],
		css: false,
	},
});
