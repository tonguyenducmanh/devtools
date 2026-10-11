import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { viteStaticCopy } from "vite-plugin-static-copy";
import packageJson from "./package.json";

// Version của app: ưu tiên biến môi trường VERSION (khi build với
// VERSION=1.2.3 ./build_all.sh), không có thì lấy version trong package.json.
// Biến này được gắn vào binary Go qua ldflags nên version UI và BE luôn khớp.
const APP_VERSION = process.env.VERSION || packageJson.version;

// Các thư mục con trong `src_wasm/pkg/` được copy sang
// `dist/assets-wasm-<VERSION>/<tên>/` (nội dung copy phẳng, bỏ thư mục con).
//
// Thêm tool wasm mới chỉ cần thêm 1 dòng vào đây, không phải sửa phần plugin:
//   - `src_wasm/<tên>/build.sh` tạo ra `src_wasm/pkg/<tên>/`
//   - `src/views/tools/Craft/` dùng `appKey = <tên>` để nạp
//     `/assets-wasm-<version>/<tên>/index.html`
const WASM_PKG_FOLDERS = [
  "dotnet",
  "rdp",
  "photocraft",
  "vectorcraft",
  "gridcraft",
  "wordcraft",
];

const wasmCopyTargets = WASM_PKG_FOLDERS.map((folder) => ({
  src: `src_wasm/pkg/${folder}/*`,
  dest: `assets-wasm-${APP_VERSION}/${folder}`,
  rename: { stripBase: true },
}));

export default defineConfig({
  plugins: [
    vue(),
    viteStaticCopy({
      targets: wasmCopyTargets,
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
