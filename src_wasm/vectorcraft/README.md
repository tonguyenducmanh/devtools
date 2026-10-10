# VectorCraft WASM Build

## Mô tả

Folder này chứa source code để build [VectorCraft](https://github.com/storytold/vectorcraft)
(trình thiết kế vector viết bằng Rust thuần) thành WebAssembly (WASM) chạy được trên web.

VectorCraft build ra một **web app hoàn chỉnh** (egui + wgpu), gồm:
- `index.html`
- `vectorcraft-web-<hash>.js` (glue được tạo bởi wasm-bindgen, ES module)
- `vectorcraft-web-<hash>_bg.wasm.gz` (wasm được nén gzip)
- `fonts/` (chỉ có khi build với `CRAFT_FONTS_DIR`, xem "Lưu ý")

### Vì sao file wasm bị nén gzip?

**Cloudflare Pages/Workers giới hạn tối đa 25 MiB mỗi file.** Ngoài ra nén giúp tải nhanh hơn
nhiều. `scripts/wasm_dist_common.sh` nén wasm thành `.wasm.gz` và `scripts/patch_wasm_dist.py`
sửa `index.html` để browser **tự giải nén** (`DecompressionStream('gzip')`) trước khi gọi
`init({ module_or_path: bytes })`. Không cần đổi code Rust; mọi host chỉ cần serve static
thông thường.

## Yêu cầu

1. **Rust toolchain**: https://rustup.rs/
2. **trunk**: `brew install trunk` (hoặc `cargo install trunk --locked`)

## Build

```bash
cd src_wasm/vectorcraft
./build.sh
```

Kết quả build được xuất ra thư mục `src_wasm/pkg/vectorcraft/`.

## Cấu trúc thư mục

```
src_wasm/
├── vectorcraft/          # Source code build
│   ├── external_repo/    # Clone on-demand: https://github.com/storytold/vectorcraft.git
│   │                     # (tự clone bởi scripts/fetch_wasm_sources.sh khi build — KHÔNG phải git submodule)
│   ├── build.sh          # trunk build + gọi chung scripts/wasm_dist_common.sh
│   └── README.md
├── pkg/
│   └── vectorcraft/      # Output từ build (index.html + js + wasm.gz đã nén)
└── README.md
```

> Nén wasm và patch `index.html` là logic dùng chung cho mọi craft wasm
> (`scripts/wasm_dist_common.sh` + `scripts/patch_wasm_dist.py`), không copy
> lại trong từng thư mục.

## Tích hợp vào app

Sau khi build, `vite.config.js` copy folder `src_wasm/pkg/vectorcraft` vào
`assets-wasm-<version>/vectorcraft` khi build frontend.

Tool `TMVectorCraft` mở app trong một `<iframe>` với src:
`/assets-wasm-<version>/vectorcraft/index.html`. Nếu iframe ẩn/reload lỗi, kiểm tra
bạn đã chạy `./build.sh` (hoặc `./scripts/build_wasm.sh`) trước khi `npm run build`.

## Lưu ý

- VectorCraft render bằng wgpu: ưu tiên **WebGPU**, tự fallback sang **WebGL2**. Có thể ép
  bằng query flag `?webgl` hoặc `?cpu` (xem `packaging/web/README.md` upstream).
- Font: `Trunk.toml` có hook `post_build` chạy `cargo xtask web-fonts`, copy các font
  trong `crates/text/web-fonts.txt` vào `fonts/`. Hook này là **no-op** nếu không đặt biến
  môi trường `CRAFT_FONTS_DIR` — khi đó app dùng font hệ thống/bundled. Muốn đóng gói đủ
  font thì clone [storytold/craft-fonts](https://github.com/storytold/craft-fonts) rồi build
  với `CRAFT_FONTS_DIR=/đường/dẫn/tới/craft-fonts`.
- File `.wasm` cần được serve với MIME type `application/wasm` (server Go dùng
  `http.FileServer` tự nhận diện qua extension `.wasm`).
- Build đầu tiên khá lâu (fat LTO + wasm-opt -z).