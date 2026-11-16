#!/bin/sh
# Trích lại wasm đã build sẵn từ một bản daemon release, đưa về src_wasm/pkg/.
#
# Vì sao cần?
# ------------
# `src_wasm/pkg/` là thư mục gitignored (~26 MB wasm đã build) nên clone mới
# KHÔNG có. Muốn build lại wasm thì phải cài cả Rust + wasm-pack + .NET SDK +
# trunk (nặng, chậm, tốn nhiều thời gian).
#
# Nhưng nếu đã có sẵn 1 bản daemon release (binary Go nhúng `dist/` qua
# //go:embed all:dist), ta lấy lại ĐÚNG wasm đã build sẵn trong đó — không
# cần toolchain, không cần mạng, và khớp 100% với bản release đó.
#
# Cách dùng:
#   ./scripts/utils/extract_wasm_from_binary.sh <binary> [version]
#   ./scripts/utils/extract_wasm_from_binary.sh /home/user/Exec/dev-tool-linux-22.0.4
#   ./scripts/utils/extract_wasm_from_binary.sh ./out/dev-tool-linux-22.0.4 22.0.4
#
# Kết quả: src_wasm/pkg/<rdp|ultraviewer|dotnet|cimbar|photocraft>/...
# (đúng cấu trúc viteStaticCopy mong đợi khi copy sang
#  dist/assets-wasm-<version>/<tên>/)
set -e

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
BINARY="$1"
PKG_DIR="$ROOT_DIR/src_wasm/pkg"

if [ -z "$BINARY" ]; then
    echo "Cách dùng: $0 <binary> [version]" >&2
    echo "Ví dụ: $0 ./out/dev-tool-linux-22.0.4" >&2
    exit 1
fi
if [ ! -f "$BINARY" ]; then
    echo "LỖI: không thấy file binary '$BINARY'" >&2
    exit 1
fi

# Nếu là archive (.tar.gz / .zip) thì giải nén ra temp rồi dùng binary bên trong.
WORK_DIR="$(mktemp -d "${TMPDIR:-/tmp}/tm-wasm-src.XXXXXX")"
EXTRACTED=""
cleanup() {
    rm -rf "$WORK_DIR"
    [ -n "$EXTRACTED" ] && rm -rf "$EXTRACTED"
}
trap cleanup EXIT INT TERM

case "$BINARY" in
    *.tar.gz|*.tgz|*.tar)
        echo "Giải nén $BINARY ..."
        tar -xf "$BINARY" -C "$WORK_DIR"
        ;;
    *.zip)
        echo "Giải nén $BINARY ..."
        unzip -oq "$BINARY" -d "$WORK_DIR"
        ;;
esac

# Tìm binary thật trong thư mục vừa giải nén (nếu có), ngược lại dùng file gốc.
FOUND="$(find "$WORK_DIR" -maxdepth 2 -type f -name 'dev-tool-*' ! -name '*.exe' 2>/dev/null | head -1)"
if [ -n "$FOUND" ]; then
    EXTRACTED="$FOUND"
    TARGET="$FOUND"
else
    TARGET="$BINARY"
fi

# Version: lấy từ tên file (dev-tool-linux-22.0.4 -> 22.0.4) nếu không truyền.
VERSION="${2:-}"
if [ -z "$VERSION" ]; then
    VERSION="$(basename "$TARGET" | sed -E 's/^dev-tool-(linux|mac-arm|window)-//; s/\.exe$//')"
fi
if [ -z "$VERSION" ]; then
    echo "LỖI: không xác định được version từ tên file '$TARGET'. Hãy truyền version." >&2
    exit 1
fi

PREFIX="dist/assets-wasm-${VERSION}/"

echo "Binary : $TARGET"
echo "Version: $VERSION"
echo "Prefix : $PREFIX"
echo ""

# Trích ra thư mục tạm trước để không phá src_wasm/pkg/ nếu binary sai version.
TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/tm-wasm-extract.XXXXXX")"
cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT INT TERM

python3 "$ROOT_DIR/scripts/utils/extract_go_embed.py" \
    "$TARGET" \
    "tm_core_service/internal/web.embeddedFiles" \
    "$TMP_DIR" \
    "$PREFIX"

if [ -z "$(ls -A "$TMP_DIR" 2>/dev/null)" ]; then
    echo "LỖI: không tìm thấy thư mục wasm '$PREFIX' trong binary." >&2
    echo "Có thể binary này dùng version khác. Xem danh sách folder:" >&2
    strings -n 8 "$TARGET" 2>/dev/null \
        | grep -oE "dist/assets-wasm-[0-9.]+" | sort -u | sed 's/^/    /' >&2
    exit 1
fi

echo ""
echo "Thay thế src_wasm/pkg/ ..."
rm -rf "$PKG_DIR"
mkdir -p "$PKG_DIR"
cp -R "$TMP_DIR/." "$PKG_DIR/"

echo ""
echo "Kết quả trong $PKG_DIR:"
du -sh "$PKG_DIR"/* | sed 's/^/    /'
echo ""
echo "Tiếp theo: npm run build   (viteStaticCopy lấy từ src_wasm/pkg/)"
