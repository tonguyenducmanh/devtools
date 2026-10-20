# UltraViewer client (Rust → WebAssembly)

Module WASM giúp tool **Remote Desktop (UltraViewer)** của Dev Tools xem và điều
khiển máy khác đang chạy phần mềm UltraViewer trên Windows.

## Nguồn gốc (quan trọng)

Toàn bộ phần giao thức UltraViewer trong thư mục này được **port từ dự án
[MacViewer](https://github.com/DeanOpen/MacViewer)** của **DeanOpen** (giấy phép
MIT — `Copyright (c) 2026 MacViewer contributors`).

Cụ thể:

| File trong module này | Nguồn trong MacViewer | Ghi chú |
| --- | --- | --- |
| `src/wire.rs` | `LinuxViewer/src/wire.rs` | Khung length-prefixed, envelope relay, mã hoá 3DES cho kênh lệnh |
| `src/messages.rs` | `LinuxViewer/src/messages.rs` | Lệnh đăng ký (3), tra cứu (8) và login |
| `src/screen/mod.rs` | `LinuxViewer/src/screen/mod.rs` | Giải mã màn hình (ModernScreenMessage) |
| `src/screen/frame.rs` | `LinuxViewer/src/screen/frame.rs` | Bố cục khung hình (lệnh 1) |
| `src/screen/renderer.rs` | `LinuxViewer/src/screen/renderer.rs` | Bộ dựng hình + theo dõi vùng đổi (dirty rect) |
| `src/screen/zstd.rs` | `LinuxViewer/src/screen/zstd.rs` | Giải nén zstd với từ điển huấn luyện `8bit.dat` (dùng `ruzstd` thay `zstd-safe`, xem mục "Vì sao không dùng zstd C") |
| `src/cursor.rs` | `LinuxViewer/src/cursor.rs` | Con trỏ của máy đối tác: lệnh 3 (chọn hình), 4 (hình mới), 28 (vị trí) |
| `src/input.rs` | `LinuxViewer/src/input.rs` | Mã hoá chuột/bàn phím (thay `winit::KeyCode` bằng `KeyboardEvent.code`) |
| `src/chat.rs` | `LinuxViewer/src/chat.rs` | Giao thức chat (12/29/30) |
| `src/clipboard.rs` | `LinuxViewer/src/clipboard.rs` | Đồng bộ clipboard (5/33) |
| `resources/8bit.dat` | `Sources/UltraViewerProtocol/Resources/8bit.dat` | Từ điển zstd do UltraViewer cung cấp (xem mục "Tài nguyên bên thứ ba") |

Các file **viết mới** cho Dev Tools (không có trong MacViewer):

| File | Vai trò |
| --- | --- |
| `src/session.rs` | Máy trạng thái của phiên (đăng ký → tra cứu → login → màn hình). Bản gốc chạy bằng thread; bản này viết lại theo kiểu event-driven để chạy được trong WASM (không có thread trong trình duyệt) |
| `src/transport.rs` | Giao diện tới relay + tách khung length-prefixed, bỏ header HTTP |
| `src/lib.rs` | Khai báo module + `wasm_glue` (chỉ build cho wasm32) |
| `src/wasm_glue.rs` | Nối `session` với WebSocket của trình duyệt và vẽ khung hình lên `<canvas>` |
| `tests/session_flow.rs` | Test end-to-end với relay giả lập (đăng ký → tra cứu → login → màn hình → input) |

Giữ nguyên MIT của MacViewer: xem `LICENSE-MacViewer` trong thư mục này.

## Cách hoạt động

Trình duyệt không mở được socket thô (không có TLS client trong WASM), nên:

```text
[trình duyệt]  module WASM này  ──WebSocket──▶  daemon Go  ──TCP+TLS──▶  relay UltraViewer
   (giao thức)                    (byte thô)      (chỉ làm trung gian)
```

- Module WASM lo toàn bộ giao thức: mã hoá 3DES, envelope relay, giải nén zstd,
  dựng hình, mã hoá chuột/bàn phím.
- Daemon Go (`internal/service/bl_ultraviewer_relay.go`) chỉ mở TCP + TLS tới
  relay (có ghim chứng thư Sectigo R46) rồi chuyển byte hai chiều.

Endpoint: `GET /ultraviewer/ws` (xem `internal/router/rt_ultraviewer.go`).

Giao thức WebSocket giữa WASM và daemon:

| Hướng | Nội dung |
| --- | --- |
| WASM → daemon (text) | `{"t":"open","c":1,"host":"...","port":443,"sni":"ultraviewer","cert":"..."}` / `{"t":"close","c":1}` |
| daemon → WASM (text) | `{"t":"open_ok","c":1,"ip":"192.168.1.10"}` / `{"t":"open_err","c":1,"m":"..."}` / `{"t":"closed","c":1,"m":"..."}` |
| hai chiều (binary) | byte đầu = số kênh (1 = kênh lệnh, 2 = kênh dữ liệu với máy đối tác), phần còn lại là byte thô |

## Build

```sh
./build.sh          # wasm-pack build --target web --out-dir ../pkg/ultraviewer --release
cargo test          # 62 test: giao thức + end-to-end với relay giả lập
```

Output nằm ở `src_wasm/pkg/ultraviewer/` (gitignored) và được `vite.config.js`
copy sang `dist/assets-wasm-<VERSION>/ultraviewer/`.

## Vì sao không dùng thư viện zstd viết bằng C

Bản gốc (MacViewer/LinuxViewer) dùng `zstd-safe` — bọc thư viện C zstd. Bản này dùng
**`ruzstd`** (Rust thuần) vì thư viện C **không link được** vào module
`wasm32-unknown-unknown`: crate `cc` không phát `cargo:rustc-link-lib` cho target này,
nên mọi hàm `ZSTD_*` thành import từ module `"env"` mà trình duyệt không có → module wasm
không instantiate được, tool **không kết nối được** (triệu chứng: WebSocket mở nhưng
không có byte nào chạy).

Hệ quả của việc dùng `ruzstd` (chỉ giải nén, không nén được):

- Giải mã màn hình và clipboard **không đổi** — vẫn dùng đúng từ điển `8bit.dat`.
- Clipboard gửi đi dùng dạng legacy UTF-16LE (`5|||`) thay vì dạng nén (`33|||`).
  Máy đối tác vẫn nhận được; chỉ khác ở chỗ văn bản chứa `|||` sẽ bị từ chối.

## Con trỏ của máy đối tác

Máy Windows **không vẽ con trỏ vào khung hình** mà gửi riêng:

| Lệnh | Ý nghĩa |
| --- | --- |
| `3` | Chọn hình con trỏ (theo hash) |
| `4` | Hình con trỏ mới (kèm dữ liệu CUR/PNG) |
| `28` | Vị trí con trỏ trên bàn phím ảo |

Viewer phải tự vẽ. Module này giữ cache hình con trỏ (theo hash, LRU), tự yêu cầu
hình khi cache miss (`4|||hash`) và vẽ con trỏ lên **một canvas phủ** nằm đè lên canvas
màn hình (`attach_cursor_canvas`). Lưu ý: máy đối tác chỉ gửi vị trí (lệnh 28) khi
con trỏ **di chuyển** — nên vừa kết nối xong có thể chưa thấy con trỏ cho tới khi
chuột trên máy đối tác được di chuyển.

## Tài nguyên bên thứ ba

`resources/8bit.dat` là **từ điển zstd do UltraViewer cung cấp** (112.640 byte,
SHA-256 `9aa45789d9ff9d329a623a685d57b67e33c777019de9ce1f273f21860e4bfe6b`,
dictionary ID `0x3da0bd10`). Máy đối tác nén khung hình theo từ điển này nên bộ
giải mã bắt buộc phải có nó; thiếu từ điển thì mọi khung hình đều lỗi.

Tài nguyên này **không phải** mã nguồn mở và chưa có giấy phép phân phối riêng;
giống như bản gốc của MacViewer, nó được giữ lại cho bản dựng tương thích cục
bộ. Không nhúng bất kỳ mã thực thi Windows nào.

## Giới hạn

- Chỉ dùng đường qua **relay** (không dùng kết nối trực tiếp trong LAN, vì
  trình duyệt không mở được socket lắng nghe).
- Bàn phím theo bố cục vật lý kiểu US (giống MacViewer).
- Chưa hỗ trợ: truyền file, âm thanh máy đối tác, chọn từng màn hình khi
  máy đối tác chia sẻ nhiều màn hình.
- Chỉ dùng đường qua **relay** (không dùng kết nối trực tiếp trong LAN, vì
  trình duyệt không mở được socket lắng nghe).

## Kiểm thử với máy thật

`smoke_test.mjs` chạy đúng module wasm đã build (không cần trình duyệt) và in ra
tiến trình từng bước:

```sh
# daemon phải đang chạy (cổng 7777)
node smoke_test.mjs <partnerID> <password> [wsUrl]
```

Kết quả mẫu:

```text
[status] Registering this computer…
[status] Finding the partner computer…
[status] Connecting to the partner computer…
[connected] 1920x1080
[view_only] false
[tick] frames=11 connected=true cmds=[0,1,3,4,18,1,34,1,28,…] cursor={"0":1217,"1":50}
```
