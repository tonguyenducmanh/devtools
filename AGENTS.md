# AGENTS.md: hướng dẫn cho AI agent và người đóng góp

DevTools (tên hiển thị **Tools**, repo GitHub `tonguyenducmanh/devtools`) là một bộ sưu tập công cụ dành cho lập trình viên, mô hình **Client–Daemon**:

- **Frontend (Client):** Vue 3 SPA chạy trên browser (`src/`), có thể host độc lập (Cloudflare Pages) hoặc được daemon phục vụ.
- **Backend (Daemon/Agent):** Go, 3 module riêng trong `src_backend/` (`tm_config`, `tm_core_service`, `tm_app`). Daemon lo phần cần máy nội bộ: SQLite, RDP over WebSocket, Mock API, PostgreSQL, đọc ghi file.
- **WASM (`src_wasm/`):** IronRDP (Remote Desktop), .NET Wrapper (C#), web app "craft" PhotoCraft — **wasm đã build KHÔNG commit** (nằm ở `src_wasm/pkg/`, gitignored ~58 MB), KHÔNG dùng git submodule. Cloudflare Pages deploy **thủ công** qua `scripts/deploy_cloudflare.sh`.

Quy ước toàn repo: tiền tố frontend `TM*`, backend file `tm_*.go` với tiền tố tầng (`bl_` service, `dl_` database, `rt_` router). Ngôn ngữ giao diện & tài liệu chính là **tiếng Việt**; i18n hỗ trợ `en`/`vi` (fallback `vi`). **Đọc file này trước, rồi `docs/`.**

## 1. Định hướng (5 phút)

| Đọc                           | Vì sao                                                                               |
| ----------------------------- | ------------------------------------------------------------------------------------ |
| `docs/architecture.md`        | Sơ đồ client–daemon, cấu trúc frontend/backend/WASM, mẫu CRUD generic, các cổng mạng |
| `docs/development.md`         | Build, chạy, debug, version/release, thứ tự build bắt buộc                           |
| `docs/contributing.md`        | Luật đóng góp; checklist "thêm một tool" và "thêm một API"                           |
| `src/stores/TMToolConfigs.js` | Nơi duy nhất đăng ký tool/sidebar (`sidebarConfig`)                                  |
| `README.md`                   | Tổng quan, cài đặt, phần WASM                                                        |
| `scripts/tm_version.sh`       | Cơ chế version duy nhất (UI + BE luôn khớp)                                          |

## 2. Bản đồ workspace

```text
src/                            Frontend Vue 3 SPA (Vite 8 / rolldown)
  main.js App.vue               Bootstrap: global components, plugin, load locale
  cfg/config.js                 window.__env (bundle vào entry, có hash/version)
  stores/                       Store tự viết (không Pinia): TMTabManager (tab), TMToolConfigs (tool/sidebar), TMAppState
  common/                       TMUtility, TMDialogUtil+TMDialogEnum, TMToastPlugin, api/request/AgentAPI,
                                automation/ (window.__tmAPI), cache/ (mã hoá AES-GCM), proto/, mock/, plugin/,
                                worker/ (TMWorkerPool — pool Web Worker dùng chung), qrcode/ (TMQRCodeWorker + client)
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
  ultraviewer → pkg/ultraviewer UltraViewer client (Rust, wasm-pack) — xem Luật 14
  dotnet_wrapper → pkg/dotnet   .NET 10 browser-wasm (AppBundle/_framework)
  photocraft → pkg/photocraft    Static site PhotoCraft (trunk, wasm nén gzip)
scripts/                        tm_version.sh, build_api.sh, build_daemon.sh, build_web_for_daemon.sh,
                                build_wasm.sh, fetch_wasm_sources.sh, git_pull_if_repo.sh,
                                wasm_dist_common.sh + patch_wasm_dist.py (nén wasm dùng chung), remove_*.sh,
                                deploy_cloudflare.sh (deploy thủ công Cloudflare Pages)
vite.config.js                  Build frontend; viteStaticCopy wasm → dist/assets-wasm-<VERSION>/…;
                                worker.rollupOptions.output cho tên file worker (xem Luật 13)
wrangler.jsonc                  Cloudflare Pages config (project `devtools`, output `dist/`)
```

**Thứ tự phụ thuộc bất biến:** WASM phải build trước `npm run build` (vì `viteStaticCopy` lấy từ `src_wasm/pkg/*`), và frontend phải build trước `build_daemon.sh` (vì `internal/web/bl_web.go` có `//go:embed all:dist`).

## 3. Luật vàng

1. **Frontend luôn build được.** `npm run build` phải xanh mỗi lần thay đổi. Vite 8 dùng rolldown — không phá `build.rolldownOptions`, không phá naming có bản quyền `assets/tjs-...`/`tas-...` (đã gắn version chống cache CDN). Thiếu wasm chỉ cảnh báo (`vite.config.js` bỏ qua folder rỗng); build phát hành thì dùng `REQUIRE_WASM=1` để fail sớm.
2. **Backend luôn build được.** Build cả 3 module: `go build ./...` trong `tm_config`, `tm_core_service`, `tm_app`. Giữ đúng `replace` directives trong `go.mod`; không thêm dependency nặng không cần thiết.
3. **API response chuẩn.** Mọi endpoint trả `{success, message, data}`. Lỗi nhập liệu/file hỏng → trả lỗi nhẹ nhàng, KHÔNG panic server, KHÔNG sập daemon. Đừng chỉ dựa vào panic-safe; tự kiểm tra input.
4. **Mẫu CRUD generic là chuẩn.** Backend: model implement `TableName()`/`PrimaryKey()`, dùng `TMDLBase[T]` (data) + `TMBLBase[T]` (controller); tool master-detail dùng `TMCollection[TGroup,TItem]` (tự đăng ký CRUD + `get_tree`, xoá group cascade). Không tự viết router/DB riêng lẻ kiểu copy-paste khi có thể tái dùng mẫu này.
5. **Tool mới = TMToolBase + sidebarConfig + i18n.** Mỗi tool extends `TMToolBase`, đăng ký lazy `import()` trong `TMToolConfigs.js` (group `groupKey` hoặc route), tiêu đề qua `meta.titleKey` (không hard-code chuỗi), thêm Help component trong `views/helps/` khi cần. Tab được quản lý bằng `TMTabManager` (không vue-router).
6. **i18n bắt buộc.** Dùng `$t("i18nCommon...")`; mọi key phải có ở cả `en/` và `vi/` (fallback `vi`). Tool title qua `meta.titleKey`. Không viết chuỗi tiếng Việt cứng trong component trừ khi là comment.
7. **Thứ tự build.** WASM → `npm run build` → copy `dist/` vào `src_backend/tm_core_service/internal/web/dist/` → `build_daemon.sh`. Bỏ sót một bước là daemon không chạy (`go:embed` lỗi) hoặc wasm 404.
8. **Version 1 nguồn duy nhất.** `VERSION=1.2.3 ./build_all.sh` (hoặc `package.json.version`). `tm_version.sh` tạo ldflags `-X tm_config.Version=...` cho Go và `import.meta.env.PACKAGE_VERSION` cho UI. Không tự ý sửa version rải rác.
9. **WASM đã build KHÔNG commit.** `src_wasm/pkg/` gitignored (~58 MB) — đừng `git add -f` thư mục này. Cloudflare Pages cũng **KHÔNG được bật Git integration** (Pages checkout code không có wasm → bản deploy hỏng); deploy bằng `scripts/deploy_cloudflare.sh` (build local → `wrangler pages deploy`). Khi build lại wasm, source được `scripts/git_pull_if_repo.sh` cập nhật về nhánh mặc định rồi mới build.
10. **`window.__tmAPI` là cầu nối chung.** `automation.agentURL` quyết định URL agent (UI tự đọc để gọi API); `automation.*` là các hàm inject cho tool Automation; `dotnetExports` từ .NET WASM. Đừng đổi shape tùy tiện mà không cập nhật tất cả nơi dùng.
11. **Dialog enum append-only.** `TMDialogEnum` + `DialogComponentMap` nằm trong `src/common/TMDialogUtil.js`. Thêm dialog mới = thêm enum ở CUỐI `TMDialogEnum` + mapping trong `DialogComponentMap` + component trong `views/dialogs/`. Không đổi/đảo số enum cũ.
12. **Không commit artifact.** `dist/`, `out/`, `node_modules/`, `config.json`, `*.db*`, `src_wasm/pkg/`, `src_wasm/*/external_repo/` đều gitignore. `build_daemon.sh` nén 3 binary cuối cùng (mac/linux → `.tar.gz`, window → `.zip`) rồi xoá bản thô, nên `out/` chỉ còn file upload release — upload thẳng cả thư mục.
13. **Tác vụ nặng phải tách Web Worker.** Bất kỳ thứ gì block >~200ms trên main thread (đọc/ghi ảnh, encode giải mã, parse lớn, tính toán lặp) là bug UX — app đứng hình, user không click được tab khác. Dùng `TMWorkerPool` (`src/common/worker/TMWorkerPool.js`) + một worker file riêng. Mẫu tham chiếu: `src/common/qrcode/TMQRCodeWorker.js`.
    - **3 lỗi phải tránh** (đều đã dính rồi, đừng lặp lại):
      1. `new Worker(new URL("./x.js", import.meta.url), {type:"module"})` phải nằm **LITERALLY** trong module gọi. Truyền `new Worker(urlVar)` sẽ **không** được Vite transform → build xong worker không tồn tại, chạy lúc mới lộ. (Plugin `vite:worker-import-meta-url` chỉ match regex lồng nhau.)
      2. **Không** truyền object reactive của Vue (Proxy), function, hay DOM node vào worker — structured-clone không hỗ trợ → `DataCloneError`. Hằng số config đặt ở **ngoài component** (module scope) hoặc dùng `markRaw()`.
      3. Worker **không có DOM**. Dùng `createImageBitmap(blob)` thay `Image`/`FileReader`, `OffscreenCanvas` thay `document.createElement("canvas")`, `ImageData` thì có sẵn. Chỉ giữ lại phần cần DOM (vd QrScanner, ZXing) làm fallback ở main thread.
    - **Protocol** (giữ nguyên cho mọi worker): `main → worker: {id, type, payload}`; `worker → main: {id, final:true, ok, result|error}` và `{id, final:false, …}` cho progress. Task trong worker phải **serialize bằng chuỗi promise** (pool giả định 1 worker chạy 1 task/lần).
    - **Bắt buộc:** xử lý `message.id` của task mới nhất trong component (token/generation id) để lần gọi sau không bị lần trước đè; và **báo tiến trình** (spinner + x/y) vì tác vụ vẫn mất vài giây.
    - **Naming:** worker được Vite bundle **riêng**, KHÔNG đi qua `build.rolldownOptions.output`. Muốn giữ prefix `tjs-`/`tas-` + version (Luật 1) thì phải khai báo thêm `worker.rollupOptions.output` trong `vite.config.js` — nếu không, file worker sẽ tên trần, mất version chống cache CDN.
14. **Port code của dự án khác phải ghi rõ nguồn.** Khi chuyển code từ dự án khác về (vd module `src_wasm/ultraviewer/` port từ [MacViewer](https://github.com/DeanOpen/MacViewer) của DeanOpen, giấy phép MIT) thì BẮT BUỘC:
    - Giữ nguyên giấy phép gốc trong thư mục đó (vd `LICENSE-MacViewer`) và ghi rõ tên tác giả + URL repo.
    - Mỗi file được port phải có header trỏ về nguồn (xem `src_wasm/ultraviewer/src/*.rs`).
    - Ghi rõ trong README của module: file nào port từ đâu, file nào viết mới, và tài nguyên bên thứ ba nào kèm theo (vd `8bit.dat` là từ điển zstd của UltraViewer, **không** phải mã nguồn mở).
    - Nêu nguồn trong `README.md`/`docs/` của repo nếu là tính năng người dùng thấy được.
15. **Module WASM không được link thư viện C.** Crate `cc` (mà `zstd-sys` dùng) **KHÔNG** phát `cargo:rustc-link-lib` cho target `wasm32-unknown-unknown` → toàn bộ hàm C thành import từ module `"env"` mà trình duyệt không có → **module wasm không instantiate được**: tool chết ngay lúc load mà log không nói gì (WebSocket mở nhưng không có byte nào chạy). Dùng crate Rust thuần (vd `ruzstd` thay `zstd-safe`).
    - Kiểm tra sau mỗi lần build wasm: import section của file `.wasm` **không được có** module `"env"`. Script kiểm tra: xem `wasm-tools`/`wasm-objdump`, hoặc đọc trực tiếp import section (byte 2 của file wasm).
    - `wasm-bindgen` của module Rust phải **khớp phiên bản** với CLI mà `wasm-pack` dùng, nếu không glue sinh ra sẽ hỏng (thiếu import, file `_bg.js` không được tạo). Xem `Cargo.lock` của module `iron_rdp` (0.2.114) và dùng đúng phiên bản đó cho module mới.
16. **WebSocket từ WASM phải chờ `open` mới gửi được.** `new WebSocket(url)` trả về ở trạng thái `CONNECTING`; gọi `send()` ngay sẽ ném lỗi `InvalidStateError` và message **không bao giờ tới đích**. Phải xếp hàng đợi message rồi gửi trong callback `onopen`.

## 4. Chọn việc làm

Ưu tiên: hạ tầng/refactor an toàn → tool có giá trị sử dụng cao → long tail.

0. **Đọc README + `docs/`** trước để nắm vòng đời build.
1. **Mở app (`npm run dev`)** xem sidebar: tool Automation là route riêng (`type: "automation"`); các nhóm group: API, QRCode, Database, RemoteDesktop, Text, JSON, SampleCode, Image, AI, Miscellaneous.
2. Tool mới nên bám theo nhóm hiện có trong `sidebarConfig`, đặt tên `TM<Thing>.vue` theo chuẩn.
3. Backend: kiểm tra endpoint đã có trong `rt_*.go`; chỉ thêm khi tool thật sự cần agent (cần máy nội bộ / nhạy cảm).
4. Trước khi tối ưu code, hỏi: "việc này có block main thread không?" — nếu có thì tách worker (Luật 13) chứ đừng tối ưu/thêm `await` giả.
5. Không có file roadmap — ghi ý tưởng vào commit message hoặc issue GitHub, không tự tạo `docs/roadmap.md` trừ khi được yêu cầu.

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
./scripts/build_wasm.sh                       # build rdp + ultraviewer + dotnet + craft tool
npm run build                                 # build lại vì viteStaticCopy lấy từ pkg/

# Module WASM viết bằng Rust (CHỈ khi đụng src_wasm/<module>)
cd src_wasm/ultraviewer && cargo test         # 79 test: giao thức + end-to-end với relay giả lập
cd src_wasm/ultraviewer && cargo build --target wasm32-unknown-unknown --lib
```

- **Sau khi build wasm mới, kiểm tra import section** (Luật 15): file `.wasm` không được có import từ module `"env"`. Nếu có, module sẽ không load được trong trình duyệt:
  ```sh
  python3 -c "d=open('src_wasm/pkg/ultraviewer/ultraviewer_client_bg.wasm','rb').read(); print('CÓ import env — module sẽ hỏng!' if b'\x03env' in d[:2000] else 'OK')"
  ```

- **Test:** repo CHƯA có framework test frontend; tự kiểm tra thủ công trên `npm run dev`. Với Go, chạy `go test ./...` của module đụng đến (hiện có `dl_group_test.go`, `bl_collection_test.go`). Với module Rust (`src_wasm/ultraviewer`), chạy `cargo test` — phần giao thức viết để test được native, không cần trình duyệt.
- **Module WASM viết bằng Rust phải tách phần giao thức khỏi phần WASM.** `src_wasm/ultraviewer/src/{wire,messages,screen,input,chat,clipboard}.rs` là Rust thuần (test được native); phần gắn với trình duyệt nằm riêng trong `wasm_glue.rs` (`#[cfg(target_arch = "wasm32")]`). Không dùng thread/`std::net` trong module WASM — trình duyệt không có; mọi I/O đi qua WebSocket tới daemon.
- **Đụng Web Worker thì phải verify cả 2 lớp** — `npm run build` xanh KHÔNG đủ:
  1. **Dev server**: `curl http://localhost:<port>/src/<path>/<File>WorkerClient.js` → phải thấy `new URL("...Worker.js?worker_file&type=module", ...)` trong code đã transform. Đây là lỗi #1 ở Luật 13, dev mode lộ ra trước.
  2. **File worker có thật trong `dist/`**: `ls dist/assets/ | grep -i worker` → file phải có prefix `tjs-` + version (Luật 13, naming).
  3. **Chạy thật trong browser**: bundle worker là file IIFE/ESM tự đăng ký listener `message`, nên load nó vào trang test rồi post message trực tiếp là smoke-test nhanh nhất — đây là cách bắt được lỗi `DataCloneError` và lỗi DOM API mà Node không lộ (Node thiếu `OffscreenCanvas`/`createImageBitmap` thật).
  4. **Đo main thread còn phản hồi**: bọc tác vụ bằng `setInterval(ticks++, 16)` rồi đếm tick trong lúc chờ. Nếu tick ≈ 0 → main thread đang block (tức là tác vụ chạy sai chỗ).
- Commit nhỏ, rõ ràng, 1 ý/commit. Cập nhật `README.md` / `docs/` nếu hành vi hoặc bước build thay đổi.
- Không commit các file artifact nêu trong Luật 12.

## 6. Agent song song

- Không chạy `npm run build` hay `go build` đồng thời vào cùng cache build (`dist/`, module Go) — chờ nhau, đừng sửa file artifact của nhau.
- Mỗi agent chỉ sửa file mình được giao. File dùng chung (`TMToolConfigs.js`, `TMDialogUtil.js`, `i18n/*`, `internal/router/*`, `go.mod`) sửa tối thiểu, đọc lại trước khi sửa.
- Không build lại wasm nếu không cần (tốn thời gian: Rust/.NET/trunk).
- Dev server: mỗi agent dùng port riêng nếu cần (`npm run dev -- --port 5180`).

## 7. Theo dõi ở đâu

- **Git + GitHub** `tonguyenducmanh/devtools`. Version release theo tag `v<version>` (hiện có `v17.x … v19.x`); `scripts/remove_old_tag.sh` dọn tag cũ (giữ danh sách `EXCLUDE_TAGS`).
- **Release binary:** `build_all.sh` → `out/dev-tool-{mac-arm|linux|window}-<VERSION>` (daemon nhúng frontend), đăng lên GitHub Releases (`window.__env.githubSource.releasesUrl`, mục "Download agent" bên header).
- **Deploy web:** Cloudflare Pages project `devtools` — `./scripts/deploy_cloudflare.sh` (thủ công, xem Luật 9). KHÔNG bật Git integration trên Cloudflare.
- **Tài liệu:** `README.md` (tổng quan) + `docs/` (AI-ready: architecture, development, contributing).
