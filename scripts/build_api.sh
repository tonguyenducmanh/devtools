#!/bin/sh
set -e

echo "--- Bắt đầu quy trình build api ---"
ROOT_DIR=$(pwd)
# Đường dẫn tuyệt đối hoặc tương đối tính từ thư mục chạy script
MODULE_DIR="$ROOT_DIR/src_backend/td_api_service"
APP_NAME="$ROOT_DIR/out/tool-tomanh-api"

# Di chuyển vào thư mục module để Go nhận diện go.mod
cd $MODULE_DIR

# Build cho các nền tảng
echo "Building for Mac Intel..."
GOOS=darwin GOARCH=amd64 go build -o ${APP_NAME}-mac-intel ./cmd/main.go

echo "Building for Mac M1/M2/M3..."
GOOS=darwin GOARCH=arm64 go build -o ${APP_NAME}-mac-arm ./cmd/main.go

echo "Building for Linux..."
GOOS=linux GOARCH=amd64 go build -o ${APP_NAME}-linux ./cmd/main.go

echo "Building for Windows..."
GOOS=windows GOARCH=amd64 go build -o ${APP_NAME}.exe ./cmd/main.go

echo "Build thành công!"