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
├── gridcraft/      # Bảng tính (trunk)                 → pkg/gridcraft
├── wordcraft/      # Soạn thảo văn bản (trunk)          → pkg/wordcraft
└── pkg/            # Output đã build — COMMIT SẴN vào repo, KHÔNG phải git submodule
```

## Quy tắc quan trọng

- **Không dùng git submodule.** `pkg/` là thư mục **output** (~58 MB) và **đã gitignore** —
  không commit vào repo. Clone mới sẽ không có `pkg/`, phải chạy `scripts/build_wasm.sh` một lần.
- Vì repo không chứa wasm, **Cloudflare Pages không tự build được**: deploy thủ công bằng
  `scripts/deploy_cloudflare.sh` (build local → `wrangler pages deploy`). Đừng bật Git integration
  trên Cloudflare Pages.
- `src_wasm/*/external_repo/` được `.gitignore` và chỉ clone **on-demand** khi bạn muốn
  build lại wasm (xem `scripts/fetch_wasm_sources.sh`).
- Các web app "craft" (PhotoCraft / VectorCraft / GridCraft / WordCraft) đều build ra một
  **static site** (`index.html` + js glue + wasm), serve trong `<iframe>` từ
  `assets-wasm-<version>/<tên>/index.html`. Phần nén wasm + patch `index.html` là logic
  **dùng chung** trong `scripts/wasm_dist_common.sh` và `scripts/patch_wasm_dist.py`.

Build tất cả: `./scripts/build_wasm.sh` (xem `docs/development.md`).