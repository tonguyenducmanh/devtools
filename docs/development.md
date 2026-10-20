# Hướng dẫn phát triển

## Yêu cầu

- **Node.js** ≥ 22 (npm) cho frontend (Vite 8 / rolldown).
- **Go 1.25+** cho backend (3 module dùng `go 1.25.x`; route kiểu method-pattern của Go 1.22+).
- **Không bắt buộc hàng ngày:** Rust + wasm-pack (IronRDP, UltraViewer), .NET 10 SDK (dotnet_wrapper), trunk (PhotoCraft) — chỉ cần khi **build lại wasm**.

## 1. Chạy frontend (dev)

```bash
npm install
npm run dev        # Vite dev server (mặc định port 5173)
```

Lưu ý dev-only:

- WASM được phục vụ qua **middleware của viteStaticCopy** ở đúng đường dẫn prod:
  `/assets-wasm-<version>/rdp/…`, `/assets-wasm-<version>/ultraviewer/…`, `…/photocraft/manifest.json`, `…/dotnet.js`. Không cần build wasm cho dev **trừ khi** `src_wasm/pkg/*` đang trống (clone mới sẽ trống vì `src_wasm/pkg/` là gitignored — chạy `./scripts/build_wasm.sh` một lần).
- Alias: `@` → `src`, `@wasm` → `src_wasm`.
- Agent URL mặc định `http://localhost:7777` (`src/cfg/config.js`). Tool cần agent sẽ lỗi "agent not found" nếu daemon chưa chạy.

## 2. Build frontend

```bash
npm run build
```

- Output: `dist/` (gitignored) — gồm bundle `assets/tjs-*`, `assets/tas-*` (có version) và `assets-wasm-<version>/{dotnet,rdp,ultraviewer,photocraft}` được copy từ `src_wasm/pkg/`.
- `src_wasm/pkg/` là **gitignored** (~58 MB). Folder nào rỗng thì `vite` **cảnh báo và bỏ qua** để build vẫn xanh; dùng `REQUIRE_WASM=1 npm run build` khi build phát hành — lúc đó thiếu folder nào là **fail ngay**.
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
2. **UltraViewer** → `src_wasm/pkg/ultraviewer/` (wasm-pack `--target web`, không cần external repo)
3. **.NET Wrapper** → `src_wasm/pkg/dotnet/` (dotnet publish browser-wasm, copy `_framework`)
4. **PhotoCraft** → `src_wasm/pkg/photocraft/` (trunk build external_repo)

Trong mỗi `build.sh`, source được lấy từ `src_wasm/<tên>/external_repo/` (clone on-demand bởi `scripts/fetch_wasm_sources.sh`, gitignored) và được `scripts/git_pull_if_repo.sh` cập nhật **về nhánh mặc định** rồi `git pull origin` trước khi build. Sau khi build wasm, **bắt buộc chạy lại `npm run build`** vì viteStaticCopy lấy từ `src_wasm/pkg/`.

> **Nén wasm (các craft tool):** wasm luôn được nén gzip thành `_bg.wasm.gz`; phía app giải nén bằng `DecompressionStream` trước khi gọi `init()`, còn `index.html` (trang chạy độc lập để debug) được patch cùng logic đó. Lý do: Cloudflare Pages/Workers chặn file > 25 MiB/file (PhotoCraft gốc ~27 MB), và nén giúp tải nhanh hơn nhiều. Logic này **dùng chung** ở `scripts/wasm_dist_common.sh` + `scripts/patch_wasm_dist.py` — đừng copy vào từng `build.sh` và đừng xoá bước nén.

## 6. Version & phát hành

- Version 1 nguồn: biến `VERSION` khi build, hoặc `package.json.version`.
- UI: `vite.config.js` → `import.meta.env.PACKAGE_VERSION` → tên file assets có version.
- BE: `scripts/tm_version.sh` → ldflags `-X tm_config.Version=…` → health check `/` trả `beVersion`.
- Release: tag `v<version>`, `build_all.sh` tạo `out/dev-tool-…-<VERSION>` cho 3 OS rồi **xoá bản thô**, chỉ giữ lại archive: mac/linux → `.tar.gz`, window → `.zip`. Nén do `build_daemon.sh` làm ở bước cuối (`-6` cho tar.gz, `-9` cho zip). Bản thô chỉ bị xoá khi archive đã tạo ra và không rỗng — nén lỗi thì giữ binary lại. Thiếu lệnh `tar`/`zip` thì giữ nguyên bản thô và chỉ cảnh báo, không làm build fail. Header trỏ tới trang releases chung nên đổi định dạng không phải sửa link.
- Dọn tag cũ: `scripts/remove_old_tag.sh` (giữ `EXCLUDE_TAGS`, hiện `v16.1.5`).

## 6b. Deploy web lên Cloudflare Pages (thủ công)

Frontend được host ở project Cloudflare Pages **`devtools`** (cấu hình: `wrangler.jsonc`, output `dist/`).

> **KHÔNG bật Git integration cho Cloudflare Pages.** `src_wasm/pkg/` là gitignored nên Pages checkout code sẽ không có wasm → bản deploy hỏng Remote Desktop, .NET Wrapper và 4 tool Craft. Phải build ở máy local rồi đẩy `dist/`.

```bash
npx wrangler login                              # 1 lần

chmod +x ./scripts/deploy_cloudflare.sh
./scripts/deploy_cloudflare.sh                  # deploy (dùng wasm đã build sẵn)
./scripts/deploy_cloudflare.sh --build-wasm     # build lại wasm trước khi deploy
./scripts/deploy_cloudflare.sh --preview        # bản preview, URL tạm
```

Script: (build wasm nếu `--build-wasm`) → `npm install` → `REQUIRE_WASM=1 npm run build` → kiểm tra `dist/index.html` → `wrangler pages deploy dist --project-name devtools`.

Deploy headless/CI: đặt `CLOUDFLARE_API_TOKEN` (quyền **Cloudflare Pages: Edit**), và `CLOUDFLARE_PROJECT_NAME` nếu deploy sang project khác.

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
| `scripts/deploy_cloudflare.sh` | Deploy thủ công Cloudflare Pages (build wasm + `REQUIRE_WASM=1 npm run build` → `wrangler pages deploy`) |