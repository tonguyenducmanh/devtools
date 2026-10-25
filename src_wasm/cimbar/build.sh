#!/bin/sh
# Tải wasm dựng sẵn của libcimbar (encoder + decoder) vào src_wasm/pkg/cimbar/.
#
# Vì sao không build từ source?
#   - C++ + OpenCV + emscripten, build rất nặng và cần docker/emsdk.
#   - Upstream đã phát hành wasm chính thức cho web encoder/decoder.
#   - Repo này chỉ cần 2 file glue + wasm; UI/worker tự viết.
#
# Nguồn: https://github.com/sz3/libcimbar (MPL-2.0), xem README.md cùng thư mục.
set -e

ROOT_DIR=$(cd "$(dirname "$0")/../.." && pwd)
DEST_DIR="$ROOT_DIR/src_wasm/pkg/cimbar"
VERSION="${CIMBAR_VERSION:-0.6.8}"
TARBALL_URL="https://github.com/sz3/libcimbar/releases/download/v${VERSION}/cimbar.wasm.tar.gz"

# Checksum của asset v0.6.8. Nếu đổi CIMBAR_VERSION thì bỏ qua kiểm tra (in cảnh báo).
EXPECTED_SHA256="0a14b63decd9404e7a319b4b0f5cd873eb6aa325f90df4e965305f523567c4a5"
EXPECTED_MD5="9c62f5dbffd3ac495b7a1cd7da9781ad"
# Checksum của 2 file sau khi giải nén (ổn định giữa các lần tải cùng version).
EXPECTED_MD5_WASM="611f3f1b05cbdcca543b65baff56bd2b"
EXPECTED_MD5_GLUE="d2a90a00da846cc04b7e480f63e16d4d"

# In MD5 của 1 file; rỗng nếu máy không có công cụ md5.
file_md5() {
    if command -v md5 >/dev/null 2>&1; then
        md5 -q "$1"
    elif command -v md5sum >/dev/null 2>&1; then
        md5sum "$1" | awk '{print $1}'
    fi
}

# In SHA256 của 1 file; rỗng nếu máy không có công cụ sha256.
file_sha256() {
    if command -v shasum >/dev/null 2>&1; then
        shasum -a 256 "$1" | awk '{print $1}'
    elif command -v sha256sum >/dev/null 2>&1; then
        sha256sum "$1" | awk '{print $1}'
    fi
}

# So checksum thực tế với mong đợi. $1=nhãn, $2=thực tế, $3=mong đợi
verify_checksum() {
    label="$1"
    actual="$2"
    expected="$3"
    if [ -z "$actual" ]; then
        echo "CẢNH BÁO: không tính được $label (thiếu md5/shasum)." >&2
        return 0
    fi
    if [ "$actual" != "$expected" ]; then
        echo "LỖI: $label không khớp." >&2
        echo "  mong đợi: $expected" >&2
        echo "  thực tế : $actual" >&2
        exit 1
    fi
    echo "    $label OK: $actual"
}

TMP_DIR=$(mktemp -d "${TMPDIR:-/tmp}/tm-cimbar.XXXXXX")
cleanup() {
    rm -rf "$TMP_DIR"
}
trap cleanup EXIT INT TERM

echo ">>> Tải cimbar v${VERSION}"
echo "    $TARBALL_URL"
curl -fL --retry 3 -o "$TMP_DIR/cimbar.wasm.tar.gz" "$TARBALL_URL"

if [ "$VERSION" = "0.6.8" ]; then
    echo ">>> Kiểm tra toàn vẹn"
    verify_checksum "SHA256 tarball" "$(file_sha256 "$TMP_DIR/cimbar.wasm.tar.gz")" "$EXPECTED_SHA256"
    verify_checksum "MD5 tarball" "$(file_md5 "$TMP_DIR/cimbar.wasm.tar.gz")" "$EXPECTED_MD5"
else
    echo "CẢNH BÁO: chưa có checksum cho v${VERSION}, bỏ qua kiểm tra toàn vẹn."
fi

echo ">>> Giải nén"
mkdir -p "$TMP_DIR/extract"
tar -xzf "$TMP_DIR/cimbar.wasm.tar.gz" -C "$TMP_DIR/extract"

GLUE_FILE=$(find "$TMP_DIR/extract" -type f -name 'cimbar_js.*.js' | head -1)
WASM_FILE=$(find "$TMP_DIR/extract" -type f -name 'cimbar_js.*.wasm' | head -1)
if [ -z "$GLUE_FILE" ] || [ -z "$WASM_FILE" ]; then
    echo "LỖI: không tìm thấy cimbar_js.*.js / .wasm trong release." >&2
    find "$TMP_DIR/extract" -type f >&2
    exit 1
fi

mkdir -p "$DEST_DIR"
cp "$GLUE_FILE" "$DEST_DIR/cimbar_js.js"
cp "$WASM_FILE" "$DEST_DIR/cimbar_js.wasm"

GLUE_MD5=$(file_md5 "$DEST_DIR/cimbar_js.js")
WASM_MD5=$(file_md5 "$DEST_DIR/cimbar_js.wasm")
if [ "$VERSION" = "0.6.8" ]; then
    echo ">>> Kiểm tra MD5 file sau giải nén"
    verify_checksum "MD5 cimbar_js.js" "$GLUE_MD5" "$EXPECTED_MD5_GLUE"
    verify_checksum "MD5 cimbar_js.wasm" "$WASM_MD5" "$EXPECTED_MD5_WASM"
fi

# LICENSE + NOTICE chỉ nằm trong src_wasm/cimbar (nguồn), KHÔNG copy vào pkg/
# để thư mục wasm deploy chỉ có đúng file cần dùng.
echo ">>> MD5: js=${GLUE_MD5} wasm=${WASM_MD5}"

# Luật 15 trong AGENTS.md: module wasm không được import từ module "env" (C library).
# Release chính thức của cimbar dùng emscripten + OpenCV nhưng các hàm C cần thiết
# đã được biên dịch vào wasm, không phải import "env". Đọc thẳng import section.
if command -v python3 >/dev/null 2>&1; then
    python3 - "$DEST_DIR/cimbar_js.wasm" <<'PY'
import sys

def read_uleb(data, pos):
    result = 0
    shift = 0
    while True:
        b = data[pos]
        pos += 1
        result |= (b & 0x7F) << shift
        if not (b & 0x80):
            return result, pos
        shift += 7

data = open(sys.argv[1], "rb").read()
if data[:4] != b"\x00asm":
    raise SystemExit("LỖI: không phải file wasm hợp lệ")
pos = 8
modules = set()
while pos < len(data):
    section_id = data[pos]
    pos += 1
    size, pos = read_uleb(data, pos)
    end = pos + size
    if section_id == 2:  # import section
        count, p = read_uleb(data, pos)
        for _ in range(count):
            n, p = read_uleb(data, p)
            modules.add(data[p:p + n].decode("utf-8", "replace"))
            p += n
            n, p = read_uleb(data, p)
            p += n
            kind = data[p]
            p += 1
            if kind == 0:
                _, p = read_uleb(data, p)
            elif kind == 1:
                p += 1  # element type
                flags, p = read_uleb(data, p)
                _, p = read_uleb(data, p)
                if flags & 1:
                    _, p = read_uleb(data, p)
            elif kind == 2:
                flags, p = read_uleb(data, p)
                _, p = read_uleb(data, p)
                if flags & 1:
                    _, p = read_uleb(data, p)
            elif kind == 3:
                p += 2
            else:
                raise SystemExit("LỖI: không đọc được import kind %d" % kind)
    pos = end

if "env" in modules:
    raise SystemExit("LỖI: wasm import từ module 'env' — module sẽ không load trong trình duyệt")
print("    import section OK:", ", ".join(sorted(modules)) or "(không có import)")
PY
fi

echo ">>> Xong: $DEST_DIR"
ls -lh "$DEST_DIR"
