#!/bin/bash
# Build script for WordCraft WASM (web app)
# Requirements:
# 1. Rust toolchain: https://rustup.rs/
# 2. trunk: brew install trunk  (hoặc: cargo install trunk --locked)
#
# Build toàn bộ source từ external_repo (storytold/wordcraft)
# rồi copy output tĩnh sang src_wasm/pkg/wordcraft/ để serve cùng web app.
# Kết quả build gồm: index.html + wordcraft-web-<hash>.js + wordcraft-web-<hash>_bg.wasm
# (wasm luôn được nén .wasm.gz để nhẹ khi tải và dưới giới hạn 25 MiB của Cloudflare).

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXTERNAL_DIR="$SCRIPT_DIR/external_repo"
OUTPUT_DIR="$(dirname "$SCRIPT_DIR")/pkg/wordcraft"

echo "Building WordCraft WASM..."
echo "Source directory: $EXTERNAL_DIR"
echo "Output directory: $OUTPUT_DIR"

# 1. Kiểm tra external repo đã clone chưa
if [ ! -d "$EXTERNAL_DIR/apps/wordcraft-web" ]; then
    echo "external_repo chưa có, đang clone..."
    "$SCRIPT_DIR/../../scripts/fetch_wasm_sources.sh"
fi

# 1b. Cập nhật source mới nhất trước khi build (git pull origin) nếu là git repo
. "$SCRIPT_DIR/../../scripts/git_pull_if_repo.sh"
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

# 4. Build web app bằng trunk (đọc apps/wordcraft-web/Trunk.toml:
#    dist = ../../dist/web, public_url = "./" để chạy được dưới mọi prefix URL)
cd "$EXTERNAL_DIR/apps/wordcraft-web"
trunk build --release

# 5. Copy toàn bộ static site sang pkg/wordcraft
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"
cp -R "$EXTERNAL_DIR/dist/web/." "$OUTPUT_DIR/"

# 6. Dọn site tĩnh: nén wasm (luôn nén) và patch index.html cho browser tự giải nén
. "$SCRIPT_DIR/../../scripts/wasm_dist_common.sh"
tm_prepare_wasm_dist "$OUTPUT_DIR" "WordCraft"

echo "========================================="
echo "WordCraft WASM BUILD COMPLETED!"
echo "Output in $OUTPUT_DIR"
ls -lh "$OUTPUT_DIR"
echo "========================================="