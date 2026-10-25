/**
 * Khởi tạo Worker cho tool Cimbar.
 *
 * Lưu ý (Luật 13 trong AGENTS.md):
 * - `new Worker(new URL("./...", import.meta.url), ...)` phải nằm LITERALLY
 *   trong module này để Vite transform đường dẫn worker khi build.
 * - Worker là **classic** (không phải module) vì code wasm của cimbar dùng
 *   `importScripts()`; module worker không có API này.
 */

import md5Url from "@/common/crypto/TMMD5.js?url";

export function createCimbarEncodeWorker() {
  return new Worker(new URL("./TMCimbarEncodeWorker.js", import.meta.url), {
    type: "classic",
    name: "tm-cimbar-encode",
  });
}

export function createCimbarDecodeWorker() {
  return new Worker(new URL("./TMCimbarDecodeWorker.js", import.meta.url), {
    type: "classic",
    name: "tm-cimbar-decode",
  });
}

/**
 * URL script MD5 dùng chung (`src/common/crypto/TMMD5.js`).
 * Worker nạp bằng `importScripts()` để tính MD5 mà không block main thread.
 */
export function getCimbarMd5Url() {
  return md5Url;
}

/**
 * Đường dẫn asset wasm (glue + wasm) do `viteStaticCopy` copy vào
 * `dist/assets-wasm-<VERSION>/cimbar/`.
 */
export function getCimbarAssets() {
  const baseUrl = `/assets-wasm-${import.meta.env.PACKAGE_VERSION}/cimbar`;
  return {
    baseUrl,
    glueUrl: `${baseUrl}/cimbar_js.js`,
    wasmUrl: `${baseUrl}/cimbar_js.wasm`,
  };
}
