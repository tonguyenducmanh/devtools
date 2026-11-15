#!/bin/sh
# Tải DuckDB community extension rusty_sheet cho TẤT CẢ platform
# (darwin-amd64, darwin-arm64, linux-amd64, linux-arm64, windows-amd64)
# để hỗ trợ build cross-platform daemon.
#
# File .duckdb_extension KHÔNG được commit (xem .gitignore), chỉ giữ folder
# + .gitkeep để go:embed build không lỗi khi clone repo.
#
# Cách dùng: ./scripts/fetch/fetch_duckdb_extensions.sh
# Sau đó rebuild daemon: ./scripts/build/build_daemon.sh
set -e

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
EXT_DIR="$ROOT_DIR/src_backend/tm_core_service/internal/database/duckdb/extensions"
RELEASE_VERSION="${DUCKDB_EXT_VERSION:-v0.4.2}"

echo "Thư mục extensions: $EXT_DIR"
mkdir -p "$EXT_DIR"

# Danh sách platform: GoOS_GoArch -> tên asset release
platforms="
  darwin-amd64 osx amd64
  darwin-arm64 osx arm64
  linux-amd64 linux amd64
  linux-arm64 linux arm64
  windows-amd64 windows amd64
"

download_one() {
  plat="$1"; asset_os="$2"; asset_arch="$3"
  asset="rusty_sheet-${RELEASE_VERSION#v}-${asset_os}_${asset_arch}.tar.gz"
  url="https://github.com/redraiment/rusty-sheet/releases/download/${RELEASE_VERSION}/${asset}"
  echo "==> $plat : $asset"
  curl -fL -o "/tmp/rs_${plat}.tar.gz" "$url" || {
    echo "  FAIL $plat (bỏ qua)"
    rm -f "/tmp/rs_${plat}.tar.gz"
    return
  }
  mkdir -p "/tmp/rs_ext_${plat}"
  tar -xzf "/tmp/rs_${plat}.tar.gz" -C "/tmp/rs_ext_${plat}"
  ext=$(find "/tmp/rs_ext_${plat}" -name "*.duckdb_extension" -type f | head -1)
  if [ -z "$ext" ]; then
    echo "  FAIL $plat: không tìm thấy .duckdb_extension trong tar.gz (bỏ qua)"
    rm -rf "/tmp/rs_ext_${plat}" "/tmp/rs_${plat}.tar.gz"
    return
  fi
  cp "$ext" "$EXT_DIR/rusty_sheet-${plat}.duckdb_extension"
  echo "   OK -> rusty_sheet-${plat}.duckdb_extension"
  rm -rf "/tmp/rs_ext_${plat}" "/tmp/rs_${plat}.tar.gz"
}

echo "Tải extension rusty_sheet ${RELEASE_VERSION} cho tất cả platform..."

# Use while read to properly handle multiline string
echo "$platforms" | while read -r plat os arch; do
    [ -z "$plat" ] && continue
    download_one "$plat" "$os" "$arch"
done

echo ""
echo "Hoàn tất. File .duckdb_extension nằm ở: $EXT_DIR"
ls -la "$EXT_DIR/"
echo ""
echo "Build daemon để nhúng extension vào binary: ./scripts/build_daemon.sh"
