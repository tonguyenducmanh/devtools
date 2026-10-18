import { existsSync, readdirSync } from "node:fs";
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
const WASM_PKG_FOLDERS = ["dotnet", "rdp", "photocraft"];

// `src_wasm/pkg/` KHÔNG được commit vào git (gitignored, ~58 MB). Nếu clone mới
// mà chưa chạy `scripts/build_wasm.sh` thì thư mục này rỗng/không tồn tại.
//
// Vì vậy chỉ copy những folder thực sự có file, để `npm run build` vẫn xanh trên
// clone mới. Khi build phát hành (deploy Cloudflare hoặc build daemon) cần đủ
// wasm — đặt biến môi trường REQUIRE_WASM=1 để fail sớm, nếu không chỉ cảnh báo.
const REQUIRE_WASM = process.env.REQUIRE_WASM === "1";

const wasmCopyTargets = WASM_PKG_FOLDERS.filter((folder) => {
  const dir = `src_wasm/pkg/${folder}`;
  const hasFiles = existsSync(dir) && readdirSync(dir).length > 0;
  if (!hasFiles) {
    const msg = `[vite] thiếu wasm "${folder}" — chạy ./scripts/build_wasm.sh để build.`;
    if (REQUIRE_WASM) {
      throw new Error(
        `${msg} REQUIRED_WASM=1 nên build bị dừng (src_wasm/pkg/ là gitignored).`,
      );
    }
    console.warn(msg);
    return false;
  }
  return true;
}).map((folder) => ({
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
  // Worker (Web Worker) được Vite bundle riêng nên KHÔNG đi qua
  // `build.rolldownOptions.output`. Phải khai báo lại ở đây, nếu không file
  // worker (TMQRCodeWorker, monaco *.worker.js) sẽ mất prefix `tjs-`/`tas-`
  // và version chống cache CDN.
  worker: {
    rolldownOptions: {
      output: {
        entryFileNames: `assets/tjs-[name]-[hash]-${APP_VERSION}.js`,
        chunkFileNames: `assets/tjs-[name]-[hash]-${APP_VERSION}.js`,
        assetFileNames: `assets/tas-[name]-[hash]-${APP_VERSION}[extname]`,
      },
    },
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
