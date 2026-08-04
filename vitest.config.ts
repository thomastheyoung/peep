import { defineConfig } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
	plugins: [svelte({ hot: false })],
	resolve: {
		alias: {
			$lib: new URL("./src/lib", import.meta.url).pathname,
		},
		// Without this, Vite resolves `svelte`'s package.json `exports` map to
		// its server/SSR condition even though tests run under jsdom, and
		// `mount()` throws `lifecycle_function_unavailable` ("mount(...) is not
		// available on the server") the instant a component test tries to use
		// it. Scoped to this file only — vite.config.js (the actual app
		// build/dev-server config) is untouched, so production output is
		// unaffected.
		conditions: ["browser"],
	},
	test: {
		include: ["src/**/*.test.ts"],
		environment: "jsdom",
		globals: true,
		setupFiles: ["src/test-setup.ts"],
		css: false,
	},
});
