#!/bin/bash
# Build script cho module WASM UltraViewer (Rust → wasm-pack)
# Yêu cầu:
# 1. Rust toolchain: https://rustup.rs/
# 2. wasm-pack: cargo install wasm-pack

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Xuất riêng vào pkg/ultraviewer để tách khỏi dotnet/ rdp/ photocraft/
# (vite.config.js copy nguyên folder này sang assets-wasm-<version>/ultraviewer).
OUTPUT_DIR="$(dirname "$SCRIPT_DIR")/pkg/ultraviewer"

if ! command -v wasm-pack &> /dev/null; then
    echo "wasm-pack not found. Installing..."
    cargo install wasm-pack
fi

rustup target add wasm32-unknown-unknown

echo "Building UltraViewer WASM..."
echo "Output directory: $OUTPUT_DIR"

wasm-pack build --target web --out-dir "$OUTPUT_DIR" --release

# File thừa do wasm-pack sinh ra
rm -f "$OUTPUT_DIR/.gitignore" "$OUTPUT_DIR/package.json" "$OUTPUT_DIR/README.md" 2>/dev/null || true

echo "Build completed! Output in $OUTPUT_DIR"
