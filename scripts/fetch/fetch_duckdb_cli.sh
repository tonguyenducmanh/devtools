#!/bin/sh
# Tải DuckDB CLI binary cho TẤT CẢ platform
# (darwin-amd64, darwin-arm64, linux-amd64, linux-arm64, windows-amd64)
# để nhúng vào Go binary qua //go:embed, tránh auto-download từ mạng lúc runtime.
#
# File binary KHÔNG được commit (xem .gitignore), chỉ giữ folder + .gitkeep
# để go:embed build không lỗi khi clone repo.
#
# Vì sao PIN version thay vì lấy "latest"?
# ---------------------------------------
# Từ DuckDB 2.0.0, binary CLI cho linux/windows amd64 được build với
# -march=x86-64-v3 (cần AVX2 + BMI2 + FMA). Máy không có AVX2 (VD Intel Pentium
# Silver N6005/J5005, Xeon E5 v1/v2, VM với CPU model cũ) sẽ crash NGAY lúc
# khởi động CLI với "signal: illegal instruction (core dumped)".
# Xem https://github.com/duckdb/duckdb/issues/27691
#
# Vì vậy mặc định ghim v1.5.6 — bản cuối nhánh 1.x, build với baseline
# x86-64-v2 nên chạy được trên mọi CPU phổ thông. Muốn thử bản mới hơn:
#   DUCKDB_CLI_VERSION=v2.0.0 ./scripts/fetch/fetch_duckdb_cli.sh
# (chỉ nên dùng khi chắc chắn máy đích có AVX2).
#
# Cách dùng: ./scripts/fetch/fetch_duckdb_cli.sh
# Sau đó rebuild daemon: ./scripts/build/build_daemon.sh
set -e

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
CLI_DIR="$ROOT_DIR/src_backend/tm_core_service/internal/database/duckdb/cli"

echo "Thư mục CLI: $CLI_DIR"
mkdir -p "$CLI_DIR"

# Version ghim mặc định — KHÔNG dùng "latest" vì lý do ISA ở trên.
RELEASE_VERSION="${DUCKDB_CLI_VERSION:-v1.5.6}"

echo "Sử dụng DuckDB CLI release: $RELEASE_VERSION"

download_one() {
  plat="$1"; asset_os="$2"; asset_arch="$3"
  work="/tmp/cli_${plat}"
  rm -rf "$work"
  mkdir -p "$work"

  # DuckDB đổi tên asset giữa các nhánh:
  #   1.x: duckdb_cli-<os>-<arch>.gz / .zip   (gz = gzip thuần của binary)
  #   2.x: duckdb-cli-<os>-<arch>.tar.gz
  # Thử theo thứ tự ưu tiên tar.gz → gz → zip.
  for asset in \
      "duckdb-cli-${asset_os}-${asset_arch}.tar.gz" \
      "duckdb_cli-${asset_os}-${asset_arch}.gz" \
      "duckdb_cli-${asset_os}-${asset_arch}.zip"; do
    url="https://github.com/duckdb/duckdb/releases/download/${RELEASE_VERSION}/${asset}"
    echo "==> $plat : $asset"

    dl="$work/download"
    if ! curl -fsSL -o "$dl" "$url"; then
      echo "  không có asset này, thử tên tiếp theo"
      rm -f "$dl"
      continue
    fi

    # Giải nén ra binary rồi copy vào folder embed.
    # duckdb_cli-*.gz là gzip THUẦN của binary (không phải tarball) → gunzip -c.
    # duckdb_cli-*.zip chứa 1 file (duckdb / duckdb.exe) → unzip.
    # duckdb-cli-*.tar.gz là tarball chuẩn → tar -xzf.
    src=""
    case "$asset" in
      *.tar.gz)
        mkdir -p "$work/extract"
        if ! tar -xzf "$dl" -C "$work/extract"; then
          echo "  FAIL $plat: giải nén tar.gz thất bại (bỏ qua)"
          rm -rf "$work"
          return 0
        fi
        ext_bin=$(find "$work/extract" -type f \( -name "duckdb" -o -name "duckdb.exe" \) | head -1)
        [ -n "$ext_bin" ] && src="$ext_bin"
        ;;
      *.zip)
        mkdir -p "$work/extract"
        if ! unzip -oq "$dl" -d "$work/extract"; then
          echo "  FAIL $plat: giải nén zip thất bại (bỏ qua)"
          rm -rf "$work"
          return 0
        fi
        ext_bin=$(find "$work/extract" -type f \( -name "duckdb" -o -name "duckdb.exe" \) | head -1)
        [ -n "$ext_bin" ] && src="$ext_bin"
        ;;
      *.gz)
        if ! gunzip -c "$dl" > "$work/duckdb"; then
          echo "  FAIL $plat: giải nén gzip thất bại (bỏ qua)"
          rm -rf "$work"
          return 0
        fi
        src="$work/duckdb"
        ;;
    esac

    if [ -z "$src" ] || [ ! -f "$src" ]; then
      echo "  FAIL $plat: không tìm thấy binary duckdb trong $asset (bỏ qua)"
      rm -rf "$work"
      return 0
    fi

    # Đặt tên file embed: duckdb-<plat> hoặc duckdb-<plat>.exe
    if [ "$asset_os" = "windows" ]; then
      out_name="duckdb-${plat}.exe"
    else
      out_name="duckdb-${plat}"
    fi
    cp "$src" "$CLI_DIR/$out_name"
    chmod +x "$CLI_DIR/$out_name"
    echo "   OK -> $out_name"
    rm -rf "$work"
    return 0
  done

  echo "  FAIL $plat: không tải được binary cho release $RELEASE_VERSION (bỏ qua)"
  rm -rf "$work"
  return 0
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
echo "Kiểm tra binary của platform đang build (chạy được trên CPU máy này không?):"
host_os=$(uname -s | tr '[:upper:]' '[:lower:]')
host_arch=$(uname -m)
case "$host_os-$host_arch" in
  linux-x86_64)  tm_probe="duckdb-linux-amd64" ;;
  linux-aarch64|linux-arm64) tm_probe="duckdb-linux-arm64" ;;
  darwin-arm64)  tm_probe="duckdb-darwin-arm64" ;;
  darwin-x86_64) tm_probe="duckdb-darwin-amd64" ;;
  *)             tm_probe="" ;;
esac
if [ -n "$tm_probe" ] && [ -f "$CLI_DIR/$tm_probe" ]; then
  tm_out=$("$CLI_DIR/$tm_probe" --version 2>&1) \
    && echo "  $tm_probe -> $tm_out" \
    || echo "  $tm_probe -> LỖI: binary KHÔNG chạy được trên CPU máy này ($tm_out)"
else
  echo "  (bỏ qua: không có binary cho platform đang build)"
fi
echo ""
echo "Build daemon để nhúng CLI vào binary: ./scripts/build/build_daemon.sh"
