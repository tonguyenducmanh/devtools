## Dự án: Công cụ Tiện ích cho Lập trình viên - Tổng hợp để tránh triển khai mỗi công cụ trên một trang web riêng biệt

Dự án này cung cấp một bộ sưu tập các công cụ hữu ích dành cho lập trình viên, được tổng hợp với mục tiêu tránh phải triển khai mỗi công cụ trên một trang web riêng biệt.

Đây là một **Ứng dụng Client-Daemon**.

![alt text](imgs/demo.png)

🔗 [https://tomanh.com/](https://tomanh.com/)

---

## Cài đặt

### 1. Clone

Dự án này **không dùng Git Submodules** nữa: các file wasm đã build (`src_wasm/pkg/`) được commit thẳng vào repo, nên CI/Cloudflare chỉ cần `npm run build` mà không cần clone thêm gì. Source của các dự án ngoài (IronRDP, PhotoCraft) chỉ được clone **khi bạn muốn build lại wasm**:

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
- **PhotoCraft** (`src_wasm/photocraft`): trình chỉnh sửa ảnh (Rust, wasm-bindgen) → `src_wasm/pkg/photocraft/`

Build toàn bộ wasm bằng:

```bash
chmod 777 ./scripts/build_wasm.sh
./scripts/build_wasm.sh
```

Script tự clone nguồn external repo (IronRDP, PhotoCraft) về `src_wasm/<tên>/external_repo/` nếu chưa có (không dùng git submodule) rồi build. Nếu chỉ muốn lấy nguồn mà chưa build:

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

### Tool PhotoCraft

Tool **PhotoCraft** ở sidebar chỉ làm đúng 1 việc: tải wasm PhotoCraft về và load lên toàn màn hình trong một `<iframe>` (wasm app hoàn chỉnh, egui + WebGPU/WebGL2). Wasm ~27 MB được `build.sh` nén gzip thành `_bg.wasm.gz` (~11 MB) để dưới giới hạn **25 MiB/file của Cloudflare Pages**, `index.html` tự giải nén (DecompressionStream) khi tải. Vì vậy cần **build wasm trước** khi `npm run build` (nếu chưa build, folder `src_wasm/pkg/photocraft` trống và iframe sẽ báo lỗi):

```bash
# Cách 1: build riêng photocraft
chmod +x ./src_wasm/photocraft/build.sh
./src_wasm/photocraft/build.sh

# Cách 2: build toàn bộ wasm (IronRDP + .NET + PhotoCraft)
chmod 777 ./scripts/build_wasm.sh
./scripts/build_wasm.sh
```

Chi tiết: [src_wasm/photocraft/README.md](src_wasm/photocraft/README.md).
