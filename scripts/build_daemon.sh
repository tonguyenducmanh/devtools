#!/bin/sh
set -e

echo "--- Bắt đầu quy trình daemon ---"
ROOT_DIR=$(pwd)

# ĐỌC VERSION TỪ PACKAGE.JSON
PACKAGE_JSON_PATH="$ROOT_DIR/package.json"

if [ ! -f "$PACKAGE_JSON_PATH" ]; then
    echo "Lỗi: Không tìm thấy file package.json tại $ROOT_DIR"
    exit 1
fi

# đọc ra version hiện tại
VERSION=$(node -e "echo(require('$PACKAGE_JSON_PATH').version);" 2>/dev/null || node -e "console.log(require('$PACKAGE_JSON_PATH').version);")

echo "Phiên bản hiện tại: $VERSION"

# Cấu hình đường dẫn
DAEMON_DIR="$ROOT_DIR/src_backend/td_app/cmd/daemon_app"
WEB_APP_DIR="$ROOT_DIR/src_backend/td_core_service/internal/web/dist/"
FRONTEND_DIST="$ROOT_DIR/dist"
OUTPUT_DIR="$ROOT_DIR/out"

OUTPUT_NAME="dev-tool"

rm -rf "$OUTPUT_DIR"

# Build Backend (Go daemon)
echo "Đang build Go daemon..."
cd "$DAEMON_DIR"

echo "Building for Mac Apple Silicon..."
GOOS=darwin GOARCH=arm64  \
go build -o "$OUTPUT_DIR/$OUTPUT_NAME-mac-arm-$VERSION" .

echo "Building for Linux..."
GOOS=linux GOARCH=amd64  \
go build -o "$OUTPUT_DIR/$OUTPUT_NAME-linux-$VERSION" .

echo "Building for Windows..."
GOOS=windows GOARCH=amd64  \
go build -o "$OUTPUT_DIR/$OUTPUT_NAME-window-$VERSION.exe" .

# Trở về thư mục gốc để xóa dist an toàn
cd "$ROOT_DIR"
rm -rf "$FRONTEND_DIST"

echo "Build thành công phiên bản $VERSION!"