#!/bin/sh
# Version của bản build: ưu tiên biến môi trường VERSION,
# không truyền thì lấy version trong package.json (giống cách lấy version UI)
#   VERSION=1.2.3 ./build_all.sh
. "./scripts/utils/tm_version.sh"
echo "Đang build version: $(tm_get_version)"

# Build order: FETCH -> WASM -> Frontend -> API -> Daemon
# Mặc định chỉ build frontend + daemon (đủ cho dev).
# Mở comment từng bước khi cần fetch binary, build wasm hoặc build API.

# 0. Fetch binary bên ngoài (DuckDB CLI + extensions, WASM sources)
# chmod 777 ./scripts/fetch/fetch_duckdb_cli.sh
# ./scripts/fetch/fetch_duckdb_cli.sh
# chmod 777 ./scripts/fetch/fetch_duckdb_extensions.sh
# ./scripts/fetch/fetch_duckdb_extensions.sh

# 1. Build WASM (IronRDP, UltraViewer, .NET Wrapper, PhotoCraft)
# chmod 777 ./scripts/build/build_wasm.sh
# ./scripts/build/build_wasm.sh

# 2. Build Frontend (npm install + npm run build + copy dist vào backend)
chmod 777 ./scripts/build/build_web_for_daemon.sh
./scripts/build/build_web_for_daemon.sh

# 3. Build API only (không nhúng frontend)
# chmod 777 ./scripts/build/build_api.sh
# ./scripts/build/build_api.sh

# 4. Build Daemon (nhúng frontend, cross-compile 3 platform -> out/)
chmod 777 ./scripts/build/build_daemon.sh
./scripts/build/build_daemon.sh