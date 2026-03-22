#!/bin/sh
set -e

echo "--- Bắt đầu quy trình build web app cho daemon ---"
ROOT_DIR=$(pwd)

# 1. Cấu hình đường dẫn
WEB_APP_DIR="$ROOT_DIR/src_backend/td_core_service/internal/web/dist/"
FRONTEND_DIST="$ROOT_DIR/dist"
WASM_SRC="$ROOT_DIR/src_wasm/pkg"
OUTPUT_DIR="$ROOT_DIR/out"

# Đảm bảo thư mục output tồn tại
mkdir -p "$OUTPUT_DIR"

# 2. Build Frontend
echo "Đang build Frontend..."
npm install
npm run web:build

# 3. Copy WASM files vào dist/wasm để Go embed phục vụ tại /wasm/
echo "Đang copy WASM files vào dist..."
mkdir -p "$FRONTEND_DIST/wasm"
cp "$WASM_SRC"/rdp_client.js "$FRONTEND_DIST/wasm/"
cp "$WASM_SRC"/rdp_client_bg.wasm "$FRONTEND_DIST/wasm/"
cp "$WASM_SRC"/rdp_client_bg.wasm.d.ts "$FRONTEND_DIST/wasm/"
cp "$WASM_SRC"/rdp_client.d.ts "$FRONTEND_DIST/wasm/"

# 4. Copy dist frontend vào backend
echo "Đang copy frontend dist vào backend..."

rm -rf "$WEB_APP_DIR"
mkdir -p "$WEB_APP_DIR"

# copy NỘI DUNG dist, không tạo dist/dist
cp -r "$FRONTEND_DIST"/. "$WEB_APP_DIR"
