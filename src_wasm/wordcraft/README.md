# WordCraft WASM Build

## Mô tả

Folder này chứa source code để build [WordCraft](https://github.com/storytold/wordcraft)
(trình soạn thảo văn bản viết bằng Rust thuần) thành WebAssembly (WASM) chạy được trên web.

WordCraft build ra một **web app hoàn chỉnh** (eframe + egui + wgpu), gồm:
- `index.html`
- `wordcraft-web-<hash>.js` (glue được tạo bởi wasm-bindgen, ES module)
- `wordcraft-web-<hash>_bg.wasm.gz` (wasm được nén gzip)

### Vì sao file wasm bị nén gzip?

**Cloudflare Pages/Workers giới hạn tối đa 25 MiB mỗi file.** Ngoài ra nén giúp tải nhanh hơn
nhiều. `scripts/wasm_dist_common.sh` nén wasm thành `.wasm.gz` và `scripts/patch_wasm_dist.py`
sửa `index.html` để browser **tự giải nén** (`DecompressionStream('gzip')`) trước khi gọi
`init({ module_or_path: bytes })`. Không cần đổi code Rust; mọi host chỉ cần serve static
thông thường.

## Yêu cầu

1. **Rust toolchain**: https://rustup.rs/ (upstream yêu cầu Rust ≥ 1.90)
2. **trunk**: `brew install trunk` (hoặc `cargo install trunk --locked`)

## Build

```bash
cd src_wasm/wordcraft
./build.sh
```

Kết quả build được xuất ra thư mục `src_wasm/pkg/wordcraft/`.

## Cấu trúc thư mục

```
src_wasm/
├── wordcraft/             # Source code build
│   ├── external_repo/     # Clone on-demand: https://github.com/storytold/wordcraft.git
│   │                      # (tự clone bởi scripts/fetch_wasm_sources.sh khi build — KHÔNG phải git submodule)
│   ├── build.sh           # trunk build + gọi chung scripts/wasm_dist_common.sh
│   └── README.md
├── pkg/
│   └── wordcraft/         # Output từ build (index.html + js + wasm.gz đã nén)
└── README.md
```

> Nén wasm và patch `index.html` là logic dùng chung cho mọi craft wasm
> (`scripts/wasm_dist_common.sh` + `scripts/patch_wasm_dist.py`), không copy
> lại trong từng thư mục.

## Tích hợp vào app

Sau khi build, `vite.config.js` copy folder `src_wasm/pkg/wordcraft` vào
`assets-wasm-<version>/wordcraft` khi build frontend.

Tool `TMWordCraft` mở app qua `TMCraftApp` với `app-key="wordcraft"`: canvas được đăng ký
với id `wordcraft_canvas` (đúng id mà Rust tra lúc khởi động, xem `TMCraftCanvas.js`), rồi
nạp glue `.js` + wasm từ `assets-wasm-<version>/wordcraft/`. Nếu màn hình báo load lỗi, kiểm tra
bạn đã chạy `./build.sh` (hoặc `./scripts/build_wasm.sh`) trước khi `npm run build`.

## Lưu ý

- WordCraft render bằng wgpu: ưu tiên **WebGPU**, tự fallback sang **WebGL2**. Có thể ép bằng
  query flag `?webgl` (xem `packaging/web/README.md` upstream). WebGPU và clipboard **cần
  secure context** (`https://` hoặc `http://localhost`) — khi chạy qua daemon ở
  `http://<ip>:<port>` thì app rơi về WebGL2.
- File `.wasm` cần được serve với MIME type `application/wasm` (server Go dùng
  `http.FileServer` tự nhận diện qua extension `.wasm`).
- Build đầu tiên khá lâu (workspace nhiều crates + fat LTO + wasm-opt -z). Nếu máy thiếu
  RAM, có thể build với `CARGO_PROFILE_WASM_RELEASE_LTO=thin` (xem `packaging/web/README.md`
  upstream).