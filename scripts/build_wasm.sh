#!/bin/bash
set -e

ROOT_DIR=$(pwd)
RUST_MODULE_DIR="$ROOT_DIR/src_wasm/iron_rdp"
DOTNET_MODULE_DIR="$ROOT_DIR/src_wasm/dotnet_wrapper"

echo "========================================="
echo "STARTING TOTAL WASM BUILD PROCESS"
echo "========================================="

# 0. Đảm bảo có nguồn external repo để build (clone on-demand, không phải submodule)
if [ -f "$ROOT_DIR/scripts/fetch_wasm_sources.sh" ]; then
    chmod +x "$ROOT_DIR/scripts/fetch_wasm_sources.sh"
    "$ROOT_DIR/scripts/fetch_wasm_sources.sh"
fi

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

# Quay lại root
cd "$ROOT_DIR"

# 3. Build các web app "craft" (Rust → WebAssembly, static site chạy trong iframe)
#    PhotoCraft  — Ảnh pixel   — trunk
#    VectorCraft — Ảnh vector — trunk
#    GridCraft   — Bảng tính  — trunk
#    WordCraft   — Văn bản    — trunk
for CRAFT in photocraft vectorcraft gridcraft wordcraft; do
    CRAFT_MODULE_DIR="$ROOT_DIR/src_wasm/$CRAFT"
    if [ -d "$CRAFT_MODULE_DIR" ]; then
        echo "Entering ${CRAFT} Module..."
        cd "$CRAFT_MODULE_DIR"
        chmod +x ./build.sh
        ./build.sh
        cd "$ROOT_DIR"
    else
        echo "Error: ${CRAFT} directory $CRAFT_MODULE_DIR not found!"
        exit 1
    fi
done

echo "========================================="
echo "ALL WASM BUILDS COMPLETED SUCCESSFULLY!"
echo "========================================="