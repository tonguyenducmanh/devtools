# IronRDP WASM Build

## Mô tả

Folder này chứa source code Rust để build IronRDP thành WebAssembly (WASM).

Phiên phản IronRDP này được custom riêng cho mục đích sử dụng cá nhân

## Yêu cầu

1. **Rust toolchain**: https://rustup.rs/
2. **wasm-pack**: `cargo install wasm-pack`

## Build

Chạy script build:

```bash
cd iron_rdp
./build.sh
```

Kết quả build sẽ được xuất ra thư mục `../pkg/rdp/` (tức `src_wasm/pkg/rdp/`)

## Cấu trúc thư mục

```
src_wasm/
├── iron_rdp/           # Source code Rust
│   ├── src/
│   │   └── lib.rs
│   ├── Cargo.toml
│   ├── build.sh
│   └── build.js
├── pkg/                 # Output từ build (WASM files)
│   ├── rdp/             # Output của IronRDP
│   │   ├── rdp_client.js
│   │   ├── rdp_client_bg.wasm
│   │   └── ...
│   ├── dotnet/          # Output của .NET Wrapper
│   └── photocraft/      # Output của PhotoCraft
└── README.md
```

## Tích hợp vào app

Sau khi build, `vite.config.js` copy folder `src_wasm/pkg/rdp` vào
`assets-wasm-<version>/rdp` khi build frontend. Khi dev, plugin
`vite-plugin-static-copy` serve cùng đường dẫn này qua middleware.

Vì vậy app **luôn nạp động theo đường dẫn `assets-wasm`** (không cần phân biệt
dev/prod), giống hệt cách PhotoCraft dùng `assets-wasm-<version>/photocraft`:

```javascript
const rdpPath = `/assets-wasm-${import.meta.env.PACKAGE_VERSION}/rdp/rdp_client.js`;
const wasmModule = await import(/* @vite-ignore */ rdpPath);
await wasmModule.default();
wasmModule.setup("info");
```

Không cần alias `@wasm` cho RDP nữa vì module được nạp theo đường dẫn tuyệt đối
`/assets-wasm-<version>/rdp/`.

## Lưu ý

- WASM build output cần được serve với MIME type `application/wasm`
- File `rdp_client.js` là ES module, sử dụng dynamic import
