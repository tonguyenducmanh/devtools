#!/bin/sh
set -e

echo "--- Bắt đầu quy trình daemon ---"
ROOT_DIR=$(pwd)

# ĐỌC VERSION TỪ PACKAGE.JSON (giống cách Vite lấy version cho UI)
. "$ROOT_DIR/scripts/tm_version.sh"

VERSION=$(tm_get_version)

echo "Phiên bản hiện tại: $VERSION"

# gắn version vào binary Go, API health check sẽ trả về version này cho UI
LDFLAGS=$(tm_get_go_ldflags "$VERSION")

# Cấu hình đường dẫn
DAEMON_DIR="$ROOT_DIR/src_backend/tm_app/cmd/daemon_app"
WEB_APP_DIR="$ROOT_DIR/src_backend/tm_core_service/internal/web/dist/"
FRONTEND_DIST="$ROOT_DIR/dist"
OUTPUT_DIR="$ROOT_DIR/out"

OUTPUT_NAME="dev-tool"

rm -rf "$OUTPUT_DIR"

# Build Backend (Go daemon)
echo "Đang build Go daemon..."
cd "$DAEMON_DIR"

echo "Building for Mac Apple Silicon..."
GOOS=darwin GOARCH=arm64  \
go build -ldflags "$LDFLAGS" -o "$OUTPUT_DIR/$OUTPUT_NAME-mac-arm-$VERSION" .

echo "Building for Linux..."
GOOS=linux GOARCH=amd64  \
go build -ldflags "$LDFLAGS" -o "$OUTPUT_DIR/$OUTPUT_NAME-linux-$VERSION" .

echo "Building for Windows..."
GOOS=windows GOARCH=amd64  \
go build -ldflags "$LDFLAGS" -o "$OUTPUT_DIR/$OUTPUT_NAME-window-$VERSION.exe" .

# Trở về thư mục gốc để xóa dist an toàn
cd "$ROOT_DIR"
rm -rf "$FRONTEND_DIST"

echo "Build thành công phiên bản $VERSION!"