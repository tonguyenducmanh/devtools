#!/bin/sh
# Fetch các external repo cần để build wasm (chạy khi chưa có thư mục external_repo).
#
# Repo này KHÔNG dùng git submodule, và `src_wasm/pkg/` (wasm đã build, ~58 MB)
# cũng KHÔNG được commit — nó là gitignore. Nghĩa là clone repo về sẽ KHÔNG có
# sẵn wasm: muốn build frontend đầy đủ (Remote Desktop / .NET Wrapper / craft
# tool) hay deploy Cloudflare thì phải build wasm trước (./scripts/build_wasm.sh).
# Cloudflare Pages vì thế KHÔNG bật Git integration được — deploy thủ công bằng
# ./scripts/deploy_cloudflare.sh.
#
# Lưu ý: trước đây script có "pin commit" (checkout theo SHA cụ thể -> detached HEAD),
# giờ đã bỏ để luôn dùng nhánh mặc định. SHA cũ được giữ lại làm chú thích tham khảo.
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

fetch() {
  DIR="$1"
  URL="$2"
  SHA="$3" # chỉ để tham khảo, không còn checkout pin
  if [ -d "$DIR" ]; then
    echo "Đã có $DIR, bỏ qua (build sẽ tự git pull nếu là git repo)."
  else
    echo "Cloning $URL -> $DIR"
    git clone "$URL" "$DIR"
    # git clone mặc định đã checkout nhánh mặc định (ví dụ main/master),
    # không cần pin commit nữa -> repo luôn ở nhánh mặc định.
  fi
}

# IronRDP (dùng cho tool Remote Desktop) — SHA cũ (khi build bản pkg hiện tại):
#   aa87f5d27e6b6f1c45a1a01500e39b96f0eff7b1
fetch "$ROOT_DIR/src_wasm/iron_rdp/external_repo" \
  "https://github.com/tonguyenducmanh/IronRDP.git" \
  "aa87f5d27e6b6f1c45a1a01500e39b96f0eff7b1"

# PhotoCraft (dùng cho tool Ảnh pixel) — SHA cũ:
#   e398cc80b8c909fb5183fb6b879191a258410997
fetch "$ROOT_DIR/src_wasm/photocraft/external_repo" \
  "https://github.com/storytold/photocraft.git" \
  "e398cc80b8c909fb5183fb6b879191a258410997"

echo "Fetch wasm sources completed."