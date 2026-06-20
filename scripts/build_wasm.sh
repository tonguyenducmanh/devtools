#!/bin/bash
set -e

ROOT_DIR=$(pwd)
RUST_MODULE_DIR="$ROOT_DIR/src_wasm/iron_rdp"
DOTNET_MODULE_DIR="$ROOT_DIR/src_wasm/dotnet_wrapper"

echo "========================================="
echo "STARTING TOTAL WASM BUILD PROCESS"
echo "========================================="

# 1. Build Rust WASM (IronRDP)
if [ -d "$RUST_MODULE_DIR" ]; then
    echo "Entering Rust Module..."
    cd "$RUST_MODULE_DIR"
    chmod +x ./build.sh
    ./build.sh
else
    echo "Error: Rust directory $RUST_MODULE_DIR not found!"
    exit 1
fi

# Quay lại root
cd "$ROOT_DIR"

# 2. Build C# WASM Wrapper (.NET 10)
if [ -d "$DOTNET_MODULE_DIR" ]; then
    echo "Entering C# Module..."
    cd "$DOTNET_MODULE_DIR"
    chmod +x ./build.sh
    ./build.sh
else
    echo "Error: C# directory $DOTNET_MODULE_DIR not found!"
    exit 1
fi

echo "========================================="
echo "ALL WASM BUILDS COMPLETED SUCCESSFULLY!"
echo "========================================="