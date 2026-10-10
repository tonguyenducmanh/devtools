#!/bin/bash
# Build script for PhotoCraft WASM (web app)
# Requirements:
# 1. Rust toolchain: https://rustup.rs/
# 2. trunk: brew install trunk  (hoặc: cargo install trunk --locked)
# 3. clang (để build feature heif cho target wasm32)
#
# Build toàn bộ source từ external_repo (storytold/photocraft)
# rồi copy output tĩnh sang src_wasm/pkg/photocraft/ để serve cùng web app.
# Kết quả build gồm: index.html + photocraft-web-<hash>.js + photocraft-web-<hash>_bg.wasm
# (wasm ~27MB được nén gzip thành .wasm.gz ~9MB để dưới giới hạn 25 MiB của Cloudflare).

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXTERNAL_DIR="$SCRIPT_DIR/external_repo"
OUTPUT_DIR="$(dirname "$SCRIPT_DIR")/pkg/photocraft"

echo "Building PhotoCraft WASM..."
echo "Source directory: $EXTERNAL_DIR"
echo "Output directory: $OUTPUT_DIR"

# 1. Kiểm tra external repo đã clone chưa
if [ ! -d "$EXTERNAL_DIR/apps/photocraft-web" ]; then
    echo "external_repo chưa có, đang clone..."
    "$(dirname "$SCRIPT_DIR")/../scripts/fetch_wasm_sources.sh"
fi

# 1b. Cập nhật source mới nhất trước khi build (git pull origin) nếu là git repo
. "$(dirname "$SCRIPT_DIR")/../scripts/git_pull_if_repo.sh"
tm_git_pull_if_repo "$EXTERNAL_DIR"

# 2. Cài trunk nếu chưa có
if ! command -v trunk &> /dev/null; then
    echo "trunk not found. Installing..."
    if command -v brew &> /dev/null; then
        brew install trunk
    else
        cargo install trunk --locked
    fi
fi

# 3. Thêm target wasm32 nếu chưa có
rustup target add wasm32-unknown-unknown

# 4. Build web app bằng trunk (đọc apps/photocraft-web/Trunk.toml,
#    profile wasm-release + feature heif được khai báo trong index.html)
#    Output mặc định: external_repo/dist/web
cd "$EXTERNAL_DIR/apps/photocraft-web"
trunk build --release

# 5. Copy toàn bộ static site sang pkg/photocraft
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"
cp -R "$EXTERNAL_DIR/dist/web/." "$OUTPUT_DIR/"

# 6. Nén wasm bằng gzip để dưới giới hạn 25 MiB/file của Cloudflare Pages/Workers:
#    wasm hiện tại ~27 MB > 25 MiB. Build ra <hash>_bg.wasm.gz (~9 MB) và index.html
#    sẽ tự giải nén (DecompressionStream) trong browser trước khi gọi init().
WASM_FILE="$(ls "$OUTPUT_DIR"/*_bg.wasm 2>/dev/null || true)"
if [ -n "$WASM_FILE" ]; then
    WASM_GZ="$WASM_FILE.gz"
    echo "Compressing $(basename "$WASM_FILE") -> $(basename "$WASM_GZ")"
    gzip -9 -n -c "$WASM_FILE" > "$WASM_GZ"
    rm -f "$WASM_FILE"
    if command -v python3 &>/dev/null; then
        python3 "$SCRIPT_DIR/patch_dist.py" "$OUTPUT_DIR/index.html" "$(basename "$WASM_GZ")"
    else
        echo "ERROR: cần python3 để patch index.html (nén wasm)" >&2
        exit 1
    fi
else
    echo "WARNING: không tìm thấy *_bg.wasm trong $OUTPUT_DIR (bỏ qua bước nén)"
fi

# 7. Xoá các file cấu hình host server không cần thiết (nếu có)
rm -f "$OUTPUT_DIR/_headers" "$OUTPUT_DIR/.htaccess" "$OUTPUT_DIR/HOSTING.md" 2>/dev/null || true

# 8. Kiểm tra không file nào vượt giới hạn 25 MiB của Cloudflare
if find "$OUTPUT_DIR" -type f -size +25MiB -print -quit | grep -q .; then
    echo "ERROR: có file vượt quá 25 MiB trong $OUTPUT_DIR" >&2
    find "$OUTPUT_DIR" -type f -size +25MiB -exec ls -lh {} \;
    exit 1
fi

echo "========================================="
echo "PhotoCraft WASM BUILD COMPLETED!"
echo "Output in $OUTPUT_DIR"
ls -lh "$OUTPUT_DIR"
echo "========================================="