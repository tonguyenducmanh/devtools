#!/bin/sh
# Fetch các external repo cần để build wasm (chạy khi chưa có thư mục external_repo).
#
# Repo này KHÔNG dùng git submodule nữa: pkg (wasm đã build) được commit sẵn nên
# Cloudflare/CI chỉ cần chạy `npm run build` mà không cần clone bất kỳ submodule nào.
# Nếu bạn muốn BUILD LẠI wasm, chạy script này (hoặc scripts/build_wasm.sh) để lấy
# đúng nguồn đã pin commit, rồi build.
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

fetch() {
  DIR="$1"
  URL="$2"
  SHA="$3"
  if [ -d "$DIR" ]; then
    echo "Đã có $DIR, bỏ qua."
  else
    echo "Cloning $URL -> $DIR"
    git clone "$URL" "$DIR"
    # Nhảy về đúng commit đã dùng khi build bản pkg hiện tại (tái lập được như submodule cũ)
    git -C "$DIR" -c advice.detachedHead=false checkout "$SHA"
  fi
}

# IronRDP (dùng cho tool Remote Desktop) — commit của submodule cũ
fetch "$ROOT_DIR/src_wasm/iron_rdp/external_repo" \
  "https://github.com/tonguyenducmanh/IronRDP.git" \
  "aa87f5d27e6b6f1c45a1a01500e39b96f0eff7b1"

# PhotoCraft (dùng cho tool Chỉnh sửa ảnh) — commit của submodule cũ
fetch "$ROOT_DIR/src_wasm/photocraft/external_repo" \
  "https://github.com/storytold/photocraft.git" \
  "e398cc80b8c909fb5183fb6b879191a258410997"

echo "Fetch wasm sources completed."