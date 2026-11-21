#!/bin/sh
# Fetch TOÀN BỘ dependency nằm ngoài source code — 1 lệnh duy nhất.
#
# Cách dùng (chạy từ đâu cũng được, script tự tìm root theo vị trí của chính nó):
#   ./scripts/fetch/fetch_all.sh             # kéo cái còn thiếu + cập nhật repo nguồn
#   ./scripts/fetch/fetch_all.sh --fresh     # xoá sạch đồ cũ rồi kéo lại từ đầu
#   ./scripts/fetch/fetch_all.sh --help
#
# --fresh xoá:
#   - node_modules/
#   - src_wasm/iron_rdp/external_repo/ + src_wasm/photocraft/external_repo/
#   - TOÀN BỘ src_wasm/pkg/ (kể cả wasm đã build — muốn "clone mới hoàn toàn")
#   - binary DuckDB CLI trong .../duckdb/cli/ (giữ lại .gitkeep)
#   - *.duckdb_extension trong .../duckdb/extensions/ (giữ lại .gitkeep)
# --fresh KHÔNG xoá:
#   - Go module cache ($GOPATH/pkg/mod — dùng chung cả máy, xoá là hại dự án khác)
#   - dist/, out/, src_backend/tm_core_service/internal/web/dist/ (build_web_for_daemon ghi đè)
#
# Sau --fresh phải tạo lại wasm mới có frontend đầy đủ:
#   ./scripts/build/build_wasm.sh
#   # hoặc không có toolchain: ./scripts/utils/extract_wasm_from_binary.sh <binary release>
#   npm run build   (hoặc ./build_all.sh)
#
# 6 bước (chỉ FETCH, KHÔNG build toolchain Rust/.NET/trunk):
#   1. npm ci theo package-lock.json (rơi về npm install nếu thiếu lock)
#   2. go mod download cho 3 module: tm_config, tm_core_service, tm_app
#   3. clone/cập nhật 2 repo nguồn wasm (IronRDP, PhotoCraft) về nhánh mặc định
#   4. DuckDB CLI v1.5.6 cho 5 platform (ghim version — lý do xem fetch_duckdb_cli.sh)
#   5. DuckDB extension rusty_sheet v0.4.2 cho 5 platform
#   6. cimbar wasm dựng sẵn v0.6.8 (verify checksum) -> src_wasm/pkg/cimbar/
#
# Các script fetch/build cũ vẫn dùng được riêng lẻ; file này là điểm vào duy nhất
# để không phải nhớ 4-5 lệnh rời rạc.
set -e

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"

FRESH=0
for arg in "$@"; do
    case "$arg" in
        --fresh|-f|--force) FRESH=1 ;;
        -h|--help)
            sed -n '2,/^set -e/p' "$0" | sed '$d' | sed 's/^# \{0,1\}//'
            exit 0
            ;;
        *)
            echo "Tham số lạ: $arg (xem --help)" >&2
            exit 1
            ;;
    esac
done

NODE_MODULES="$ROOT_DIR/node_modules"
RDP_EXTERNAL="$ROOT_DIR/src_wasm/iron_rdp/external_repo"
PHOTOCRAFT_EXTERNAL="$ROOT_DIR/src_wasm/photocraft/external_repo"
WASM_PKG_DIR="$ROOT_DIR/src_wasm/pkg"
CIMBAR_DIR="$WASM_PKG_DIR/cimbar"
DUCKDB_CLI_DIR="$ROOT_DIR/src_backend/tm_core_service/internal/database/duckdb/cli"
DUCKDB_EXT_DIR="$ROOT_DIR/src_backend/tm_core_service/internal/database/duckdb/extensions"
GO_MODULES="src_backend/tm_config src_backend/tm_core_service src_backend/tm_app"

section() {
    printf '\n>>> %s\n' "$1"
}

if [ "$FRESH" -eq 1 ]; then
    section "--fresh: xoá đồ cũ trước khi fetch lại"
    echo "  node_modules/ + 2 external_repo/ + src_wasm/pkg/ (toàn bộ wasm đã build)"
    rm -rf "$NODE_MODULES" "$RDP_EXTERNAL" "$PHOTOCRAFT_EXTERNAL" "$WASM_PKG_DIR"
    echo "  binary DuckDB CLI + extension (giữ .gitkeep)"
    rm -f "$DUCKDB_CLI_DIR"/duckdb-* "$DUCKDB_EXT_DIR"/*.duckdb_extension
    echo "  Giữ nguyên: Go module cache, dist/, out/, internal/web/dist/"
fi

# ---------------------------------------------------------------- 1. npm
section "1/6 npm dependencies"
if ! command -v npm >/dev/null 2>&1; then
    echo "LỖI: không tìm thấy npm (cần Node.js >= 22)." >&2
    exit 1
fi
if [ -f "$ROOT_DIR/package-lock.json" ]; then
    echo "npm ci (theo package-lock.json)"
    npm ci
else
    echo "CẢNH BÁO: thiếu package-lock.json -> dùng npm install" >&2
    npm install
fi

# ------------------------------------------------------------ 2. Go module
section "2/6 Go modules (3 module)"
if ! command -v go >/dev/null 2>&1; then
    echo "LỖI: không tìm thấy go (cần Go >= 1.25)." >&2
    exit 1
fi
for mod in $GO_MODULES; do
    echo "==> $mod"
    (cd "$ROOT_DIR/$mod" && go mod download)
done

# ------------------------------------------------- 3. repo nguồn build wasm
section "3/6 External repo (nguồn build wasm)"
if ! command -v git >/dev/null 2>&1; then
    echo "LỖI: không tìm thấy git." >&2
    exit 1
fi
# fetch_wasm_sources.sh clone nếu chưa có (giữ nguyên URL/SHA tham khảo ở 1 chỗ).
"$ROOT_DIR/scripts/fetch/fetch_wasm_sources.sh"
# Riêng script này luôn cập nhật về nhánh mặc định, kể cả khi repo đã có sẵn.
. "$ROOT_DIR/scripts/utils/git_pull_if_repo.sh"
for dir in "$RDP_EXTERNAL" "$PHOTOCRAFT_EXTERNAL"; do
    if [ -d "$dir" ]; then
        tm_git_pull_if_repo "$dir"
    else
        echo "CẢNH BÁO: không có $dir (clone thất bại?)" >&2
    fi
done

# ------------------------------------------------------- 4. DuckDB CLI
section "4/6 DuckDB CLI (5 platform, version ghim v1.5.6)"
"$ROOT_DIR/scripts/fetch/fetch_duckdb_cli.sh"

# -------------------------------------------------- 5. DuckDB extension
section "5/6 DuckDB extension rusty_sheet (5 platform, v0.4.2)"
"$ROOT_DIR/scripts/fetch/fetch_duckdb_extensions.sh"

# ----------------------------------------------- 6. cimbar (wasm dựng sẵn)
section "6/6 Cimbar wasm dựng sẵn (libcimbar v0.6.8, đã verify checksum)"
"$ROOT_DIR/src_wasm/cimbar/build.sh"

# ------------------------------------------------------- Kiểm tra đầu ra
# Các script con cũ có chủ đích "bỏ qua" từng platform khi tải lỗi — ở đây chốt
# lại một lần để không bao giờ build/release với dependency thiếu mà không biết.
section "Kiểm tra sau fetch"
THIEU=0
rel_path() {
    echo "${1#"$ROOT_DIR"/}"
}
check_file() {
    if [ -f "$1" ]; then
        echo "  OK  $(rel_path "$1")"
    else
        echo "  THIẾU: $(rel_path "$1")" >&2
        THIEU=1
    fi
}
check_dir() {
    if [ -d "$1" ]; then
        echo "  OK  $(rel_path "$1")/"
    else
        echo "  THIẾU: $(rel_path "$1")/" >&2
        THIEU=1
    fi
}

check_dir "$NODE_MODULES"
check_dir "$RDP_EXTERNAL"
check_dir "$PHOTOCRAFT_EXTERNAL"
for plat in darwin-amd64 darwin-arm64 linux-amd64 linux-arm64; do
    check_file "$DUCKDB_CLI_DIR/duckdb-$plat"
done
check_file "$DUCKDB_CLI_DIR/duckdb-windows-amd64.exe"
for plat in darwin-amd64 darwin-arm64 linux-amd64 linux-arm64 windows-amd64; do
    check_file "$DUCKDB_EXT_DIR/rusty_sheet-$plat.duckdb_extension"
done
check_file "$CIMBAR_DIR/cimbar_js.js"
check_file "$CIMBAR_DIR/cimbar_js.wasm"

if [ "$THIEU" -ne 0 ]; then
    echo "" >&2
    echo "Fetch CHƯA ĐẦY ĐỦ (xem các dòng THIẾU ở trên)." >&2
    echo "Kiểm tra mạng/proxy rồi chạy lại: ./scripts/fetch/fetch_all.sh" >&2
    exit 1
fi

echo ""
echo "========================================="
echo " FETCH ALL XONG"
echo "========================================="
if [ "$FRESH" -eq 1 ]; then
    echo "Lưu ý: --fresh đã xoá src_wasm/pkg/. Tiếp theo:"
    echo "  ./scripts/build/build_wasm.sh"
    echo "  # (không có toolchain) ./scripts/utils/extract_wasm_from_binary.sh <binary release>"
fi
echo "Tuỳ nhu cầu: npm run build | ./build_all.sh | ./scripts/build/build_wasm.sh"
