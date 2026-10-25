# Cimbar (color-icon-matrix barcode)

Module này **không build wasm từ mã C++** — nó tải bản wasm dựng sẵn (prebuilt)
từ release chính thức của [libcimbar](https://github.com/sz3/libcimbar), rồi copy
2 file cần thiết vào `src_wasm/pkg/cimbar/` để `viteStaticCopy` đưa vào
`dist/assets-wasm-<VERSION>/cimbar/`.

## Nguồn và giấy phép

- Dự án gốc: [sz3/libcimbar](https://github.com/sz3/libcimbar) — tác giả **sz3** (Sean).
- Định dạng: cimbar (color-icon-matrix barcode), truyền dữ liệu qua màn hình →
  camera/ghi màn hình, không cần mạng, Bluetooth hay NFC.
- Giấy phép: **Mozilla Public License 2.0 (MPL-2.0)**. Bản đầy đủ nằm tại
  [`LICENSE-MPL-2.0.txt`](./LICENSE-MPL-2.0.txt) và được copy kèm vào thư mục
  wasm khi build (`src_wasm/pkg/cimbar/LICENSE-MPL-2.0.txt`).
- Bản wasm dùng trong repo: release **v0.6.8** (asset `cimbar.wasm.tar.gz`).
  File wasm/glue **không được commit** (nằm trong `src_wasm/pkg/`, gitignored —
  xem Luật 9 trong `AGENTS.md`).

## File nào dùng

`build.sh` tải release, giải nén và chỉ lấy:

| File trong `pkg/cimbar/` | Vai trò |
| ------------------------ | ------- |
| `cimbar_js.js`           | Glue Emscripten (encoder + decoder API) |
| `cimbar_js.wasm`         | Module wasm (encode + decode cimbar) |
| `LICENSE-MPL-2.0.txt`    | Giấy phép của module wasm |
| `NOTICE.txt`             | Ghi chú nguồn/phiên bản |

Các file JS/HTML khác trong release (`recv.html`, `send-worker.js`, …) là web app
demo của upstream; repo này **không dùng** mà tự viết worker/UI để:

- mã hoá cả **văn bản** lẫn **tệp**;
- giải mã từ **video ghi màn hình được upload** (upstream chỉ giải mã camera trực tiếp).

## API wasm đang dùng

Encoder (`cimbar_js.h`):

- `cimbare_init_window`, `cimbare_configure`, `cimbare_get_aspect_ratio`
- `cimbare_init_encode`, `cimbare_encode_bufsize`, `cimbare_encode`
- `cimbare_render`, `cimbare_next_frame`

Decoder (`cimbar_recv_js.h`):

- `cimbard_configure_decode`, `cimbard_get_bufsize`
- `cimbard_scan_extract_decode`, `cimbard_fountain_decode`
- `cimbard_get_report`, `cimbard_get_filesize`, `cimbard_get_filename`
- `cimbard_get_decompress_bufsize`, `cimbard_decompress_read`

Phần giao thức/giải nén nằm trong wasm; phía JS chỉ lo đọc frame RGBA từ
`<video>`/`OffscreenCanvas` và ghép các chunk đã giải nén thành file.

## Build

```sh
# tải prebuilt wasm (cần mạng)
./src_wasm/cimbar/build.sh

# hoặc build toàn bộ wasm khác + cimbar
./scripts/build_wasm.sh
```

Có thể ghim phiên bản khác bằng biến môi trường:

```sh
CIMBAR_VERSION=0.6.8 ./src_wasm/cimbar/build.sh
```

`build.sh` kiểm tra toàn vẹn của asset tải về (SHA256 + MD5) và MD5 của 2 file
sau khi giải nén, ghi lại vào `NOTICE.txt`. Checksum hiện có (v0.6.8):

| File / asset                | MD5                                |
| --------------------------- | ---------------------------------- |
| `cimbar.wasm.tar.gz`        | `9c62f5dbffd3ac495b7a1cd7da9781ad` |
| `cimbar_js.js`              | `d2a90a00da846cc04b7e480f63e16d4d` |
| `cimbar_js.wasm`            | `611f3f1b05cbdcca543b65baff56bd2b` |

(SHA256 của tarball: `0a14b63decd9404e7a319b4b0f5cd873eb6aa325f90df4e965305f523567c4a5`.)
Sai checksum thì script dừng ngay, không copy file vào `pkg/`.

Sau khi build phải chạy lại `npm run build` vì `viteStaticCopy` lấy từ
`src_wasm/pkg/`.

## Lưu ý sử dụng

- Mã cimbar phát ở ~15 FPS, có nhấp nháy mạnh. **Không nhìn trực tiếp** vào màn
  hình khi đang phát nếu bạn nhạy cảm với ánh sáng nhấp nháy (động kinh cảm
  quang). Chỉ cần camera/điện thoại hướng vào màn hình.
- Dữ liệu tối đa khoảng **33 MB sau khi nén**. Tệp lớn hơn nên nén trước.
- Khi ghi màn hình để giải mã, nên ghi **toàn bộ cửa sổ/canvas** cimbar, giữ
  khung hình ổn định, đủ nét; không quay qua lớp kính hoặc làm mờ.
