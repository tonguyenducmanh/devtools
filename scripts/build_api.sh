#!/bin/sh
set -e

echo "--- Bắt đầu quy trình build api ---"
ROOT_DIR=$(pwd)
# Đường dẫn tuyệt đối hoặc tương đối tính từ thư mục chạy script
MODULE_DIR="$ROOT_DIR/src_backend/td_app/cmd/api_app"
APP_NAME="$ROOT_DIR/out/dev-tool-api"

# ĐỌC VERSION TỪ PACKAGE.JSON (giống cách Vite lấy version cho UI)
. "$ROOT_DIR/scripts/td_version.sh"

VERSION=$(td_get_version)

echo "Phiên bản hiện tại: $VERSION"

# gắn version vào binary Go, API health check sẽ trả về version này cho UI
LDFLAGS=$(td_get_go_ldflags "$VERSION")

# Di chuyển vào thư mục module để Go nhận diện go.mod
cd $MODULE_DIR

# Build cho các nền tảng

echo "Building for Mac..."
GOOS=darwin GOARCH=arm64  go build -ldflags "$LDFLAGS" -o ${APP_NAME}-mac-arm .

echo "Building for Linux..."
GOOS=linux GOARCH=amd64  go build -ldflags "$LDFLAGS" -o ${APP_NAME}-linux .

echo "Building for Windows..."
GOOS=windows GOARCH=amd64  go build -ldflags "$LDFLAGS" -o ${APP_NAME}-window.exe .

echo "Build thành công!"