import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { viteStaticCopy } from "vite-plugin-static-copy";
import packageJson from "./package.json";

// Version của app: ưu tiên biến môi trường VERSION (khi build với
// VERSION=1.2.3 ./build_all.sh), không có thì lấy version trong package.json.
// Biến này được gắn vào binary Go qua ldflags nên version UI và BE luôn khớp.
const APP_VERSION = process.env.VERSION || packageJson.version;

// Mọi thư mục con trong `src_wasm/pkg/` đều được copy sang
// `dist/assets-wasm-<VERSION>/<tên>/` (nội dung copy phẳng, bỏ thư mục con).
// Danh sách được quét động: build wasm ra folder nào thì copy folder đó, không
// cần sửa file này khi thêm tool wasm mới.
//
// Quy ước:
//   - `src_wasm/<module>/build.sh` xuất ra `src_wasm/pkg/<tên>/`
//     (tên folder có thể khác tên module, vd iron_rdp → pkg/rdp)
//   - `src/views/tools/Craft/` dùng `appKey = <tên>` để nạp
//     `/assets-wasm-<version>/<tên>/index.html`
const WASM_PKG_ROOT = "src_wasm/pkg";

// `src_wasm/pkg/` KHÔNG được commit vào git (gitignored, ~58 MB). Nếu clone mới
// mà chưa chạy `scripts/build_wasm.sh` thì thư mục này rỗng/không tồn tại.
//
// Vì vậy chỉ copy những folder thực sự có file, để `npm run build` vẫn xanh trên
// clone mới. Khi build phát hành (deploy Cloudflare hoặc build daemon) cần đủ
// wasm — đặt biến môi trường REQUIRE_WASM=1 để fail sớm, nếu không chỉ cảnh báo.
const REQUIRE_WASM = process.env.REQUIRE_WASM === "1";

function warnOrFail(message) {
  if (REQUIRE_WASM) {
    throw new Error(
      `[vite] ${message} REQUIRE_WASM=1 nên build bị dừng (src_wasm/pkg/ là gitignored).`,
    );
  }
  console.warn(`[vite] ${message}`);
}

/** Folder con (bỏ file ẩn) trong `src_wasm/pkg/`. */
function listWasmPkgFolders() {
  if (!existsSync(WASM_PKG_ROOT)) {
    return [];
  }
  return readdirSync(WASM_PKG_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .sort();
}

/** Folder phải có ít nhất 1 file thật (bỏ qua .DS_Store...) mới đem copy. */
function hasWasmFiles(folder) {
  const dir = join(WASM_PKG_ROOT, folder);
  if (!existsSync(dir)) {
    return false;
  }
  return readdirSync(dir).some((name) => !name.startsWith("."));
}

const wasmFolders = listWasmPkgFolders();
if (wasmFolders.length === 0) {
  warnOrFail(
    `chưa có wasm nào trong "${WASM_PKG_ROOT}" — chạy ./scripts/build_wasm.sh để build.`,
  );
}

const wasmCopyTargets = wasmFolders
  .filter((folder) => {
    const usable = hasWasmFiles(folder);
    if (!usable) {
      warnOrFail(
        `thiếu wasm "${folder}" (folder rỗng) — chạy ./scripts/build_wasm.sh để build.`,
      );
    }
    return usable;
  })
  .map((folder) => ({
    src: `${WASM_PKG_ROOT}/${folder}/*`,
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
