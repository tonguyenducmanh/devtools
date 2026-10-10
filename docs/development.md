# Hướng dẫn phát triển

## Yêu cầu

- **Node.js** ≥ 22 (npm) cho frontend (Vite 8 / rolldown).
- **Go 1.25+** cho backend (3 module dùng `go 1.25.x`; route kiểu method-pattern của Go 1.22+).
- **Không bắt buộc hàng ngày:** Rust + wasm-pack (IronRDP), .NET 10 SDK (dotnet_wrapper), trunk + clang (PhotoCraft) — chỉ cần khi **build lại wasm**.

## 1. Chạy frontend (dev)

```bash
npm install
npm run dev        # Vite dev server (mặc định port 5173)
```

Lưu ý dev-only:

- WASM được phục vụ qua **middleware của viteStaticCopy** ở đúng đường dẫn prod:
  `/assets-wasm-<version>/rdp/…`, `…/photocraft/index.html`, `…/dotnet.js`. Không cần build wasm cho dev **trừ khi** `src_wasm/pkg/*` đang trống.
- Alias: `@` → `src`, `@wasm` → `src_wasm`.
- Agent URL mặc định `http://localhost:7777` (`src/cfg/config.js`). Tool cần agent sẽ lỗi "agent not found" nếu daemon chưa chạy.

## 2. Build frontend

```bash
npm run build
```

- Output: `dist/` (gitignored) — gồm bundle `assets/tjs-*`, `assets/tas-*` (có version) và `assets-wasm-<version>/{dotnet,rdp,photocraft}` được copy từ `src_wasm/pkg/`.
- **Bắt buộc:** `src_wasm/pkg/*` phải tồn tại trước khi build (xem mục WASM).
- Chạy `npm run dev` sau đó Ctrl-click mở tool bị đổi để smoke-test; rồi `npm run build` để chắc chắn không phá bundle.

## 3. Build backend (Go)

Mỗi module là một Go module riêng:

```bash
cd src_backend/tm_config       && go build ./...
cd ../tm_core_service          && go build ./... && go vet ./... && go test ./...
cd ../tm_app                   && go build ./...
```

Script chính thức:

| Script | Kết quả |
|---|---|
| `scripts/build_api.sh` | `out/dev-tool-api-{mac-arm\|linux\|window.exe}` — chỉ API app (không nhúng frontend) |
| `scripts/build_daemon.sh` | `out/dev-tool-{mac-arm\|linux\|window}-<VERSION>` — daemon **nhúng frontend** |
| `scripts/build_web_for_daemon.sh` | `npm install && npm run build`, rồi copy `dist/` → `src_backend/tm_core_service/internal/web/dist/` (để `go:embed all:dist`) |
| `./build_all.sh` | Cả quy trình: version → (wasm, tùy chọn) → web → api → daemon |

**Thứ tự đúng:** `build_web_for_daemon.sh` PHẢI chạy trước `build_daemon.sh` (nếu không `go:embed` thiếu `dist` và build Go sẽ fail).

## 4. Cấu hình runtime & database

- Config: daemon tìm `config/config.json` hoặc `config.json` đi ngược từ thư mục exe; thiếu thì tự sinh file mặc định cạnh exe. File mẫu: `src_backend/tm_app/cmd/api_app/config.json`. `config.json` bị gitignore.
- Port: API **7777**, Web UI **1403**, Mock API **8888**.
- Database: `dev_tool.db` (SQLite, WAL) cạnh exe; migration idempotent tự chạy lúc khởi động.
- CORS mở `*` để web-hosted + local daemon; path lowercased mặc định (`endpoint_case_sensitive: false`).

## 5. Build WASM (chỉ khi cần)

```bash
./scripts/build_wasm.sh
```

Script lần lượt build:

1. **IronRDP** → `src_wasm/pkg/rdp/` (wasm-pack `--target web`)
2. **.NET Wrapper** → `src_wasm/pkg/dotnet/` (dotnet publish browser-wasm, copy `_framework`)
3. **PhotoCraft** → `src_wasm/pkg/photocraft/` (trunk build external_repo, nén wasm gzip ~11 MB, patch index.html)

Trong mỗi `build.sh`, source được lấy từ `src_wasm/<tên>/external_repo/` (clone on-demand bởi `scripts/fetch_wasm_sources.sh`, gitignored) và được `scripts/git_pull_if_repo.sh` cập nhật **về nhánh mặc định** rồi `git pull origin` trước khi build. Sau khi build wasm, **bắt buộc chạy lại `npm run build`** vì viteStaticCopy lấy từ `src_wasm/pkg/`.

> PhotoCraft: wasm gốc ~27 MB > giới hạn 25 MiB/file của Cloudflare, nên được nén `.gz` ~11 MB và browser tự giải nén (`DecompressionStream`) — đừng xoá bước nén trong `src_wasm/photocraft/build.sh`.

## 6. Version & phát hành

- Version 1 nguồn: biến `VERSION` khi build, hoặc `package.json.version`.
- UI: `vite.config.js` → `import.meta.env.PACKAGE_VERSION` → tên file assets có version.
- BE: `scripts/tm_version.sh` → ldflags `-X tm_config.Version=…` → health check `/` trả `beVersion`.
- Release: tag `v<version>`, `build_all.sh` tạo `out/dev-tool-…-<VERSION>`, upload GitHub Releases (header có mục "Download agent").
- Dọn tag cũ: `scripts/remove_old_tag.sh` (giữ `EXCLUDE_TAGS`, hiện `v16.1.5`).

## 7. Debug

- **Frontend:** `npm run dev`; Vue DevTools; console đã có log `TMUtility`.
- **Backend:** `.vscode/launch.json` có sẵn 2 config Go: `Debug tm_tool_api` và `Debug tm_tool_daemon` (F5 với VS Code + Go extension).
- **Agent health:** mở `http://localhost:7777/` trong browser — trả `{success, message, beVersion}`.
- **RDP:** proxy WebSocket `GET /rdp/ws`; kiểm tra log daemon (lipgloss 2 dòng: `time│level│caller`).

## 8. Scripts tiện ích

| Script | Công dụng |
|---|---|
| `scripts/tm_version.sh` | Lấy version + ldflags (source để dùng hàm) |
| `scripts/remove_all_db_file.sh` | Dọn các `dev_tool.db` rác |
| `scripts/remove_old_tag.sh` | Xoá tag cũ local + remote theo danh sách loại trừ |
| `scripts/fetch_wasm_sources.sh` | Clone external repo về `src_wasm/*/external_repo/` (nếu chưa có) |
| `scripts/git_pull_if_repo.sh` | Helper: pull repo nguồn, tự về nhánh mặc định nếu đang detached HEAD |