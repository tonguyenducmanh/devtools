#!/bin/sh
set -e

echo "--- Bắt đầu quy trình daemon ---"

# 1. Cấu hình đường dẫn
DAEMON_DIR="./src_backend/td_daemon_app/cmd"
WEB_APP_DIR="./src_backend/td_daemon_app/internal/web_app/dist"
FRONTEND_DIST="./dist"
OUTPUT_DIR="./out"
OUTPUT_NAME="tool-tomanh-daemon"

# Đảm bảo thư mục output tồn tại
mkdir -p "$OUTPUT_DIR"

# 2. Build Frontend
echo "Đang build Frontend..."
npm install
npm run web:build

# 3. Copy dist frontend vào backend
echo "Đang copy frontend dist vào backend..."

rm -rf "$WEB_APP_DIR"
mkdir -p "$WEB_APP_DIR"

# copy NỘI DUNG dist, không tạo dist/dist
cp -r "$FRONTEND_DIST"/. "$WEB_APP_DIR"

# 4. Build Backend (Go daemon)
echo "Đang build Go daemon..."
cd "$DAEMON_DIR"

echo "Building for Mac Intel..."
GOOS=darwin GOARCH=amd64 \
go build -o "../../$OUTPUT_DIR/$OUTPUT_NAME-mac-intel" .

echo "Building for Mac Apple Silicon..."
GOOS=darwin GOARCH=arm64 \
go build -o "../../$OUTPUT_DIR/$OUTPUT_NAME-mac-arm" .

echo "Building for Linux..."
GOOS=linux GOARCH=amd64 \
go build -o "../../$OUTPUT_DIR/$OUTPUT_NAME-linux" .

echo "Building for Windows..."
GOOS=windows GOARCH=amd64 \
go build -o "../../$OUTPUT_DIR/$OUTPUT_NAME.exe" .

echo "Build thành công!"
