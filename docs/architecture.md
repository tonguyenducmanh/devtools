# Kiến trúc DevTools

## 1. Mô hình Client–Daemon

| Thành phần             | Công nghệ                 | Vị trí         | Vai trò                                                    |
| ---------------------- | ------------------------- | -------------- | ---------------------------------------------------------- |
| Frontend (Client)      | Vue 3 + Vite 8 (rolldown) | `src/`         | SPA chạy trên browser, host độc lập hoặc do daemon phục vụ |
| Backend (Agent/Daemon) | Go 1.25                   | `src_backend/` | 3 module: cấu hình, lõi dịch vụ, ứng dụng                  |
| WASM                   | Rust / .NET 10            | `src_wasm/`    | Remote Desktop, .NET Wrapper, PhotoCraft, VectorCraft, GridCraft, WordCraft |

Frontend không nhúng "trái tim" logic nặng; những việc cần máy nội bộ (SQLite, proxy RDP, đọc/ghi file, mock server, PostgreSQL) đều đi qua agent API HTTP ở cổng **7777** (mặc định). Web UI của daemon là cổng **1403**, mock server là cổng **8888**.

## 2. Frontend (Vue 3 SPA)

### Bootstrap

`src/main.js` → `createApp(App)`; đăng ký 2 directive, global objects (`$tmCache`, `$tmEnum`, `$tmUtility`, `$tmEventBus`), ~17 component global, i18n, toast, context-menu; khởi tạo Monaco workers; `await loadLocaleDefault()` rồi mount.

`src/App.vue` bố trí: `TMHeaderApp` / `TMSidebar` / `TMDynamicTabView` / `TMFooterApp` + hiệu ứng. `created()` gọi `TMAppStartup.initialize()`: nạp user settings, set `window.__tmAPI.automation.agentURL`, áp theme, đóng băng `window.__env`, set title.

### Điều hướng — tab system (không vue-router)

- `src/stores/TMTabManager.js`: `{tabs[], activeTabId}`; `openTab({titleKey, helpKey, groupKey, toolKey, component, checkExisting})` lazy-load component; tabId = `ComponentName-<guid>`. Mỗi tab lưu thêm cờ layout đã resolve từ config (`contentFlush`, `confirmOnClose`) bằng helper nội bộ `getToolContentLayout(groupKey, toolKey)`.
- `src/views/misc/TMDynamicTabView.vue`: thanh tab (drag-drop, close giữa chuột, duplicate, zen mode) + render tool active. `.tm-tab-content` có padding mặc định, thêm class `tm-tab-content-flush` khi tab active khai báo `contentFlush`; mọi thao tác đóng tab (nút X, chuột giữa, context menu, Alt+Q, đóng tất cả) đi qua `onCloseTab/onCloseTabs/onExitTabMode` → `TMDialogUtil.confirm()` nếu tab cần xác nhận.
- `src/stores/TMToolConfigs.js`: mảng `sidebarConfig` là nguồn duy nhất đăng ký tool (chỉ chứa cấu hình, không xử lý logic). Kiểu: `route`, `group` (flyout nhiều con), `automation`. Helper đọc cấu hình: `getSidebarItems()`, `getGroupConfig(groupKey)`, `getAllSearchableRoutes()`.

### Tầng request

`TMHttpClient` (fetch) → `TMBaseAPI` (URL = baseUrl + controller + endpoint; generic CRUD `getAll/create/update/deleteById`; `getTree`) → các class `src/common/api/request/AgentAPI/*`:

- `TMAgentAPI` — `getBaseUrl()` đọc `window.__tmAPI?.automation?.agentURL`; `heathCheck()` (GET `/`).
- `TMServerTestingAPI` — test API (exec, parallel, import batch, file ops).
- `TMServerMockAPI`, `TMServerPostgreSQLAPI`, `TMServerRDPAPI`, `TMServerAppDataMiner`, `TMTerminalAPI`.

### Cầu nối global

- `window.__env` (từ `src/cfg/config.js`): appName, theme mặc định, `githubSource.url/releasesUrl`, `APITesting.agentServer` (default `http://localhost:7777`).
- `window.__tmAPI` (từ `src/common/automation/TMAutomation.js`, set trong `TMAppStartup`): `automation.agentURL` + các method inject (`parseCURL`, http helpers…); `dotnetExports` (.NET WASM, từ `TMDotNetWasmMixin`).

### i18n

`src/i18n/i18nData.js`: reactive `{locale, fallbackLocale:"vi", messages}`, tích hợp qua `app.use`, `$t`/`$te`. Mỗi locale (`en/`, `vi/`) gồm 5 file: `i18nCommon`, `i18nUserSettings`, `i18nHelp`, `i18nTemplate`, `i18nTip` + `global/i18nGlobal.js`. `loadLocale(locale)` dynamic import; mặc định theo user setting `currentLanguage`.

### Dialog & Toast

- Dialog: `TMDialogUtil` + `TMDialogEnum` (append-only) + `DialogComponentMap` → mount **Vue app riêng** kế thừa appContext; `confirm()` promise; ESC/closeById/closeAll.
- Toast: `TMToastPlugin` → singleton `toast`, dùng `this.$tmToast.success/error/warning/info(...)`.

## 3. Backend (Go, 3 module)

| Module            | Mô tả                                                                                                                                                                                                                    | Ghi chú                                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `tm_config`       | `TMCenterConfig` + defaults, `GetConfigGlobal()` singleton (tìm `config/config.json` đi ngược từ exe; sinh file mặc định nếu thiếu), `var Version` (ldflags)                                                             | module lá: không require module nào; được `tm_core_service` và `tm_app` tham chiếu qua `replace tm_config => ../tm_config` |
| `tm_core_service` | Thư viện lõi: `external/api_app/tm_api_builder.go`, `external/web_app/tm_web_builder.go`, `internal/router/*`, `internal/service/*`, `internal/database/*` (+ `migrations/` 0001–0003), `internal/middleware/tm_cors.go` | requires tm_config (replace); gorilla/websocket, pgx, modernc sqlite, lipgloss                                             |
| `tm_app`          | 2 binary: `cmd/api_app` (chỉ API), `cmd/daemon_app` (chạy API app + Web app song song goroutine, gated bởi `cfg.APIConfig.Enable`/`cfg.WebConfig.Enable`)                                                                | replace tm_core_service + tm_config                                                                                        |

### Cổng & cấu hình

```jsonc
// src_backend/tm_app/cmd/api_app/config.json (gitignored, mẫu local)
{
  "api_config": { "port": 7777, "enable": true },
  "web_config": { "port": 1403, "enable": true },
  "mock_api_config": { "port": 8888 },
  "http_client_config": {
    "max_idle_conns": 200,
    "client_timeout": 180000000000,
  },
  "database_name": "dev_tool.db",
  "endpoint_case_sensitive": false,
}
```

SQLite: `dev_tool.db` cạnh exe, WAL, `foreign_keys=ON`, migration chạy lúc khởi động (`internal/database/migrations/`, idempotent).

### API surface (router)

| File                   | Endpoint                                                                                                                            |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `rt_common.go`         | `GET /{$}` — health check `{success, message, beVersion}` (BE version = `tm_config.Version`; `{$}` = khớp chính xác root, Go 1.22+) |
| `rt_api_testing.go`    | `POST /api_test/exec`, `/exec_parallel`, `/import_batch`, `/import_pro_mode_batch`; CRUD + `get_tree` cho collections               |
| `rt_mock_api.go`       | CRUD + `get_tree` `mock_api`/`mock_group`; `GET /mock_api/restart_mock_server`, `/get_base_url`; `POST /import_batch`               |
| `rt_rdp.go`            | `GET /rdp/ws` — WebSocket proxy RDP (RDCleanPath: parse ASN.1 DER, TCP→X.224→TLS, relay 2 chiều)                                    |
| `rt_rdp_connection.go` | CRUD + `get_tree` `rdp_connection`/`rdp_connection_group`                                                                           |
| `rt_postgresql.go`     | `POST /postgresql/execute_query`, `/database_ops`, `/database_ops_upload`; `GET /detect_bin_path`; CRUD + `get_tree`                |
| `rt_file_ops.go`       | `POST /file_ops/read_file`, `/read_folder`, `/write_file`                                                                           |
| `rt_app_data_miner.go` | `GET /data_miner/get_all_table_and_columns`; `POST /execute_query` (SQLite introspection)                                           |


Middleware: CORS `Allow-Origin *` + OPTIONS short-circuit; path lowercasing mặc định (`endpoint_case_sensitive: false`); route kiểu Go 1.22+ method-pattern (`app.HandleFunc("POST /x", …)`).

### Mẫu CRUD generic (quan trọng)

- `internal/model/tm_base_model.go` — `TMBaseModel` (id, created_date, modified_date); model implement interface `TMModelBase { TableName(); PrimaryKey() }`.
- `internal/database/dl_base.go` — `TMDLBase[T]`: repository reflection theo `json` tags, auto UUID PK, batch, raw query/exec.
- `internal/service/bl_base.go` — `TMBLBase[T]`: controller HTTP generic đăng ký `GET get_all`, `POST create`, `PUT update`, `DELETE delete_by_id`; hook `BeforeInsert/AfterInsert/…/CustomDelete/CustomCreate`.
- `internal/service/bl_collection.go` — `TMCollection[TGroup,TItem]`: master-detail, đăng ký cả 2 + `GET get_tree`; xoá group cascade qua transaction. Dùng bởi 5 tool (api testing, pro-mode, mock api, rdp connection, postgresql connection).

### Web server (daemon)

`internal/web/bl_web.go`: `//go:embed all:dist` → phục vụ SPA (fallback `index.html`), force MIME `application/wasm` cho `*.wasm`, auto-open browser sau 500 ms khi có `web_config.enable`.

## 4. WASM (`src_wasm/`)

| Module       | Build                                   | Output (đã commit)                                   | Load bởi                                       |
| ------------ | --------------------------------------- | ---------------------------------------------------- | ---------------------------------------------- |
| IronRDP      | `wasm-pack build --target web`          | `pkg/rdp/rdp_client.js` + `_bg.wasm` (~4,5 MB)       | `TMRemoteDesktopRDP.vue`                       |
| .NET Wrapper | `dotnet publish … AppBundle/_framework` | `pkg/dotnet/` (~3,9 MB)                              | `TMDotNetWasmMixin.js`                         |
| PhotoCraft   | `trunk build --release` + nén wasm gzip | `pkg/photocraft/` (index.html + js + `_bg.wasm.gz`)  | `views/tools/Craft/TMPhotoCraft.vue` (iframe)  |
| VectorCraft  | `trunk build --release` + nén wasm gzip | `pkg/vectorcraft/` (index.html + js + `_bg.wasm.gz`) | `views/tools/Craft/TMVectorCraft.vue` (iframe) |
| GridCraft    | `trunk build --release` + nén wasm gzip | `pkg/gridcraft/` (index.html + js + `_bg.wasm.gz`)   | `views/tools/Craft/TMGridCraft.vue` (iframe)   |
| WordCraft    | `trunk build --release` + nén wasm gzip | `pkg/wordcraft/` (index.html + js + `_bg.wasm.gz`)   | `views/tools/Craft/TMWordCraft.vue` (iframe)   |

Các tool "craft" dùng chung component `src/views/tools/Craft/TMCraftApp.vue`: mỗi tool chỉ là wrapper mỏng truyền `app-key` (`photocraft` / `vectorcraft` / `gridcraft` / `wordcraft`), component tính `iframe src = /assets-wasm-<version>/<appKey>/index.html`.

`vite.config.js` (viteStaticCopy): copy `pkg/dotnet/*` → `assets-wasm-<VERSION>/`; `pkg/rdp/*` → `assets-wasm-<VERSION>/rdp/`; `pkg/<craft>/*` → `assets-wasm-<VERSION>/<craft>/`. Runtime nạp theo đường dẫn tuyệt đối `assets-wasm-<version>/…` (DEV cũng được serve bởi plugin static-copy middleware). Alias `@wasm` → `src_wasm` (dùng cho dotnet khi dev).

## 5. Luồng build & phát hành

```text
VERSION=1.2.3 ./build_all.sh
 ├─ scripts/tm_version.sh        → version + ldflags
 ├─ scripts/build_wasm.sh        → (tùy chọn, đang comment) build IronRDP + .NET + 2 craft tool
 ├─ scripts/build_web_for_daemon.sh → npm install && npm run build
 │      └─ copy dist/ → src_backend/tm_core_service/internal/web/dist/  (go:embed)
 ├─ scripts/build_api.sh         → out/dev-tool-api-{mac-arm|linux|window}
 └─ scripts/build_daemon.sh      → out/dev-tool-{mac-arm|linux|window}-<VERSION> (nhúng frontend)
```

Version: `VERSION` env > `package.json.version`; `vite.config.js` đặt `import.meta.env.PACKAGE_VERSION`; `tm_version.sh` tạo `-X tm_config.Version=…`. UI version và BE version luôn khớp, frontend tự so sánh qua health check (hiện cảnh báo "agent not found"/version lệch).

## 6. Một luồng dữ liệu điển hình (tool gọi backend)

```text
Tool (TM*.vue) → new TMServerXxxAPI()          // không truyền baseUrl
                → TMAgentAPI.getBaseUrl()      // window.__tmAPI.automation.agentURL
                → TMHttpClient (fetch)         → POST http://<agentURL>/<controller>/<action>
                → CORS allow *                  → router rt_*.go → service/bl_*.go
                → database/dl_*.go (SQLite)     → { success, message, data }
```

Web-only (không daemon): tool cần agent sẽ báo "agent not found"; header có link "Download agent" trỏ GitHub Releases.

## 7. Ghi chú huyền thoại / legacy

- `vite.main.config.mjs`, `vite.preload.config.mjs`, `package.json "main": ".vite/build/main.js"` là tàn dư thời Electron (nhánh backup `feature/electronjs_backup`, `feature/tauri_rust_backup`). Hiện tại không còn desktop shell.
- Không có CI workflow (chưa có `.github/`).
