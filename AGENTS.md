# AGENTS.md: hướng dẫn cho AI agent và người đóng góp

DevTools (tên hiển thị **Tools**, repo GitHub `tonguyenducmanh/devtools`) là một bộ sưu tập công cụ dành cho lập trình viên, mô hình **Client–Daemon**:

- **Frontend (Client):** Vue 3 SPA chạy trên browser (`src/`), có thể host độc lập (Cloudflare Pages) hoặc được daemon phục vụ.
- **Backend (Daemon/Agent):** Go, 3 module riêng trong `src_backend/` (`tm_config`, `tm_core_service`, `tm_app`). Daemon lo phần cần máy nội bộ: SQLite, RDP over WebSocket, Mock API, PostgreSQL, đọc ghi file.
- **WASM (`src_wasm/`):** IronRDP (Remote Desktop), .NET Wrapper (C#), PhotoCraft — **file wasm đã build được commit thẳng** vào `src_wasm/pkg/`, KHÔNG dùng git submodule.

Quy ước toàn repo: tiền tố frontend `TM*`, backend file `tm_*.go` với tiền tố tầng (`bl_` service, `dl_` database, `rt_` router). Ngôn ngữ giao diện & tài liệu chính là **tiếng Việt**; i18n hỗ trợ `en`/`vi` (fallback `vi`). **Đọc file này trước, rồi `docs/`.**

## 1. Định hướng (5 phút)

| Đọc | Vì sao |
|---|---|
| `docs/architecture.md` | Sơ đồ client–daemon, cấu trúc frontend/backend/WASM, mẫu CRUD generic, các cổng mạng |
| `docs/development.md` | Build, chạy, debug, version/release, thứ tự build bắt buộc |
| `docs/contributing.md` | Luật đóng góp; checklist "thêm một tool" và "thêm một API" |
| `src/stores/TMToolConfigs.js` | Nơi duy nhất đăng ký tool/sidebar (`sidebarConfig`) |
| `README.md` | Tổng quan, cài đặt, phần WASM |
| `scripts/tm_version.sh` | Cơ chế version duy nhất (UI + BE luôn khớp) |

## 2. Bản đồ workspace

```text
src/                            Frontend Vue 3 SPA (Vite 8 / rolldown)
  main.js App.vue               Bootstrap: global components, plugin, load locale
  cfg/config.js                 window.__env (bundle vào entry, có hash/version)
  stores/                       Store tự viết (không Pinia): TMTabManager (tab), TMToolConfigs (tool/sidebar)
  common/                       TMUtility, TMDialogUtil+TMDialogEnum, TMToastPlugin, api/request/AgentAPI,
                                automation/ (window.__tdAPI), cache/ (mã hoá AES-GCM), proto/, mock/, plugin/
  components/                   ~29 component TM*.vue dùng chung
  mixins/                       TMLayoutConfigMixin, TMCollectionMixin, TMDotNetWasmMixin, ...
  views/tools/                  Các tool (extends base/TMToolBase.vue); APITesting/, PostgreSQLQuery/, codeTemplateTools/
  views/helps/                  Help component tương ứng từng tool
  views/dialogs/                Popup (TMDialogEnum → DialogComponentMap)
  views/misc/                   Header/Sidebar/TabView/Footer/Welcome/UserSettings
  i18n/                         i18nData (không vue-i18n); en/ + vi/, mỗi locale 5 file
src_backend/                    Backend Go 1.25 (3 module riêng)
  tm_config/                    Config singleton + var Version (gắn qua ldflags)
  tm_core_service/              Thư viện lõi: internal/router/, service/, database/ (+migrations), middleware/
  tm_app/                       Binary: cmd/api_app (chỉ API), cmd/daemon_app (API + Web embed dist)
src_wasm/                       Nguồn WASM
  iron_rdp → pkg/rdp            RDP client (Rust, wasm-pack)
  dotnet_wrapper → pkg/dotnet   .NET 10 browser-wasm (AppBundle/_framework)
  photocraft → pkg/photocraft   Static site PhotoCraft (trunk, wasm nén gzip)
scripts/                        tm_version.sh, build_api.sh, build_daemon.sh, build_web_for_daemon.sh,
                                build_wasm.sh, fetch_wasm_sources.sh, git_pull_if_repo.sh, remove_*.sh
vite.config.js                  Build frontend; viteStaticCopy wasm → dist/assets-wasm-<VERSION>/…
```

**Thứ tự phụ thuộc bất biến:** WASM phải build trước `npm run build` (vì `viteStaticCopy` lấy từ `src_wasm/pkg/*`), và frontend phải build trước `build_daemon.sh` (vì `internal/web/bl_web.go` có `//go:embed all:dist`).

## 3. Luật vàng

1. **Frontend luôn build được.** `npm run build` phải xanh mỗi lần thay đổi. Vite 8 dùng rolldown — không phá `build.rolldownOptions`, không phá naming có bản quyền `assets/tjs-...`/`tas-...` (đã gắn version chống cache CDN).
2. **Backend luôn build được.** Build cả 3 module: `go build ./...` trong `tm_config`, `tm_core_service`, `tm_app`. Giữ đúng `replace` directives trong `go.mod`; không thêm dependency nặng không cần thiết.
3. **API response chuẩn.** Mọi endpoint trả `{success, message, data}`. Lỗi nhập liệu/file hỏng → trả lỗi nhẹ nhàng, KHÔNG panic server, KHÔNG sập daemon. Đừng chỉ dựa vào panic-safe; tự kiểm tra input.
4. **Mẫu CRUD generic là chuẩn.** Backend: model implement `TableName()`/`PrimaryKey()`, dùng `TMDLBase[T]` (data) + `TMBLBase[T]` (controller); tool master-detail dùng `TMCollection[TGroup,TItem]` (tự đăng ký CRUD + `get_tree`, xoá group cascade). Không tự viết router/DB riêng lẻ kiểu copy-paste khi có thể tái dùng mẫu này.
5. **Tool mới = TMToolBase + sidebarConfig + i18n.** Mỗi tool extends `TMToolBase`, đăng ký lazy `import()` trong `TMToolConfigs.js` (group `groupKey` hoặc route), tiêu đề qua `meta.titleKey` (không hard-code chuỗi), thêm Help component trong `views/helps/` khi cần. Tab được quản lý bằng `TMTabManager` (không vue-router).
6. **i18n bắt buộc.** Dùng `$t("i18nCommon...")`; mọi key phải có ở cả `en/` và `vi/` (fallback `vi`). Tool title qua `meta.titleKey`. Không viết chuỗi tiếng Việt cứng trong component trừ khi là comment.
7. **Thứ tự build.** WASM → `npm run build` → copy `dist/` vào `src_backend/tm_core_service/internal/web/dist/` → `build_daemon.sh`. Bỏ sót một bước là daemon không chạy (`go:embed` lỗi) hoặc wasm 404.
8. **Version 1 nguồn duy nhất.** `VERSION=1.2.3 ./build_all.sh` (hoặc `package.json.version`). `tm_version.sh` tạo ldflags `-X tm_config.Version=...` cho Go và `import.meta.env.PACKAGE_VERSION` cho UI. Không tự ý sửa version rải rác.
9. **Không phá WASM đã commit.** `src_wasm/pkg/*` được commit thẳng để CI/Cloudflare chỉ cần `npm run build`. Khi build lại wasm, source được `scripts/git_pull_if_repo.sh` cập nhật về nhánh mặc định rồi mới build.
10. **`window.__tdAPI` là cầu nối chung.** `automation.agentURL` quyết định URL agent (UI tự đọc để gọi API); `automation.*` là các hàm inject cho tool Automation; `dotnetExports` từ .NET WASM. Đừng đổi shape tùy tiện mà không cập nhật tất cả nơi dùng.
11. **Dialog enum append-only.** Thêm dialog mới = thêm enum ở CUỐI `TMDialogEnum` + mapping trong `DialogComponentMap` + component trong `views/dialogs/`. Không đổi/đảo số enum cũ.
12. **Không commit artifact.** `dist/`, `out/`, `node_modules/`, `config.json`, `*.db*`, `src_wasm/*/external_repo/` đều gitignore.

## 4. Chọn việc làm

Ưu tiên: hạ tầng/refactor an toàn → tool có giá trị sử dụng cao → long tail.

0. **Đọc README + `docs/`** trước để nắm vòng đời build.
1. **Mở app (`npm run dev`)** xem sidebar các nhóm: GraphicDesign, API, Automation, QRCode, Database, RemoteDesktop, Text, JSON, SampleCode, Image, AI, Miscellaneous.
2. Tool mới nên bám theo nhóm hiện có trong `sidebarConfig`, đặt tên `TM<Thing>.vue` theo chuẩn.
3. Backend: kiểm tra endpoint đã có trong `rt_*.go`; chỉ thêm khi tool thật sự cần agent (cần máy nội bộ / nhạy cảm).
4. Không có file roadmap — ghi ý tưởng vào commit message hoặc issue GitHub, không tự tạo `docs/roadmap.md` trừ khi được yêu cầu.

## 5. Trước khi kết thúc task

```sh
# Frontend
npm run dev          # smoke-test tool bị đổi: mở tool, thao tác cơ bản
npm run build        # PHẢI xanh

# Backend (nếu đụng src_backend)
cd src_backend/tm_config && go build ./...
cd ../tm_core_service && go build ./... && go vet ./... && go test ./...   # có 2 test Go hiện có
cd ../tm_app && go build ./...

# WASM (CHỈ khi đụng src_wasm)
./scripts/build_wasm.sh                       # build rdp + dotnet + photocraft
npm run build                                 # build lại vì viteStaticCopy lấy từ pkg/
```

- **Test:** repo CHƯA có framework test frontend; tự kiểm tra thủ công trên `npm run dev`. Với Go, chạy `go test ./...` của module đụng đến (hiện có `dl_group_test.go`, `bl_collection_test.go`).
- Commit nhỏ, rõ ràng, 1 ý/commit. Cập nhật `README.md` / `docs/` nếu hành vi hoặc bước build thay đổi.
- Không commit các file artifact nêu trong Luật 12.

## 6. Agent song song

- Không chạy `npm run build` hay `go build` đồng thời vào cùng cache build (`dist/`, module Go) — chờ nhau, đừng sửa file artifact của nhau.
- Mỗi agent chỉ sửa file mình được giao. File dùng chung (`TMToolConfigs.js`, `TMDialogEnum.js`, `i18n/*`, `internal/router/*`, `go.mod`) sửa tối thiểu, đọc lại trước khi sửa.
- Không build lại wasm nếu không cần (tốn thời gian: Rust/.NET/trunk).
- Dev server: mỗi agent dùng port riêng nếu cần (`npm run dev -- --port 5180`).

## 7. Theo dõi ở đâu

- **Git + GitHub** `tonguyenducmanh/devtools`. Version release theo tag `v<version>` (hiện có `v17.x … v19.x`); `scripts/remove_old_tag.sh` dọn tag cũ (giữ danh sách `EXCLUDE_TAGS`).
- **Release binary:** `build_all.sh` → `out/dev-tool-{mac-arm|linux|window}-<VERSION>` (daemon nhúng frontend), đăng lên GitHub Releases (`window.__env.githubSource.releasesUrl`, mục "Download agent" bên header).
- **Tài liệu:** `README.md` (tổng quan) + `docs/` (AI-ready: architecture, development, contributing).