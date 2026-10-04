# PhotoCraft WASM Build

## Mô tả

Folder này chứa source code để build [PhotoCraft](https://github.com/storytold/photocraft)
(trình chỉnh sửa ảnh viết bằng Rust thuần) thành WebAssembly (WASM) chạy được trên web.

PhotoCraft build ra một **web app hoàn chỉnh** (egui + wgpu), gồm:
- `index.html`
- `photocraft-web-<hash>.js` (glue được tạo bởi wasm-bindgen, ES module)
- `photocraft-web-<hash>_bg.wasm.gz` (wasm ~27 MiB được nén gzip còn ~9 MiB)

### Vì sao file wasm bị nén gzip?

**Cloudflare Pages/Workers giới hạn tối đa 25 MiB mỗi file.** Wasm PhotoCraft
hiện tại ~27 MiB (vượt giới hạn), nên `build.sh` nén gzip thành `.wasm.gz`
(~9 MiB) và `scripts/patch_wasm_dist.py` sửa `index.html` để browser **tự giải nén**
(`DecompressionStream('gzip')`) trước khi gọi `init({ module_or_path: bytes })`.
Không cần đổi code Rust; mọi host chỉ cần serve static thông thường.

## Yêu cầu

1. **Rust toolchain**: https://rustup.rs/
2. **trunk**: `brew install trunk` (hoặc `cargo install trunk --locked`)
3. **clang**: cần để build feature `heif` cho target `wasm32-unknown-unknown`

## Build

Chạy script build:

```bash
cd src_wasm/photocraft
./build.sh
```

Kết quả build được xuất ra thư mục `src_wasm/pkg/photocraft/`.

## Cấu trúc thư mục

```
src_wasm/
├── photocraft/           # Source code build
│   ├── external_repo/    # Clone on-demand: https://github.com/storytold/photocraft.git
│   │                     # (tự clone bởi scripts/fetch_wasm_sources.sh khi build — KHÔNG phải git submodule)
│   ├── build.sh          # gọi chung scripts/wasm_dist_common.sh để nén wasm + dọn site
│   └── README.md
├── pkg/
│   └── photocraft/       # Output từ build (index.html + js + wasm.gz đã nén)
└── README.md
```

> Nén wasm và patch `index.html` là logic dùng chung cho mọi craft wasm
> (`scripts/wasm_dist_common.sh` + `scripts/patch_wasm_dist.py`), không copy
> lại trong từng thư mục.

## Tích hợp vào app

Sau khi build, `vite.config.js` copy folder `src_wasm/pkg/photocraft` vào
`assets-wasm-<version>/photocraft` khi build frontend.

Tool `TMPhotoCraft` mở app trong một `<iframe>` với src:
`/assets-wasm-<version>/photocraft/index.html`. Nếu iframe ẩn/reload lỗi, kiểm tra
bạn đã chạy `./build.sh` (hoặc `./scripts/build_wasm.sh`) trước khi `npm run build`.

## Lưu ý

- PhotoCraft chạy trong browser cần **WebGPU** hoặc **WebGL2**. Có thể ép renderer
  bằng query flag: `?webgl` hoặc `?cpu` (xem docs upstream `packaging/web/README.md`).
- File `.wasm` cần được serve với MIME type `application/wasm` (server Go dùng
  `http.FileServer` tự nhận diện qua extension `.wasm`).
- Build đầu tiên khá lâu (workspace 24 crates, fat LTO + wasm-opt -Oz). Nếu máy
  thiếu RAM, có thể build với `CARGO_PROFILE_WASM_RELEASE_LTO=thin`
  (xem `packaging/web/README.md` upstream).