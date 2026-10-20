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
| `src/direct.rs` | `LinuxViewer/src/direct.rs` | Quyết định dùng đường LAN trực tiếp hay đi qua relay (`is_lan_address`, `peer_lan_address`) |
| `resources/8bit.dat` | `Sources/UltraViewerProtocol/Resources/8bit.dat` | Từ điển zstd do UltraViewer cung cấp (xem mục "Tài nguyên bên thứ ba") |

Các file **viết mới** cho Dev Tools (không có trong MacViewer):

| File | Vai trò |
| --- | --- |
| `src/session.rs` | Máy trạng thái của phiên (đăng ký → tra cứu → login → màn hình). Bản gốc chạy bằng thread; bản này viết lại theo kiểu event-driven để chạy được trong WASM (không có thread trong trình duyệt) |
| `src/transport.rs` | Giao diện tới relay + tách khung length-prefixed, bỏ header HTTP |
| `src/lib.rs` | Khai báo module + `wasm_glue` (chỉ build cho wasm32) |
| `src/wasm_glue.rs` | Nối `session` với WebSocket của trình duyệt và vẽ khung hình lên `<canvas>` |
| `tests/session_flow.rs` | Test end-to-end với relay giả lập (đăng ký → tra cứu → login → màn hình → input) + test đường LAN trực tiếp |

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
| hai chiều (binary) | byte đầu = số kênh (1 = kênh lệnh, 2 = kênh dữ liệu với máy đối tác, 3 = kênh LAN trực tiếp), phần còn lại là byte thô |

## Đường LAN trực tiếp (không đi qua relay)

Khi 2 máy cùng mạng LAN, client gốc của UltraViewer cho phép máy đối tác **tự
kết nối thẳng** vào máy viewer, nhờ vậy màn hình không phải đi vòng qua máy chủ
trung gian của UltraViewer (độ trễ giảm từ ~200ms xuống vài ms, và nội dung màn
hình không rời khỏi mạng nội bộ).

Cơ chế (giống hệt `LinuxViewer/src/direct.rs` của MacViewer):

1. Daemon mở listener TCP trên IP LAN của nó (`internal/service/bl_ultraviewer_direct.go`).
2. Module WASM gửi kèm "direct details" trong lệnh tra cứu máy đối tác:
   `IPRelay|PortRelay|IPLAN|PortLAN|key` (`key` = 14 ký tự sinh ngẫu nhiên).
3. Máy đối tác đọc thông tin đó và tự kết nối vào listener.
4. Kênh này mã hoá **AES-256-CBC/PKCS7**: khung = `LE32(len) + IV(16) + ciphertext`,
   khoá = `MD5(key)` chép vào `0..16` và `15..31`. **Phần mã hoá nằm ở daemon**,
   nên phía trình duyệt chỉ thấy byte thô giống hệt kênh relay.
5. Khi màn hình khởi tạo (lệnh 0) đến qua kênh này → session **chuyển đường chính**
   sang kênh trực tiếp (bộ đệm khung hình được reset vì chuỗi khung là của kênh mới).

Điều kiện và xử lý rơi (fallback) — cùng logic với client gốc:

- Chỉ dùng khi 2 máy có **cùng địa chỉ public** (cùng mạng NAT) và máy đối tác có
  địa chỉ LAN (`direct::peer_lan_address`).
- Nếu máy đối tác không cùng LAN → **đóng listener** ngay (không để lộ cổng).
- Listener chỉ mở trong **15 giây**; login trên kênh trực tiếp phải được trả lời
  trong **8 giây**, nếu không → đăng nhập lại qua relay.
- Khi đã dùng kênh trực tiếp, relay vẫn mang được tin nhắn phụ (chat, clipboard,
  truyền file) — màn hình thì đi qua kênh trực tiếp.
- Kênh trực tiếp đứt → tự quay lại đường relay.

## Build

```sh
./build.sh          # wasm-pack build --target web --out-dir ../pkg/ultraviewer --release
cargo test          # 81 test đơn vị + 5 test end-to-end (relay giả lập + LAN trực tiếp)
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

## Chuyển màn hình

Máy Windows **không vẽ con trỏ vào khung hình** mà gửi riêng (lệnh 3/4/28) —
viewer phải tự vẽ. Tương tự, danh sách màn hình nằm ở part 8 của lệnh khởi tạo
(lệnh 0), dạng `left:top:right:bottom|…`.

- Máy đối tác có **nhiều màn hình** → tool hiện nút chuyển màn hình trên thanh
  công cụ (`tm-monitor-icon`), bấm là chuyển qua lại giữa "Tất cả" và từng màn hình.
- Chọn 1 màn hình → canvas chỉ vẽ phần ảnh của màn hình đó, và **toạ độ chuột
  được cộng thêm gốc của màn hình** (máy đối tác luôn dùng toạ độ desktop ảo).
- Máy đối tác chỉ gửi 1 màn hình (hoặc không gửi thông tin màn hình) → nút
  không hiện, xem toàn bộ desktop.

## Tài nguyên bên thứ ba

`resources/8bit.dat` là **từ điển zstd do UltraViewer cung cấp** (112.640 byte,
SHA-256 `9aa45789d9ff9d329a623a685d57b67e33c777019de9ce1f273f21860e4bfe6b`,
dictionary ID `0x3da0bd10`). Máy đối tác nén khung hình theo từ điển này nên bộ
giải mã bắt buộc phải có nó; thiếu từ điển thì mọi khung hình đều lỗi.

Tài nguyên này **không phải** mã nguồn mở và chưa có giấy phép phân phối riêng;
giống như bản gốc của MacViewer, nó được giữ lại cho bản dựng tương thích cục
bộ. Không nhúng bất kỳ mã thực thi Windows nào.

## Giới hạn

- Bàn phím theo bố cục vật lý kiểu US (giống MacViewer).
- Đường LAN trực tiếp chỉ dùng được khi 2 máy cùng mạng NAT (cùng địa chỉ
  public) — nếu khác mạng thì tự động dùng relay.
- Chưa hỗ trợ: truyền file, âm thanh máy đối tác.

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
