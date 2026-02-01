#!/bin/sh
set -e

echo "--- Bắt đầu quy trình daemon ---"
ROOT_DIR=$(pwd)

# 1. Cấu hình đường dẫn
DAEMON_DIR="$ROOT_DIR/src_backend/td_app/cmd/daemon_app"
WEB_APP_DIR="$ROOT_DIR/src_backend/td_core_service/internal/web/dist/"
FRONTEND_DIST="$ROOT_DIR/dist"
OUTPUT_DIR="$ROOT_DIR/out"
OUTPUT_NAME="dev-tool-daemon"


# 4. Build Backend (Go daemon)
echo "Đang build Go daemon..."
cd "$DAEMON_DIR"

echo "Building for Mac Apple Silicon..."
GOOS=darwin GOARCH=arm64  \
go build -o "$OUTPUT_DIR/$OUTPUT_NAME-mac-arm" .

echo "Building for Linux..."
GOOS=linux GOARCH=amd64  \
go build -o "$OUTPUT_DIR/$OUTPUT_NAME-linux" .

echo "Building for Windows..."
GOOS=windows GOARCH=amd64  \
go build -o "$OUTPUT_DIR/$OUTPUT_NAME-window.exe" .

rm -rf "$FRONTEND_DIST"


echo "Build thành công!"
