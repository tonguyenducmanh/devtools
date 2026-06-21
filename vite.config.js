import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { viteStaticCopy } from "vite-plugin-static-copy";
import packageJson from "./package.json";

const APP_VERSION = packageJson.version;

export default defineConfig({
  plugins: [
    vue(),
    viteStaticCopy({
      targets: [
        // Cấu hình copy folder dotnet sang dist/assets-wasm khi build
        {
          src: "src_wasm/pkg/dotnet/*",
          dest: `assets-wasm-${APP_VERSION}`,
          rename: { stripBase: true },
        },
      ],
    }),
  ],
  define: {
    // Định nghĩa một biến toàn cục chứa version
    "import.meta.env.PACKAGE_VERSION": JSON.stringify(APP_VERSION),
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@wasm": fileURLToPath(new URL("./src_wasm", import.meta.url)),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: "modern-compiler",
      },
    },
  },
  optimizeDeps: {
    exclude: ["rdp_client"],
  },
  build: {
    rolldownOptions: {
      output: {
        entryFileNames: (chunkInfo) => {
          return `assets/tjs-[name]-[hash]-${APP_VERSION}.js`;
        },
        chunkFileNames: (chunkInfo) => {
          return `assets/tjs-[name]-[hash]-${APP_VERSION}.js`;
        },
        assetFileNames: (assetInfo) => {
          return `assets/tas-[name]-[hash]-${APP_VERSION}[extname]`;
        },
      },
    },
  },
});
