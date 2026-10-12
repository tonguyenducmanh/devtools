#!/bin/sh
set -e

echo "--- Bắt đầu quy trình build web app cho daemon ---"
ROOT_DIR=$(pwd)

# 1. Cấu hình đường dẫn
WEB_APP_DIR="$ROOT_DIR/src_backend/tm_core_service/internal/web/dist/"
FRONTEND_DIST="$ROOT_DIR/dist"
WASM_SRC="$ROOT_DIR/src_wasm/pkg"
OUTPUT_DIR="$ROOT_DIR/out"

# Đảm bảo thư mục output tồn tại
mkdir -p "$OUTPUT_DIR"

# 1b. src_wasm/pkg/ là gitignored (~58 MB binary), nên clone mới sẽ KHÔNG có.
#     Daemon nhúng dist/ (go:embed) nên bản phát hành bắt buộc phải đủ wasm.
if [ ! -d "$WASM_SRC" ] || [ -z "$(ls -A "$WASM_SRC" 2>/dev/null)" ]; then
    echo "LỖI: $WASM_SRC rỗng — chạy ./scripts/build_wasm.sh trước khi build daemon." >&2
    exit 1
fi

# 2. Build Frontend
echo "Đang build Frontend..."
npm install
REQUIRE_WASM=1 npm run build

# 3. Copy dist frontend vào backend
echo "Đang copy frontend dist vào backend..."

rm -rf "$WEB_APP_DIR"
mkdir -p "$WEB_APP_DIR"

# copy NỘI DUNG dist, không tạo dist/dist
cp -r "$FRONTEND_DIST"/. "$WEB_APP_DIR"
