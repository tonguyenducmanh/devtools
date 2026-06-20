import { fileURLToPath, URL } from "node:url";
import fs from "node:fs";
import path from "node:path";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import packageJson from "./package.json";

// cấu hình phiên bản để đưa vào tên file khi build, giúp cache busting
const APP_VERSION = packageJson.version;

/**
 * Copy toàn bộ .NET WASM output vào dist sau khi vite build xong
 * Source: src_wasm/pkg/dotnet
 * Target: dist/dotnet
 */
function copyDotnetWasmPlugin() {
  return {
    name: "copy-dotnet-wasm",
    writeBundle() {
      const rootDir = process.cwd();

      // folder .NET wasm đã build sẵn
      const sourceDir = path.resolve(rootDir, "src_wasm/pkg/dotnet");

      // nơi copy vào dist
      const targetDir = path.resolve(rootDir, "dist/dotnet");

      if (!fs.existsSync(sourceDir)) {
        console.warn(`[copy-dotnet-wasm] Không tìm thấy thư mục: ${sourceDir}`);
        return;
      }

      // xoá bản cũ nếu có để tránh file cũ bị sót lại
      fs.rmSync(targetDir, { recursive: true, force: true });

      // tạo thư mục đích và copy toàn bộ nội dung
      fs.mkdirSync(targetDir, { recursive: true });
      fs.cpSync(sourceDir, targetDir, { recursive: true });

      console.log(
        `[copy-dotnet-wasm] Copied .NET WASM: ${sourceDir} -> ${targetDir}`,
      );
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), copyDotnetWasmPlugin()],
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
