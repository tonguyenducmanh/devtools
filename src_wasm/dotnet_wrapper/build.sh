#!/bin/bash
set -e

# Xác định thư mục hiện tại của script C#
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Định nghĩa thư mục đích giống như Rust (thư mục pkg ở cấp src_wasm)
OUTPUT_PKG_DIR="$(dirname "$SCRIPT_DIR")/pkg/dotnet"

echo "========================================="
echo "Building C# WASM Wrapper (.NET 10.0)..."
echo "========================================="

# Dọn dẹp build cũ nội bộ
echo "Cleaning old build artifacts..."
rm -rf bin/ obj/

# Thực hiện publish với cấu hình Release
dotnet publish Tools.NetWrapper.csproj -c Release

# Đường dẫn nguồn sau khi build xong
BUNDLE_FRAMEWORK_DIR="$SCRIPT_DIR/bin/Release/net10.0/browser-wasm/AppBundle/_framework"

echo "C# Build completed!"

if [ -d "$BUNDLE_FRAMEWORK_DIR" ]; then
    echo "Copying C# Bundle to global pkg folder..."
    
    # Xóa thư mục dotnet cũ trong pkg nếu có để cập nhật mới completely
    rm -rf "$OUTPUT_PKG_DIR"
    mkdir -p "$OUTPUT_PKG_DIR"
    
    # Copy toàn bộ nội dung trong _framework sang pkg/dotnet
    cp -R "$BUNDLE_FRAMEWORK_DIR/" "$OUTPUT_PKG_DIR"
    
    echo "Done! C# WASM files are copied to:"
    echo "   $OUTPUT_PKG_DIR"
else
    echo "Error: Không tìm thấy thư mục AppBundle/_framework để copy."
    exit 1
fi