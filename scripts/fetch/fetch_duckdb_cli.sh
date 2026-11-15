#!/bin/sh
# Tải DuckDB CLI binary cho TẤT CẢ platform
# (darwin-amd64, darwin-arm64, linux-amd64, linux-arm64, windows-amd64)
# để nhúng vào Go binary qua //go:embed, tránh auto-download từ mạng lúc runtime.
#
# File binary KHÔNG được commit (xem .gitignore), chỉ giữ folder + .gitkeep
# để go:embed build không lỗi khi clone repo.
#
# Cách dùng: ./scripts/fetch/fetch_duckdb_cli.sh
# Sau đó rebuild daemon: ./scripts/build/build_daemon.sh
set -e

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
CLI_DIR="$ROOT_DIR/src_backend/tm_core_service/internal/database/duckdb/cli"

echo "Thư mục CLI: $CLI_DIR"
mkdir -p "$CLI_DIR"

# Lấy version release mới nhất từ GitHub API
RELEASE_VERSION="${DUCKDB_CLI_VERSION:-}"
if [ -z "$RELEASE_VERSION" ]; then
  echo "Đang lấy version DuckDB CLI mới nhất từ GitHub..."
  RELEASE_VERSION=$(curl -s https://api.github.com/repos/duckdb/duckdb/releases/latest \
    | grep '"tag_name"' \
    | sed -E 's/.*"tag_name": "([^"]+)".*/\1/' 2>/dev/null)
  if [ -z "$RELEASE_VERSION" ]; then
    echo "  CẢNH BÁO: không lấy được version mới nhất, dùng mặc định v1.2.0"
    RELEASE_VERSION="v1.2.0"
  fi
fi

echo "Sử dụng DuckDB CLI release: $RELEASE_VERSION"

download_one() {
  plat="$1"; asset_os="$2"; asset_arch="$3"
  asset="duckdb-cli-${asset_os}-${asset_arch}.tar.gz"
  url="https://github.com/duckdb/duckdb/releases/download/${RELEASE_VERSION}/${asset}"
  echo "==> $plat : $asset"
  curl -fL -o "/tmp/cli_${plat}.tar.gz" "$url" || {
    echo "  FAIL $plat (bỏ qua)"
    rm -f "/tmp/cli_${plat}.tar.gz"
    return
  }

  # Giải nén tar.gz ra temp
  mkdir -p "/tmp/cli_ext_${plat}"
  tar -xzf "/tmp/cli_${plat}.tar.gz" -C "/tmp/cli_ext_${plat}" || {
    echo "  FAIL $plat: giải nén tar.gz thất bại (bỏ qua)"
    rm -rf "/tmp/cli_ext_${plat}" "/tmp/cli_${plat}.tar.gz"
    return
  }

  # Tìm file binary trong tar (duckdb hoặc duckdb.exe)
  ext_bin=$(find "/tmp/cli_ext_${plat}" -type f \( -name "duckdb" -o -name "duckdb.exe" \) | head -1)
  if [ -z "$ext_bin" ]; then
    echo "  FAIL $plat: không tìm thấy binary duckdb trong tar.gz (bỏ qua)"
    rm -rf "/tmp/cli_ext_${plat}" "/tmp/cli_${plat}.tar.gz"
    return
  fi

  # Đặt tên file embed: duckdb-<plat> hoặc duckdb-<plat>.exe
  if [ "$asset_os" = "windows" ]; then
    out_name="duckdb-${plat}.exe"
  else
    out_name="duckdb-${plat}"
  fi
  cp "$ext_bin" "$CLI_DIR/$out_name"
  chmod +x "$CLI_DIR/$out_name"
  echo "   OK -> $out_name"
  rm -rf "/tmp/cli_ext_${plat}" "/tmp/cli_${plat}.tar.gz"
}

echo "Tải DuckDB CLI ${RELEASE_VERSION} cho tất cả platform..."

# Mỗi dòng: plat os arch
download_one darwin-amd64 osx amd64
download_one darwin-arm64 osx arm64
download_one linux-amd64 linux amd64
download_one linux-arm64 linux arm64
download_one windows-amd64 windows amd64

echo ""
echo "Hoàn tất. File CLI binary nằm ở: $CLI_DIR"
ls -la "$CLI_DIR/"
echo ""
echo "Build daemon để nhúng CLI vào binary: ./scripts/build_daemon.sh"
