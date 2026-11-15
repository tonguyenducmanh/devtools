#!/bin/bash

# Build script for IronRDP WASM
# Requirements:
# 1. Rust toolchain: https://rustup.rs/
# 2. wasm-pack: cargo install wasm-pack

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Find project root (where package.json is) by traversing up
PROJECT_ROOT=""
tm_dir="$SCRIPT_DIR"
while [ "$tm_dir" != "/" ] && [ "$tm_dir" != "." ]; do
    if [ -f "$tm_dir/package.json" ]; then
        PROJECT_ROOT="$tm_dir"
        break
    fi
    tm_dir="$(dirname "$tm_dir")"
done
if [ -z "$PROJECT_ROOT" ]; then
    echo "LỖI: Không tìm thấy project root (package.json)" >&2
    exit 1
fi

# Source utils
. "$PROJECT_ROOT/scripts/utils/git_pull_if_repo.sh"

EXTERNAL_DIR="$SCRIPT_DIR/external_repo"
# Xuất riêng vào pkg/rdp để tách khỏi dotnet/ và photocraft/ (không còn nằm lẫn
# ở gốc pkg). vite.config.js copy nguyên folder này sang assets-wasm-<version>/rdp.
OUTPUT_DIR="$(dirname "$SCRIPT_DIR")/pkg/rdp"

# Đảm bảo có external repo để build (clone on-demand, không phải submodule)
if [ ! -d "$EXTERNAL_DIR" ]; then
    echo "external_repo chưa có, đang clone..."
    "$PROJECT_ROOT/scripts/fetch/fetch_wasm_sources.sh"
fi

# Cập nhật source mới nhất trước khi build (git pull origin) nếu là git repo
tm_git_pull_if_repo "$EXTERNAL_DIR"

echo "Building IronRDP WASM..."
echo "Output directory: $OUTPUT_DIR"

# Check if wasm-pack is installed
if ! command -v wasm-pack &> /dev/null; then
    echo "wasm-pack not found. Installing..."
    cargo install wasm-pack
fi

# Add wasm32 target if not exists
rustup target add wasm32-unknown-unknown

# Build WASM package to parent pkg directory
wasm-pack build --target web --out-dir "$OUTPUT_DIR" --release

# Remove unnecessary files
rm -f "$OUTPUT_DIR/.gitignore" "$OUTPUT_DIR/package.json" "$OUTPUT_DIR/README.md" 2>/dev/null || true

echo "Build completed! Output in $OUTPUT_DIR"
