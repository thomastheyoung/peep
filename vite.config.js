import { defineConfig } from "vite";
import { sveltekit } from "@sveltejs/kit/vite";

// `process` is a Node global, typed since @types/node was added for
// `pnpm check:scripts`. The `@ts-expect-error` that used to sit here became a
// lie at that moment and svelte-check failed on the now-unused directive —
// which is exactly why it was `@ts-expect-error` and not `@ts-ignore`.
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [sveltekit()],

  build: {
    chunkSizeWarningLimit: 1000,
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
