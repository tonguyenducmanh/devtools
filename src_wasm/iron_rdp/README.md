# IronRDP WASM Build

## Mô tả

Folder này chứa source code Rust để build IronRDP thành WebAssembly (WASM).

## Yêu cầu

1. **Rust toolchain**: https://rustup.rs/
2. **wasm-pack**: `cargo install wasm-pack`

## Build

Chạy script build:

```bash
cd iron_rdp
./build.sh
```

Kết quả build sẽ được xuất ra thư mục `../pkg/` (tức `src_wasm/pkg/`)

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
│   ├── rdp_client.js
│   ├── rdp_client_bg.wasm
│   └── ...
└── README.md
```

## Sử dụng

Sau khi build, import WASM module trong Vue component:

```javascript
const wasmModule = await import("@wasm/pkg/rdp_client.js");
await wasmModule.default();
wasmModule.setup('info');
```

Đảm bảo `vite.config.js` có alias:

```javascript
alias: {
  "@wasm": fileURLToPath(new URL("./src_wasm", import.meta.url)),
}
```

## Lưu ý

- WASM build output cần được serve với MIME type `application/wasm`
- File `rdp_client.js` là ES module, sử dụng dynamic import
