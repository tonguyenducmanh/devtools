#!/bin/bash

# Build script for IronRDP WASM
# Requirements:
# 1. Rust toolchain: https://rustup.rs/
# 2. wasm-pack: cargo install wasm-pack

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="$(dirname "$SCRIPT_DIR")/pkg"

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
