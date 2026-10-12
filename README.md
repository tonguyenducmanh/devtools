## Dự án: Công cụ Tiện ích cho Lập trình viên - Tổng hợp để tránh triển khai mỗi công cụ trên một trang web riêng biệt

Dự án này cung cấp một bộ sưu tập các công cụ hữu ích dành cho lập trình viên, được tổng hợp với mục tiêu tránh phải triển khai mỗi công cụ trên một trang web riêng biệt.

Đây là một **Ứng dụng Client-Daemon**.

![alt text](imgs/demo.png)

🔗 [https://tomanh.com/](https://tomanh.com/)

---

## Tài liệu (AI-ready)

- [`AGENTS.md`](AGENTS.md) — hướng dẫn ngắn cho AI agent / người đóng góp (đọc trước).
- [`docs/architecture.md`](docs/architecture.md) — kiến trúc Client–Daemon, frontend/backend/WASM.
- [`docs/development.md`](docs/development.md) — build, chạy, debug, version & phát hành.
- [`docs/contributing.md`](docs/contributing.md) — luật đóng góp + checklist thêm tool/API.

---

## Cài đặt

### 1. Clone

Dự án này **không dùng Git Submodules** và **không commit file wasm đã build**: thư mục `src_wasm/pkg/` (wasm build xong, ~58 MB) nằm trong `.gitignore` nên repo clone về rất nhẹ. Vì vậy Cloudflare Pages **không tự build được** — deploy được làm **thủ công** bằng [`scripts/deploy_cloudflare.sh`](scripts/deploy_cloudflare.sh) (build local rồi `wrangler pages deploy`). Source của các dự án ngoài (IronRDP, PhotoCraft, VectorCraft) chỉ được clone **khi bạn muốn build lại wasm**:

```bash
git clone https://github.com/tonguyenducmanh/devtools.git
cd your-main-repo

npm i

# (Tùy chọn) Nếu muốn build lại wasm, chạy scripts/build_wasm.sh
# -> script tự clone nguồn cần thiết về src_wasm/<tên>/external_repo/
```

## Chạy Dự án

### Phiên bản Web (Frontend)

```bash
npm run dev
npm run build
```

### API / Daemon (Backend)

Để build tất cả các dịch vụ backend:

```bash
chmod 777 ./build_all.sh
./build_all.sh
```

`build_all.sh` xuất ra `out/` cho 3 hệ điều hành, kèm bản nén để upload release:

| File | Nén |
|---|---|
| `dev-tool-mac-arm-<VERSION>` | `dev-tool-mac-arm-<VERSION>.tar.gz` |
| `dev-tool-linux-<VERSION>` | `dev-tool-linux-<VERSION>.tar.gz` |
| `dev-tool-window-<VERSION>.exe` | `dev-tool-window-<VERSION>.exe.zip` |

Nén xong binary thô bị xoá, nên `out/` chỉ còn lại file nén — upload thẳng cả thư mục này.

## Cấu hình

Các dịch vụ backend được cấu hình hoặc mặc định thông qua `config/config.json`.

Cấu hình dành riêng cho Frontend có thể tìm thấy tại: `src/cfg/config.js` (được bundle vào entry chunk khi build, không cần config realtime).

### Lưu trữ Dữ liệu (SQLite)

Công cụ này sử dụng **SQLite** (phía Go) để lưu trữ dữ liệu vào một file cục bộ.

- **File Cơ sở dữ liệu**: `dev_tool.db` (như định nghĩa trong `config.json`)
- Tất cả cấu hình, mock API do người dùng định nghĩa, và dữ liệu riêng của từng công cụ đều được lưu trong file này.
- SQLite được sử dụng để đảm bảo tính di động và dễ sao lưu — mọi thứ đều nằm trong thư mục cục bộ của bạn.

## WebAssembly

Thư mục dưới đây chứa nhiều công cụ được viết bằng các ngôn ngữ khác và biên dịch thành wasm để chạy trên ứng dụng web.

[Thư mục Web Assembly](src_wasm)

- **IronRDP** (`src_wasm/iron_rdp`): client RDP (Rust) → `src_wasm/pkg/rdp/`
- **.NET Wrapper** (`src_wasm/dotnet_wrapper`): wrapper C# (.NET 10) → `src_wasm/pkg/dotnet/`
- **PhotoCraft** (`src_wasm/photocraft`): trình chỉnh sửa ảnh (Rust, trunk) → `src_wasm/pkg/photocraft/`
- **VectorCraft** (`src_wasm/vectorcraft`): trình thiết kế vector (Rust, trunk) → `src_wasm/pkg/vectorcraft/`

> `src_wasm/pkg/` là **thư mục output** (gitignored, ~58 MB). Clone repo về sẽ **không có** thư mục này — phải chạy `scripts/build_wasm.sh` một lần để build, hoặc dùng luôn bản build có sẵn ở máy bạn. Deploy Cloudflare cũng vì thế phải chạy **thủ công** (build local → `wrangler pages deploy`), không bật Git integration trên Cloudflare Pages.

Build toàn bộ wasm bằng:

```bash
chmod 777 ./scripts/build_wasm.sh
./scripts/build_wasm.sh
```

Script tự clone nguồn external repo (IronRDP, PhotoCraft, VectorCraft) về `src_wasm/<tên>/external_repo/` nếu chưa có (không dùng git submodule) rồi build. Nếu chỉ muốn lấy nguồn mà chưa build:

```bash
chmod 777 ./scripts/fetch_wasm_sources.sh
./scripts/fetch_wasm_sources.sh
```

> **Trước khi build**, mỗi `build.sh` sẽ đi vào repo nguồn của nó và chạy
> `git pull origin` để lấy source mới nhất **nếu thư mục đó là git repo**
> (helper: `scripts/git_pull_if_repo.sh`). Các repo ngoài **luôn đứng trên nhánh
> mặc định** của origin (không pin commit nữa); nếu repo đang ở detached HEAD thì
> helper tự quay về nhánh mặc định rồi mới pull. Pull/checkout lỗi chỉ cảnh báo
> rồi vẫn tiếp tục build.

### Các tool "craft" (PhotoCraft / VectorCraft)

Các tool này ở sidebar chỉ làm đúng 1 việc: tải wasm về và load lên toàn màn hình trong một `<iframe>` (wasm app hoàn chỉnh, egui + WebGPU/WebGL2). File wasm luôn được `build.sh` nén gzip thành `_bg.wasm.gz` (vừa để dưới giới hạn **25 MiB/file của Cloudflare Pages**, vừa để tải nhanh hơn), `index.html` tự giải nén (DecompressionStream) khi tải. Vì `src_wasm/pkg/` là gitignored, **phải build wasm trước** khi `npm run build` nếu muốn bản build có đủ các tool Craft (thiếu thì `vite` chỉ cảnh báo và bỏ qua folder đó, tool tương ứng sẽ không load được):

```bash
# Cách 1: build riêng một tool
chmod +x ./src_wasm/photocraft/build.sh    # hoặc vectorcraft
./src_wasm/photocraft/build.sh

# Cách 2: build toàn bộ wasm (IronRDP + .NET + 4 craft tool)
chmod 777 ./scripts/build_wasm.sh
./scripts/build_wasm.sh
```

Phần nén wasm + patch `index.html` là logic **dùng chung** cho cả bốn tool, nằm trong
`scripts/wasm_dist_common.sh` và `scripts/patch_wasm_dist.py`.

Chi tiết từng tool: [src_wasm/README.md](src_wasm/README.md).

## Deploy lên Cloudflare Pages (thủ công)

Frontend được host trên Cloudflare Pages dưới tên project **`devtools`**
(cấu hình ở [`wrangler.jsonc`](wrangler.jsonc)).

> ⚠️ **KHÔNG bật Git integration cho Cloudflare Pages.** Repo không chứa
> `src_wasm/pkg/` (wasm đã build, ~58 MB — gitignored), nên Cloudflare chỉ
> checkout code sẽ **không có wasm** và bản deploy sẽ hỏng Remote Desktop,
> .NET Wrapper cùng 4 tool Craft. Phải **build ở máy local rồi đẩy `dist/`**.

Đăng nhập Cloudflare (1 lần):

```bash
npx wrangler login
```

Deploy:

```bash
chmod +x ./scripts/deploy_cloudflare.sh

./scripts/deploy_cloudflare.sh                # dùng wasm đã build sẵn
./scripts/deploy_cloudflare.sh --build-wasm   # build lại wasm trước khi deploy
./scripts/deploy_cloudflare.sh --preview      # bản preview, URL tạm
```

Script sẽ: (build wasm nếu có `--build-wasm`) → `npm install` →
`REQUIRE_WASM=1 npm run build` → kiểm tra `dist/` → `wrangler pages deploy`.

Deploy từ CI/máy khác không cần `wrangler login`, chỉ cần đặt
`CLOUDFLARE_API_TOKEN` (token có quyền **Cloudflare Pages: Edit**) và
`CLOUDFLARE_PROJECT_NAME` nếu deploy sang project khác `devtools`.
