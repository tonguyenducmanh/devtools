## Folder này chứa source code WebAssembly

Mong muốn tận dụng các tool được build bằng ngôn ngữ lập trình khác tối ưu về performance hơn

Sau đó sẽ được import ngược về web app

## Cấu trúc

```text
src_wasm/
├── iron_rdp/       # Remote Desktop (Rust → wasm-pack)  → pkg/rdp
├── dotnet_wrapper/ # .NET Wrapper (C#)                 → pkg/dotnet
├── photocraft/     # Chỉnh sửa ảnh (trunk)            → pkg/photocraft
├── vectorcraft/    # Thiết kế vector (trunk)           → pkg/vectorcraft
└── pkg/            # Output đã build — COMMIT SẴN vào repo, KHÔNG phải git submodule
```

## Quy tắc quan trọng

- **Không dùng git submodule.** `pkg/` chứa kết quả build đã được commit thẳng vào repo,
  nên CI/Cloudflare chỉ cần `npm run build`.
- `src_wasm/*/external_repo/` được `.gitignore` và chỉ clone **on-demand** khi bạn muốn
  build lại wasm (xem `scripts/fetch_wasm_sources.sh`).
- Hai web app "craft" (PhotoCraft / VectorCraft) đều build ra một
  **static site** (`index.html` + js glue + wasm), serve trong `<iframe>` từ
  `assets-wasm-<version>/<tên>/index.html`. Phần nén wasm + patch `index.html` là logic
  **dùng chung** trong `scripts/wasm_dist_common.sh` và `scripts/patch_wasm_dist.py`.

Build tất cả: `./scripts/build_wasm.sh` (xem `docs/development.md`).